class PipelineInterface {
    constructor() {
        this.pipelineName = 'base_pipeline';
        this.templateType = 'predefined'; // 'predefined' or 'ai_generated'
        this.defaultTemplateCode = null;
    }

    /**
     * Main pipeline.js execution method - entry point
     * For now: calls createQueueItems()
     * Future: can include pre/post processing, validation, etc.
     * @returns {Promise<Object>} Pipeline execution result
     */
    async runPipeline() {
        throw new Error('runPipeline() must be implemented by pipeline.js classes');
    }

    /**
     * Create email queue items directly in database
     * Execute customer selection logic and insert email_queue_items
     * @returns {Promise<Object>} { created: number, failed: number, errors?: Array }
     */
    async createQueueItems() {
        throw new Error('createQueueItems() must be implemented by pipeline.js classes');
    }

    /**
     * Only for AI-generated template pipelines
     * Generate personalized template content using AI
     * @param {number} customerId - Customer ID for personalization
     * @param {Object} contextData - Pipeline-specific context data
     * @param {number} queueItemId - Queue item ID for tracking
     * @returns {Promise<Object>} { templateCode, retryAllowed, error?, nextScheduledDate? }
     */
    async generateTemplate(customerId, contextData, queueItemId) {
        if (this.templateType === 'predefined') {
            throw new Error('generateTemplate() not applicable for predefined template pipelines');
        }
        throw new Error('generateTemplate() must be implemented by AI template pipeline.js classes');
    }

    /**
     * Select target customers for this pipeline.js
     * Override this method to implement customer targeting logic
     * @returns {Promise<Array>} Array of customer objects
     */
    async selectTargetCustomers() {
        throw new Error('selectTargetCustomers() must be implemented by pipeline.js classes');
    }

    /**
     * Bulk create queue items helper method
     * @param {Array} queueItems - Array of queue item data objects
     * @returns {Promise<Object>} Bulk creation result
     */
    async bulkCreateQueueItems(queueItems) {
        const emailQueueService = require('../../database/services/emailQueueService');
        return await emailQueueService.bulkCreateQueueItems(queueItems);
    }

    /**
     * Get pipeline.js configuration
     * @returns {Object} Pipeline metadata
     */
    getPipelineInfo() {
        return {
            name: this.pipelineName,
            templateType: this.templateType,
            defaultTemplateCode: this.defaultTemplateCode,
            requiresAIGeneration: this.templateType === 'ai_generated',
            requiresReview: this.templateType === 'ai_generated'
        };
    }

    /**
     * Validate pipeline.js configuration
     * @returns {Object} { isValid: boolean, errors: Array }
     */
    validateConfig() {
        const errors = [];

        if (!this.pipelineName || this.pipelineName.trim().length === 0) {
            errors.push('Pipeline name is required');
        }

        if (!['predefined', 'ai_generated'].includes(this.templateType)) {
            errors.push('Template type must be predefined or ai_generated');
        }

        if (this.templateType === 'predefined' && !this.defaultTemplateCode) {
            errors.push('Default template code required for predefined template pipelines');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Helper method to create queue item data object
     * @param {Object} customer - Customer object
     * @param {Object} options - Additional queue item options
     * @returns {Object} Queue item data
     */
    createQueueItemData(customer, options = {}) {
        const baseData = {
            customer_id: customer.customerId || customer.customer_id,
            pipeline_name: this.pipelineName,
            context_data: options.contextData || {},
            variables: options.variables || {},
            tag: options.tag || this.pipelineName.toLowerCase(),
            scheduled_date: options.scheduledDate || new Date()
        };

        if (this.templateType === 'predefined') {
            return {
                ...baseData,
                status: 'SCHEDULED',
                template_code: this.defaultTemplateCode
            };
        } else {
            return {
                ...baseData,
                status: 'WAIT_GENERATE_TEMPLATE',
                template_code: null
            };
        }
    }

    /**
     * Helper method to get customer service
     */
    getCustomerService() {
        return require('../../database/services/customerService');
    }

    /**
     * Helper method to get book service
     */
    getBookService() {
        return require('../../database/services/bookService');
    }

    /**
     * Static method to get valid template types
     */
    static getValidTemplateTypes() {
        return ['predefined', 'ai_generated'];
    }

    /**
     * Static method to create pipeline.js instance
     * @param {string} pipelineName - Name of pipeline.js
     * @param {string} templateType - Template type
     * @param {string} defaultTemplateCode - Default template code (for predefined)
     */
    static create(pipelineName, templateType = 'predefined', defaultTemplateCode = null) {
        const pipeline = new this();
        pipeline.pipelineName = pipelineName;
        pipeline.templateType = templateType;
        pipeline.defaultTemplateCode = defaultTemplateCode;

        const validation = pipeline.validateConfig();
        if (!validation.isValid) {
            throw new Error(`Pipeline validation failed: ${validation.errors.join(', ')}`);
        }

        return pipeline;
    }
}

module.exports = PipelineInterface;