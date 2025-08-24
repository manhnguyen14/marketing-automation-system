const emailQueueService = require('../../database/services/emailQueueService');
const emailTemplateService = require('../../database/services/emailTemplateService');
const PipelineRegistry = require('./pipelineRegistry');
const config = require('../../../config');

class TemplateGenerationService {
    constructor() {
        this.isProcessing = false;
        this.maxRetries = parseInt(process.env.MAX_TEMPLATE_RETRIES) || 3;
        this.retryDelayMinutes = parseInt(process.env.TEMPLATE_RETRY_DELAY_MINUTES) || 10;
    }

    /**
     * Scan queue for items waiting for template generation
     * @param {number} batchSize - Number of items to process
     * @returns {Promise<Object>} Processing result
     */
    async scanAndGenerateTemplates(batchSize = 20) {
        if (this.isProcessing) {
            console.log('⚠️ Template generation already in progress, skipping scan');
            return { skipped: true, reason: 'Already processing' };
        }

        this.isProcessing = true;
        const startTime = Date.now();

        try {
            console.log('🔄 Scanning queue for template generation...');

            // Get queue items waiting for template generation
            const queueItems = await emailQueueService.getQueueItemsByStatus('WAIT_GENERATE_TEMPLATE', batchSize);

            if (queueItems.length === 0) {
                console.log('✅ No items waiting for template generation');
                return { processed: 0, message: 'No items to process' };
            }

            console.log(`🎯 Found ${queueItems.length} items waiting for template generation`);

            const results = {
                processed: 0,
                succeeded: 0,
                failed: 0,
                errors: []
            };

            // Process each queue item
            for (const queueItem of queueItems) {
                try {
                    results.processed++;
                    await this.generateTemplateForQueueItem(queueItem);
                    results.succeeded++;

                    console.log(`✅ Generated template for queue item ${queueItem.id}`);
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        queueItemId: queueItem.id,
                        customerId: queueItem.customerId,
                        error: error.message
                    });

                    console.error(`❌ Template generation failed for queue item ${queueItem.id}:`, error.message);

                    // Mark as failed in queue
                    await this.handleGenerationFailure(queueItem, error.message);
                }

                // Small delay between items
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const processingTime = Date.now() - startTime;
            console.log(`🎉 Template generation scan completed in ${(processingTime / 1000).toFixed(2)}s`);
            console.log(`   - Processed: ${results.processed}`);
            console.log(`   - Succeeded: ${results.succeeded}`);
            console.log(`   - Failed: ${results.failed}`);

            return {
                ...results,
                processingTimeMs: processingTime,
                batchSize: queueItems.length
            };

        } catch (error) {
            console.error('❌ Template generation scan failed:', error.message);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate template for a specific queue item
     * @param {Object} queueItem - Email queue item
     * @returns {Promise<Object>} Generation result
     */
    async generateTemplateForQueueItem(queueItem) {
        console.log(`🤖 Generating template for customer ${queueItem.customerId}, pipeline ${queueItem.pipelineName}`);

        // Get pipeline.js instance
        const pipeline = PipelineRegistry.createPipeline(queueItem.pipelineName); // ???? why create a new instance?
        const config = PipelineRegistry.getPipelineConfig(queueItem.pipelineName);

        // Verify pipeline.js supports AI generation
        if (config.templateType !== 'ai_generated') {
            throw new Error(`Pipeline ${queueItem.pipelineName} does not support AI template generation`);
        }

        // Check if pipeline.js implements generateTemplate method
        if (typeof pipeline.generateTemplate !== 'function') {
            throw new Error(`Pipeline ${queueItem.pipelineName} does not implement generateTemplate method`);
        }

        // Call pipeline.js's template generation method
        const result = await pipeline.generateTemplate(
            queueItem.customerId,
            queueItem.contextData,
            queueItem.id
        );

        if (!result.templateId) {
            throw new Error(result.error || 'Template generation returned no template ID');
        }

        // Update queue item with generated template
        await emailQueueService.markTemplateGenerated(queueItem.id, result.templateId);

        console.log(`📝 Template ${result.templateId} generated and queued for review`);

        return {
            queueItemId: queueItem.id,
            templateId: result.templateId,
            customerId: queueItem.customerId,
            pipelineName: queueItem.pipelineName
        };
    }

    /**
     * Handle template generation failure
     * @param {Object} queueItem - Email queue item
     * @param {string} errorMessage - Error message
     */
    async handleGenerationFailure(queueItem, errorMessage) {
        const shouldRetry = queueItem.retryCount < this.maxRetries;

        if (shouldRetry) {
            console.log(`🔄 Scheduling retry for queue item ${queueItem.id} (attempt ${queueItem.retryCount + 1}/${this.maxRetries})`);

            // Update retry count and error message, keep status as WAIT_GENERATE_TEMPLATE
            await emailQueueService.updateQueueItem(queueItem.id, {
                retry_count: queueItem.retryCount + 1,
                last_error: errorMessage
            });
        } else {
            console.log(`❌ Max retries reached for queue item ${queueItem.id}, marking as failed`);

            // Mark as permanently failed
            await emailQueueService.markFailed(queueItem.id, errorMessage, 'FAILED_GENERATE');
        }
    }

    /**
     * Get templates waiting for admin review
     * @returns {Promise<Array>} Templates waiting for review
     */
    async getTemplatesWaitingReview() {
        try {
            const templates = await emailTemplateService.getTemplatesWaitingReview();

            // Enrich with queue item information
            const enrichedTemplates = [];

            for (const template of templates) {
                // Find queue items using this template
                const queueItems = await emailQueueService.getQueueItemsByStatus('PENDING_REVIEW');
                const relatedItems = queueItems.filter(item => item.templateId === template.templateId);

                enrichedTemplates.push({
                    ...template.toJSON(),
                    queueItems: relatedItems.map(item => item.toJSON())
                });
            }

            return enrichedTemplates;
        } catch (error) {
            console.error('❌ Failed to get templates waiting for review:', error.message);
            throw error;
        }
    }

    /**
     * Approve AI-generated template
     * @param {number} templateId - Template ID
     * @param {Date} scheduledDate - When to schedule emails
     * @returns {Promise<Object>} Approval result
     */
    async approveTemplate(templateId, scheduledDate = new Date()) {
        try {
            console.log(`✅ Approving template ${templateId}`);

            // Update template status to APPROVED
            await emailTemplateService.approveTemplate(templateId);

            // Find and update related queue items
            const queueItems = await emailQueueService.getQueueItemsByStatus('PENDING_REVIEW');
            const relatedItems = queueItems.filter(item => item.templateId === templateId);

            const results = {
                templateId,
                approvedQueueItems: 0,
                scheduledDate
            };

            for (const item of relatedItems) {
                await emailQueueService.markApproved(item.id, scheduledDate);
                results.approvedQueueItems++;
            }

            console.log(`📬 Scheduled ${results.approvedQueueItems} emails for ${scheduledDate.toISOString()}`);

            return results;
        } catch (error) {
            console.error(`❌ Failed to approve template ${templateId}:`, error.message);
            throw error;
        }
    }

    /**
     * Reject AI-generated template
     * @param {number} templateId - Template ID
     * @param {string} reason - Rejection reason
     * @returns {Promise<Object>} Rejection result
     */
    async rejectTemplate(templateId, reason = 'Content not approved') {
        try {
            console.log(`❌ Rejecting template ${templateId}: ${reason}`);

            // Update template status to INACTIVE
            await emailTemplateService.updateTemplateStatus(templateId, 'INACTIVE');

            // Find and update related queue items
            const queueItems = await emailQueueService.getQueueItemsByStatus('PENDING_REVIEW');
            const relatedItems = queueItems.filter(item => item.templateId === templateId);

            const results = {
                templateId,
                rejectedQueueItems: 0,
                reason
            };

            for (const item of relatedItems) {
                await emailQueueService.updateStatus(item.id, 'REJECTED_TEMPLATE');
                results.rejectedQueueItems++;
            }

            console.log(`🚫 Rejected ${results.rejectedQueueItems} queue items`);

            return results;
        } catch (error) {
            console.error(`❌ Failed to reject template ${templateId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get template generation statistics
     * @returns {Promise<Object>} Generation statistics
     */
    async getGenerationStats() {
        try {
            const queueStats = await emailQueueService.getQueueStats();
            const templateStats = await emailTemplateService.getTemplateStats();

            // Count by status
            const statusCounts = {};
            queueStats.forEach(stat => {
                statusCounts[stat.status] = parseInt(stat.count);
            });

            // Count templates by status
            const templateCounts = {};
            templateStats.forEach(stat => {
                if (!templateCounts[stat.status]) {
                    templateCounts[stat.status] = 0;
                }
                templateCounts[stat.status] += parseInt(stat.count);
            });

            return {
                queueStatus: statusCounts,
                templateStatus: templateCounts,
                pending: {
                    waitingGeneration: statusCounts.WAIT_GENERATE_TEMPLATE || 0,
                    pendingReview: statusCounts.PENDING_REVIEW || 0,
                    waitingReviewTemplates: templateCounts.WAIT_REVIEW || 0
                },
                processing: this.isProcessing,
                configuration: {
                    maxRetries: this.maxRetries,
                    retryDelayMinutes: this.retryDelayMinutes
                }
            };
        } catch (error) {
            console.error('❌ Failed to get generation stats:', error.message);
            throw error;
        }
    }

    /**
     * Check if template generation is in progress
     * @returns {boolean}
     */
    isGenerationInProgress() {
        return this.isProcessing;
    }
}

module.exports = new TemplateGenerationService();