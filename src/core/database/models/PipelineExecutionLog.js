class PipelineExecutionLog {
    constructor(data = {}) {
        this.id = data.id || null;
        this.pipelineName = data.pipeline_name || '';
        this.executionStep = data.execution_step || '';
        this.status = data.status || 'IN_PROGRESS';
        this.queueItemsCreated = data.queue_items_created || 0;
        this.executionData = data.execution_data || {};
        this.errorMessage = data.error_message || null;
        this.executionTimeMs = data.execution_time_ms || null;
        this.createdAt = data.created_at || null;
    }

    // Status checking methods
    isInProgress() {
        return this.status === 'IN_PROGRESS';
    }

    isSuccess() {
        return this.status === 'SUCCESS';
    }

    isFailed() {
        return this.status === 'FAILED';
    }

    isCompleted() {
        return this.isSuccess() || this.isFailed();
    }

    // Performance methods
    getExecutionTimeSeconds() {
        return this.executionTimeMs ? (this.executionTimeMs / 1000).toFixed(2) : null;
    }

    hasError() {
        return this.errorMessage !== null;
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.pipelineName || this.pipelineName.trim().length === 0) {
            errors.push('Pipeline name is required');
        }

        if (!['IN_PROGRESS', 'SUCCESS', 'FAILED'].includes(this.status)) {
            errors.push('Status must be IN_PROGRESS, SUCCESS, or FAILED');
        }

        if (this.queueItemsCreated < 0) {
            errors.push('Queue items created must be non-negative');
        }

        if (this.executionTimeMs !== null && this.executionTimeMs < 0) {
            errors.push('Execution time must be non-negative');
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
            pipeline_name: this.pipelineName,
            execution_step: this.executionStep,
            status: this.status,
            queue_items_created: this.queueItemsCreated,
            execution_data: this.executionData,
            error_message: this.errorMessage,
            execution_time_ms: this.executionTimeMs,
            created_at: this.createdAt
        };
    }

    toJSON() {
        return {
            id: this.id,
            pipelineName: this.pipelineName,
            executionStep: this.executionStep,
            status: this.status,
            queueItemsCreated: this.queueItemsCreated,
            executionData: this.executionData,
            errorMessage: this.errorMessage,
            executionTimeMs: this.executionTimeMs,
            executionTimeSeconds: this.getExecutionTimeSeconds(),
            createdAt: this.createdAt,
            isCompleted: this.isCompleted(),
            hasError: this.hasError()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new PipelineExecutionLog(row);
    }

    static create(logData) {
        const log = new PipelineExecutionLog(logData);
        const validation = log.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return log;
    }

    // Status update methods
    markSuccess(executionTimeMs = null, queueItemsCreated = 0) {
        this.status = 'SUCCESS';
        this.executionTimeMs = executionTimeMs;
        this.queueItemsCreated = queueItemsCreated;
    }

    markFailed(errorMessage, executionTimeMs = null) {
        this.status = 'FAILED';
        this.errorMessage = errorMessage;
        this.executionTimeMs = executionTimeMs;
    }

    // Helper methods
    static getValidStatuses() {
        return ['IN_PROGRESS', 'SUCCESS', 'FAILED'];
    }

    static createExecutionLog(pipelineName, executionStep = 'CREATE_QUEUE_ITEMS') {
        return new PipelineExecutionLog({
            pipeline_name: pipelineName,
            execution_step: executionStep,
            status: 'IN_PROGRESS',
            created_at: new Date()
        });
    }
}

module.exports = PipelineExecutionLog;