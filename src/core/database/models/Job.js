class Job {
    constructor(data = {}) {
        this.jobId = data.job_id || null;
        this.pipelineName = data.pipeline_name || '';
        this.actionTag = data.action_tag || '';
        this.scheduledTime = data.scheduled_time || null;
        this.status = data.status || 'NEW';
        this.description = data.description || '';
        this.metadata = data.metadata || {};
        this.successCount = data.success_count || 0;
        this.failCount = data.fail_count || 0;
        this.createdAt = data.created_at || null;
        this.startedAt = data.started_at || null;
        this.completedAt = data.completed_at || null;
    }

    // Status checking methods
    isNew() {
        return this.status === 'NEW';
    }

    isRunning() {
        return this.status === 'RUNNING';
    }

    isDone() {
        return this.status === 'DONE';
    }

    isFailed() {
        return this.status === 'FAILED';
    }

    isCompleted() {
        return this.isDone() || this.isFailed();
    }

    canExecute() {
        return this.isNew() && this.isScheduledToRun();
    }

    canRetry() {
        return this.isFailed();
    }

    // Scheduling methods
    isScheduledToRun(currentTime = new Date()) {
        if (!this.scheduledTime) return false;
        return new Date(this.scheduledTime) <= currentTime;
    }

    isDue(currentTime = new Date()) {
        return this.isNew() && this.isScheduledToRun(currentTime);
    }

    getTimeUntilExecution() {
        if (!this.scheduledTime) return null;

        const now = new Date();
        const scheduled = new Date(this.scheduledTime);
        const diff = scheduled.getTime() - now.getTime();

        return diff > 0 ? diff : 0;
    }

    // Performance methods
    getTotalProcessed() {
        return this.successCount + this.failCount;
    }

    getSuccessRate() {
        const total = this.getTotalProcessed();
        if (total === 0) return 0;
        return (this.successCount / total) * 100;
    }

    hasPartialFailure() {
        return this.isDone() && this.failCount > 0;
    }

    // Duration methods
    getExecutionDuration() {
        if (!this.startedAt || !this.completedAt) return null;

        const started = new Date(this.startedAt);
        const completed = new Date(this.completedAt);

        return completed.getTime() - started.getTime();
    }

    getExecutionDurationSeconds() {
        const duration = this.getExecutionDuration();
        return duration ? Math.round(duration / 1000) : null;
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.pipelineName || this.pipelineName.trim().length === 0) {
            errors.push('Pipeline name is required');
        }

        if (!this.scheduledTime) {
            errors.push('Scheduled time is required');
        }

        if (!['NEW', 'RUNNING', 'DONE', 'FAILED'].includes(this.status)) {
            errors.push('Status must be NEW, RUNNING, DONE, or FAILED');
        }

        if (this.successCount < 0 || this.failCount < 0) {
            errors.push('Success and fail counts must be non-negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            job_id: this.jobId,
            pipeline_name: this.pipelineName,
            action_tag: this.actionTag,
            scheduled_time: this.scheduledTime,
            status: this.status,
            description: this.description,
            metadata: this.metadata,
            success_count: this.successCount,
            fail_count: this.failCount,
            created_at: this.createdAt,
            started_at: this.startedAt,
            completed_at: this.completedAt
        };
    }

    toJSON() {
        return {
            jobId: this.jobId,
            pipelineName: this.pipelineName,
            actionTag: this.actionTag,
            scheduledTime: this.scheduledTime,
            status: this.status,
            description: this.description,
            metadata: this.metadata,
            successCount: this.successCount,
            failCount: this.failCount,
            createdAt: this.createdAt,
            startedAt: this.startedAt,
            completedAt: this.completedAt,
            totalProcessed: this.getTotalProcessed(),
            successRate: this.getSuccessRate(),
            executionDurationSeconds: this.getExecutionDurationSeconds(),
            isDue: this.isDue(),
            canExecute: this.canExecute()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new Job(row);
    }

    static create(jobData) {
        const job = new Job(jobData);
        const validation = job.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return job;
    }

    // Status transition methods
    markAsRunning() {
        this.status = 'RUNNING';
        this.startedAt = new Date();
    }

    markAsDone(successCount = 0, failCount = 0) {
        this.status = 'DONE';
        this.completedAt = new Date();
        this.successCount = successCount;
        this.failCount = failCount;
    }

    markAsFailed(successCount = 0, failCount = 0, errorMessage = '') {
        this.status = 'FAILED';
        this.completedAt = new Date();
        this.successCount = successCount;
        this.failCount = failCount;

        if (errorMessage) {
            this.metadata = { ...this.metadata, error: errorMessage };
        }
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Retry job creation
    createRetryJob(delayMinutes = 30) {
        const retryTime = new Date();
        retryTime.setMinutes(retryTime.getMinutes() + delayMinutes);

        return new Job({
            pipeline_name: this.pipelineName,
            action_tag: this.actionTag,
            scheduled_time: retryTime,
            description: `RETRY: ${this.description}`,
            metadata: {
                ...this.metadata,
                originalJobId: this.jobId,
                retryAttempt: (this.metadata.retryAttempt || 0) + 1
            }
        });
    }
}

module.exports = Job;