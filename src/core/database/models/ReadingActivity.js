class ReadingActivity {
    constructor(data = {}) {
        this.activityId = data.activity_id || null;
        this.customerId = data.customer_id || null;
        this.bookId = data.book_id || null;
        this.activityType = data.activity_type || '';
        this.progressPercentage = data.progress_percentage || 0;
        this.activityDate = data.activity_date || null;
    }

    // Business logic methods
    isCompleted() {
        return this.activityType === 'book_completed' || this.progressPercentage >= 100;
    }

    isStarted() {
        return this.activityType === 'book_started' || this.progressPercentage > 0;
    }

    isAbandoned() {
        return this.activityType === 'book_abandoned';
    }

    isRecentActivity(daysAgo = 7) {
        if (!this.activityDate) return false;

        const activityDate = new Date(this.activityDate);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

        return activityDate >= cutoffDate;
    }

    getProgressLevel() {
        if (this.progressPercentage === 0) return 'not_started';
        if (this.progressPercentage < 25) return 'just_started';
        if (this.progressPercentage < 50) return 'early_progress';
        if (this.progressPercentage < 75) return 'halfway';
        if (this.progressPercentage < 100) return 'almost_done';
        return 'completed';
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.customerId) {
            errors.push('Customer ID is required');
        }

        if (!this.bookId) {
            errors.push('Book ID is required');
        }

        if (!this.activityType) {
            errors.push('Activity type is required');
        } else if (!['chapter_read', 'book_started', 'book_completed', 'book_abandoned'].includes(this.activityType)) {
            errors.push('Activity type must be chapter_read, book_started, book_completed, or book_abandoned');
        }

        if (this.progressPercentage < 0 || this.progressPercentage > 100) {
            errors.push('Progress percentage must be between 0 and 100');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            activity_id: this.activityId,
            customer_id: this.customerId,
            book_id: this.bookId,
            activity_type: this.activityType,
            progress_percentage: this.progressPercentage,
            activity_date: this.activityDate
        };
    }

    toJSON() {
        return {
            activityId: this.activityId,
            customerId: this.customerId,
            bookId: this.bookId,
            activityType: this.activityType,
            progressPercentage: this.progressPercentage,
            activityDate: this.activityDate,
            isCompleted: this.isCompleted(),
            isStarted: this.isStarted(),
            isAbandoned: this.isAbandoned(),
            progressLevel: this.getProgressLevel()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new ReadingActivity(row);
    }

    static create(activityData) {
        const activity = new ReadingActivity(activityData);
        const validation = activity.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return activity;
    }

    // Update method
    update(updateData) {
        // Only update allowed fields
        const allowedFields = ['activity_type', 'progress_percentage'];

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                this[this._camelCase(key)] = updateData[key];
            }
        });

        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Static helper methods for analytics
    static getActivityTypeOrder() {
        return ['book_started', 'chapter_read', 'book_completed', 'book_abandoned'];
    }

    static isProgressionValid(currentType, newType) {
        const order = ReadingActivity.getActivityTypeOrder();
        const currentIndex = order.indexOf(currentType);
        const newIndex = order.indexOf(newType);

        // Allow any transition except backwards from completed
        if (currentType === 'book_completed' && newType !== 'book_completed') {
            return false;
        }

        return true;
    }
}

module.exports = ReadingActivity;