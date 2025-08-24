class EmailQueueItem {
    constructor(data = {}) {
        this.id = data.id || null;
        this.customerId = data.customer_id || null;
        this.pipelineName = data.pipeline_name || '';
        this.status = data.status || 'WAIT_GENERATE_TEMPLATE';
        this.templateId = data.template_id || null;
        this.scheduledDate = data.scheduled_date || null;
        this.contextData = data.context_data || {};
        this.variables = data.variables || {};
        this.tag = data.tag || '';
        this.retryCount = data.retry_count || 0;
        this.lastError = data.last_error || null;
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
    }

    // Status checking methods
    isWaitingGeneration() {
        return this.status === 'WAIT_GENERATE_TEMPLATE';
    }

    isPendingReview() {
        return this.status === 'PENDING_REVIEW';
    }

    isScheduled() {
        return this.status === 'SCHEDULED';
    }

    isSent() {
        return this.status === 'SENT';
    }

    hasGenerationFailed() {
        return this.status === 'FAILED_GENERATE';
    }

    hasSendFailed() {
        return this.status === 'FAILED_SEND';
    }

    isRejected() {
        return this.status === 'REJECTED_TEMPLATE';
    }

    isReadyToSend() {
        return this.isScheduled() && this.isScheduledToSend();
    }

    canRetry() {
        return this.hasGenerationFailed() || this.hasSendFailed();
    }

    // Template methods
    hasTemplate() {
        return this.templateId !== null;
    }

    needsTemplate() {
        return this.isWaitingGeneration() && !this.hasTemplate();
    }

    // Scheduling methods
    isScheduledToSend(currentTime = new Date()) {
        if (!this.scheduledDate) return false;
        return new Date(this.scheduledDate) <= currentTime;
    }

    getTimeUntilScheduled() {
        if (!this.scheduledDate) return null;
        const now = new Date();
        const scheduled = new Date(this.scheduledDate);
        const diff = scheduled.getTime() - now.getTime();
        return diff > 0 ? diff : 0;
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.customerId) {
            errors.push('Customer ID is required');
        }

        if (!this.pipelineName || this.pipelineName.trim().length === 0) {
            errors.push('Pipeline name is required');
        }

        const validStatuses = [
            'WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED',
            'SENT', 'FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'
        ];
        if (!validStatuses.includes(this.status)) {
            errors.push(`Invalid status: ${this.status}`);
        }

        if (this.retryCount < 0) {
            errors.push('Retry count must be non-negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            id: this.id,
            customer_id: this.customerId,
            pipeline_name: this.pipelineName,
            status: this.status,
            template_id: this.templateId,
            scheduled_date: this.scheduledDate,
            context_data: this.contextData,
            variables: this.variables,
            tag: this.tag,
            retry_count: this.retryCount,
            last_error: this.lastError,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            customerId: this.customerId,
            pipelineName: this.pipelineName,
            status: this.status,
            templateId: this.templateId,
            scheduledDate: this.scheduledDate,
            contextData: this.contextData,
            variables: this.variables,
            tag: this.tag,
            retryCount: this.retryCount,
            lastError: this.lastError,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            hasTemplate: this.hasTemplate(),
            isReadyToSend: this.isReadyToSend(),
            canRetry: this.canRetry()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new EmailQueueItem(row);
    }

    static create(queueData) {
        const item = new EmailQueueItem(queueData);
        const validation = item.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return item;
    }

    // Status transition methods
    updateStatus(newStatus) {
        const validStatuses = [
            'WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED',
            'SENT', 'FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'
        ];

        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        this.status = newStatus;
        this.updatedAt = new Date();
    }

    markTemplateGenerated(templateId) {
        this.templateId = templateId;
        this.status = 'PENDING_REVIEW';
        this.updatedAt = new Date();
    }

    markApproved(scheduledDate = new Date()) {
        this.status = 'SCHEDULED';
        this.scheduledDate = scheduledDate;
        this.updatedAt = new Date();
    }

    markSent() {
        this.status = 'SENT';
        this.updatedAt = new Date();
    }

    markGenerationFailed(errorMessage) {
        this.status = 'FAILED_GENERATE';
        this.lastError = errorMessage;
        this.retryCount += 1;
        this.updatedAt = new Date();
    }

    markSendFailed(errorMessage) {
        this.status = 'FAILED_SEND';
        this.lastError = errorMessage;
        this.retryCount += 1;
        this.updatedAt = new Date();
    }

    markRejected() {
        this.status = 'REJECTED_TEMPLATE';
        this.updatedAt = new Date();
    }

    // Helper methods
    static getValidStatuses() {
        return [
            'WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED',
            'SENT', 'FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'
        ];
    }

    static getPendingStatuses() {
        return ['WAIT_GENERATE_TEMPLATE', 'PENDING_REVIEW', 'SCHEDULED'];
    }

    static getFailedStatuses() {
        return ['FAILED_GENERATE', 'FAILED_SEND', 'REJECTED_TEMPLATE'];
    }
}

module.exports = EmailQueueItem;