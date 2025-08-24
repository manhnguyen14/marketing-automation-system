const emailQueueService = require('../../database/services/emailQueueService');
const templateGenerationService = require('../services/templateGenerationService');

class QueueController {
    /**
     * Get email queue items with filtering
     * GET /api/pipeline.js/queue
     */
    async getQueueItems(req, res) {
        try {
            const {
                status,
                pipelineName,
                limit = 50,
                offset = 0
            } = req.query;

            console.log('📋 Retrieving email queue items');

            let queueItems = [];

            if (status) {
                queueItems = await emailQueueService.getQueueItemsByStatus(status, parseInt(limit));
            } else if (pipelineName) {
                queueItems = await emailQueueService.getQueueItemsByPipeline(pipelineName, {
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                });
            } else {
                // Get all statuses with limited items each
                const allStatuses = ['WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED', 'SENT', 'FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'];
                const itemsPerStatus = Math.ceil(parseInt(limit) / allStatuses.length);

                for (const statusItem of allStatuses) {
                    const items = await emailQueueService.getQueueItemsByStatus(statusItem, itemsPerStatus);
                    queueItems.push(...items);
                }
            }

            const totalCount = await emailQueueService.getQueueCount({
                status,
                pipelineName
            });

            res.json({
                success: true,
                data: {
                    queueItems: queueItems.map(item => item.toJSON()),
                    pagination: {
                        total: totalCount,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: (parseInt(offset) + queueItems.length) < totalCount
                    },
                    filters: {
                        status,
                        pipelineName
                    }
                },
                message: 'Queue items retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get queue items:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue items',
                details: error.message
            });
        }
    }

    /**
     * Get queue item by ID
     * GET /api/pipeline.js/queue/:id
     */
    async getQueueItemById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Queue item ID is required'
                });
            }

            console.log(`📄 Retrieving queue item: ${id}`);

            const queueItem = await emailQueueService.getQueueItemById(id);

            if (!queueItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Queue item not found'
                });
            }

            res.json({
                success: true,
                data: queueItem.toJSON(),
                message: 'Queue item retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get queue item:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue item',
                details: error.message
            });
        }
    }

    /**
     * Update queue item status
     * PUT /api/pipeline.js/queue/:id/status
     */
    async updateQueueItemStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, scheduledDate } = req.body;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'Queue item ID is required'
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
            }

            const validStatuses = ['WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED', 'SENT', 'FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            console.log(`✏️ Updating queue item ${id} status to ${status}`);

            const updateData = { status };
            if (status === 'SCHEDULED' && scheduledDate) {
                updateData.scheduled_date = new Date(scheduledDate);
            }

            const updatedItem = await emailQueueService.updateQueueItem(id, updateData);

            res.json({
                success: true,
                data: updatedItem.toJSON(),
                message: `Queue item status updated to ${status}`
            });

        } catch (error) {
            console.error('❌ Queue item status update failed:', error.message);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Queue item not found'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update queue item status',
                    details: error.message
                });
            }
        }
    }

    /**
     * Get queue statistics
     * GET /api/pipeline.js/queue/stats
     */
    async getQueueStats(req, res) {
        try {
            console.log('📊 Retrieving queue statistics');

            const stats = await emailQueueService.getQueueStats();
            const generationStats = await templateGenerationService.getGenerationStats();

            // Format stats for easier consumption
            const statusCounts = {};
            stats.forEach(stat => {
                statusCounts[stat.status] = parseInt(stat.count);
            });

            const summary = {
                total: stats.reduce((sum, stat) => sum + parseInt(stat.count), 0),
                pending: (statusCounts.WAIT_GENERATE_TEMPLATE || 0) + (statusCounts.PENDING_REVIEW || 0) + (statusCounts.SCHEDULED || 0),
                completed: statusCounts.SENT || 0,
                failed: (statusCounts.FAILED_GENERATE || 0) + (statusCounts.FAILED_SEND || 0) + (statusCounts.REJECTED_TEMPLATE || 0)
            };

            res.json({
                success: true,
                data: {
                    statusCounts,
                    summary,
                    templateGeneration: generationStats
                },
                message: 'Queue statistics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get queue statistics:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue statistics',
                details: error.message
            });
        }
    }

    /**
     * Trigger template generation scan
     * POST /api/pipeline.js/queue/generate-templates
     */
    async triggerTemplateGeneration(req, res) {
        try {
            const { batchSize = 20 } = req.body;

            console.log(`🤖 Triggering template generation scan (batch size: ${batchSize})`);

            if (templateGenerationService.isGenerationInProgress()) {
                return res.status(409).json({
                    success: false,
                    error: 'Template generation is already in progress'
                });
            }

            const result = await templateGenerationService.scanAndGenerateTemplates(parseInt(batchSize));

            res.json({
                success: true,
                data: result,
                message: 'Template generation scan completed'
            });

        } catch (error) {
            console.error('❌ Template generation scan failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Template generation scan failed',
                details: error.message
            });
        }
    }

    /**
     * Get templates waiting for review
     * GET /api/pipeline.js/queue/review
     */
    async getTemplatesForReview(req, res) {
        try {
            console.log('📋 Retrieving templates waiting for review');

            const templates = await templateGenerationService.getTemplatesWaitingReview();

            res.json({
                success: true,
                data: {
                    templates,
                    count: templates.length
                },
                message: 'Templates waiting for review retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get templates for review:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve templates for review',
                details: error.message
            });
        }
    }

    /**
     * Approve template
     * POST /api/pipeline.js/queue/review/:templateCode/approve
     */
    async approveTemplate(req, res) {
        try {
            const { templateCode } = req.params;
            const { scheduledDate } = req.body;

            if (!templateCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Template code is required'
                });
            }

            console.log(`✅ Approving template: ${templateCode}`);

            const scheduleDate = scheduledDate ? new Date(scheduledDate) : new Date();
            const result = await templateGenerationService.approveTemplate(templateCode, scheduleDate);

            res.json({
                success: true,
                data: result,
                message: 'Template approved successfully'
            });

        } catch (error) {
            console.error('❌ Template approval failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Template approval failed',
                details: error.message
            });
        }
    }

    /**
     * Reject template
     * POST /api/pipeline.js/queue/review/:templateCode/reject
     */
    async rejectTemplate(req, res) {
        try {
            const { templateCode } = req.params;
            const { reason = 'Content not approved' } = req.body;

            if (!templateCode) {
                return res.status(400).json({
                    success: false,
                    error: 'Template code is required'
                });
            }

            console.log(`❌ Rejecting template: ${templateCode}`);

            const result = await templateGenerationService.rejectTemplate(templateCode, reason);

            res.json({
                success: true,
                data: result,
                message: 'Template rejected successfully'
            });

        } catch (error) {
            console.error('❌ Template rejection failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Template rejection failed',
                details: error.message
            });
        }
    }

    /**
     * Get scheduled items ready to send
     * GET /api/pipeline.js/queue/scheduled
     */
    async getScheduledItems(req, res) {
        try {
            const { limit = 100 } = req.query;

            console.log('📅 Retrieving scheduled items ready to send');

            const scheduledItems = await emailQueueService.getScheduledItems(new Date(), parseInt(limit));

            res.json({
                success: true,
                data: {
                    scheduledItems: scheduledItems.map(item => item.toJSON()),
                    count: scheduledItems.length,
                    readyToSend: scheduledItems.filter(item => item.isReadyToSend()).length
                },
                message: 'Scheduled items retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get scheduled items:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve scheduled items',
                details: error.message
            });
        }
    }
}

module.exports = new QueueController();