class Customer {
    constructor(data = {}) {
        this.customerId = data.customer_id || null;
        this.email = data.email || '';
        this.name = data.name || '';
        this.status = data.status || 'active';
        this.topicsOfInterest = data.topics_of_interest || [];
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
    }

    // Business logic methods
    isActive() {
        return this.status === 'active';
    }

    canReceiveEmails() {
        return this.status !== 'blacklisted';
    }

    hasTopicInterest(topic) {
        return this.topicsOfInterest.includes(topic);
    }

    hasAnyTopicInterest(topics) {
        return topics.some(topic => this.topicsOfInterest.includes(topic));
    }

    // Validation methods
    validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.email);
    }

    validate() {
        const errors = [];

        if (!this.email) {
            errors.push('Email is required');
        } else if (!this.validateEmail()) {
            errors.push('Invalid email format');
        }

        if (!['active', 'inactive', 'blacklisted'].includes(this.status)) {
            errors.push('Status must be active, inactive, or blacklisted');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            customer_id: this.customerId,
            email: this.email,
            name: this.name,
            status: this.status,
            topics_of_interest: this.topicsOfInterest,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            customerId: this.customerId,
            email: this.email,
            name: this.name,
            status: this.status,
            topicsOfInterest: this.topicsOfInterest,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isActive: this.isActive(),
            canReceiveEmails: this.canReceiveEmails()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new Customer(row);
    }

    static create(customerData) {
        const customer = new Customer(customerData);
        const validation = customer.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return customer;
    }

    // Update method
    update(updateData) {
        // Only update allowed fields
        const allowedFields = ['email', 'name', 'status', 'topics_of_interest'];

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key === 'topics_of_interest') {
                    this.topicsOfInterest = updateData[key] || [];
                } else {
                    this[this._camelCase(key)] = updateData[key];
                }
            }
        });

        this.updatedAt = new Date();

        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }
}

module.exports = Customer;