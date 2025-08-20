const database = require('../../../core/database');

class DataValidator {
    constructor() {
        this.errors = [];
    }

    /**
     * Validate individual row data (Stage 3 validation)
     * Returns validation result for single row
     */
    async validateRowData(rowData, rowIndex, importMode, existingEmails = new Set()) {
        const errors = [];

        // Trim all string fields
        const trimmedData = this.trimRowData(rowData);

        // Validate based on import mode
        if (importMode === 'add_customer') {
            const addValidation = await this.validateAddModeRow(trimmedData, rowIndex, existingEmails);
            errors.push(...addValidation.errors);
        } else if (importMode === 'update_customer') {
            const updateValidation = await this.validateUpdateModeRow(trimmedData, rowIndex, existingEmails);
            errors.push(...updateValidation.errors);
        }

        // Common field validations
        const fieldValidation = this.validateCommonFields(trimmedData, rowIndex);
        errors.push(...fieldValidation.errors);

        return {
            isValid: errors.length === 0,
            errors,
            trimmedData
        };
    }

    /**
     * Trim whitespace from all string fields in row data
     */
    trimRowData(rowData) {
        const trimmed = {};
        Object.keys(rowData).forEach(key => {
            const value = rowData[key];
            if (typeof value === 'string') {
                trimmed[key] = value.trim();
            } else {
                trimmed[key] = value;
            }
        });
        return trimmed;
    }

    /**
     * Validate row for Add New Records mode
     */
    async validateAddModeRow(rowData, rowIndex, existingEmails) {
        const errors = [];

        // Email is required for add mode
        if (!rowData.email || rowData.email === '') {
            errors.push(`Row ${rowIndex}: Email is required for Add New Records mode`);
            return { errors };
        }

        // Validate email format
        const emailValidation = this.validateEmailFormat(rowData.email);
        if (!emailValidation.isValid) {
            errors.push(`Row ${rowIndex}: ${emailValidation.error}`);
        }

        // Check for duplicate email within CSV
        if (existingEmails.has(rowData.email.toLowerCase())) {
            errors.push(`Row ${rowIndex}: Duplicate email found within CSV file: ${rowData.email}`);
        }

        // Check for duplicate email in database (business logic validation)
        if (emailValidation.isValid) {
            try {
                const existingCustomer = await database.customers.getCustomerByEmail(rowData.email);
                if (existingCustomer) {
                    errors.push(`Row ${rowIndex}: Email already exists in database: ${rowData.email}`);
                }
            } catch (dbError) {
                errors.push(`Row ${rowIndex}: Database error checking email uniqueness: ${dbError.message}`);
            }
        }

        return { errors };
    }

    /**
     * Validate row for Update Existing Records mode
     */
    async validateUpdateModeRow(rowData, rowIndex, existingEmails) {
        const errors = [];

        // Customer ID is required for update mode
        if (!rowData.customer_id || rowData.customer_id === '') {
            errors.push(`Row ${rowIndex}: Customer ID is required for Update Existing Records mode`);
            return { errors };
        }

        // Validate customer ID format
        const customerIdValidation = this.validateCustomerId(rowData.customer_id);
        if (!customerIdValidation.isValid) {
            errors.push(`Row ${rowIndex}: ${customerIdValidation.error}`);
            return { errors };
        }

        // Check if customer exists in database
        try {
            const existingCustomer = await database.customers.getCustomerById(rowData.customer_id);
            if (!existingCustomer) {
                errors.push(`Row ${rowIndex}: Customer ID not found in database: ${rowData.customer_id}`);
                return { errors };
            }

            // If email is being updated, validate uniqueness
            if (rowData.email && rowData.email !== '' && rowData.email !== existingCustomer.email) {
                const emailValidation = this.validateEmailFormat(rowData.email);
                if (!emailValidation.isValid) {
                    errors.push(`Row ${rowIndex}: ${emailValidation.error}`);
                } else {
                    // Check for duplicate email in database (excluding current customer)
                    const duplicateCustomer = await database.customers.getCustomerByEmail(rowData.email);
                    if (duplicateCustomer && duplicateCustomer.customerId !== parseInt(rowData.customer_id)) {
                        errors.push(`Row ${rowIndex}: Email already exists for another customer: ${rowData.email}`);
                    }

                    // Check for duplicate email within CSV
                    if (existingEmails.has(rowData.email.toLowerCase())) {
                        errors.push(`Row ${rowIndex}: Duplicate email found within CSV file: ${rowData.email}`);
                    }
                }
            }
        } catch (dbError) {
            errors.push(`Row ${rowIndex}: Database error checking customer: ${dbError.message}`);
        }

        return { errors };
    }

    /**
     * Validate common fields (name, status, topics_of_interest)
     */
    validateCommonFields(rowData, rowIndex) {
        const errors = [];

        // Validate name field
        if (rowData.name && rowData.name.length > 255) {
            errors.push(`Row ${rowIndex}: Name exceeds maximum length of 255 characters`);
        }

        // Validate status field
        if (rowData.status && rowData.status !== '') {
            const statusValidation = this.validateStatus(rowData.status);
            if (!statusValidation.isValid) {
                errors.push(`Row ${rowIndex}: ${statusValidation.error}`);
            }
        }

        // Validate topics_of_interest field
        if (rowData.topics_of_interest && rowData.topics_of_interest !== '') {
            const topicsValidation = this.validateTopicsOfInterest(rowData.topics_of_interest);
            if (!topicsValidation.isValid) {
                errors.push(`Row ${rowIndex}: ${topicsValidation.error}`);
            }
        }

        return { errors };
    }

    /**
     * Validate email format
     */
    validateEmailFormat(email) {
        if (!email || email.trim() === '') {
            return { isValid: false, error: 'Email cannot be empty' };
        }

        if (email.length > 255) {
            return { isValid: false, error: 'Email exceeds maximum length of 255 characters' };
        }

        // RFC 5322 compliant email regex (simplified)
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }

        return { isValid: true };
    }

    /**
     * Validate customer ID format
     */
    validateCustomerId(customerId) {
        if (!customerId || customerId === '') {
            return { isValid: false, error: 'Customer ID cannot be empty' };
        }

        const id = parseInt(customerId);
        if (isNaN(id) || id <= 0 || !Number.isInteger(parseFloat(customerId))) {
            return { isValid: false, error: 'Customer ID must be a positive integer' };
        }

        return { isValid: true };
    }

    /**
     * Validate status field
     */
    validateStatus(status) {
        const validStatuses = ['active', 'inactive'];
        const normalizedStatus = status.toLowerCase();

        if (!validStatuses.includes(normalizedStatus)) {
            return {
                isValid: false,
                error: `Invalid status value: ${status}. Must be 'active' or 'inactive'`
            };
        }

        return { isValid: true };
    }

    /**
     * Validate topics of interest format
     */
    validateTopicsOfInterest(topics) {
        if (!topics || topics.trim() === '') {
            return { isValid: true }; // Empty is valid
        }

        try {
            // Parse topics as comma-separated values
            const topicsArray = topics.split(',').map(topic => topic.trim()).filter(topic => topic !== '');

            // Validate each topic
            for (let topic of topicsArray) {
                if (topic.length > 100) {
                    return {
                        isValid: false,
                        error: `Topic "${topic}" exceeds maximum length of 100 characters`
                    };
                }
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: `Invalid topics format: ${error.message}`
            };
        }
    }

    /**
     * Build CSV error report maintaining original format
     */
    buildErrorReport(originalHeaders, failedRows) {
        if (failedRows.length === 0) {
            return '';
        }

        // Add Error_Message column to headers
        const errorHeaders = [...originalHeaders, 'Error_Message'];
        const csvLines = [errorHeaders.join(',')];

        // Add failed rows with error messages
        failedRows.forEach(failedRow => {
            const rowValues = originalHeaders.map(header => {
                const value = failedRow.data[header] || '';
                // Escape quotes and wrap in quotes if contains comma or quotes
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });

            // Add error message (escape and quote if needed)
            const errorMessage = failedRow.errors.join('; ');
            const escapedError = errorMessage.includes(',') || errorMessage.includes('"') || errorMessage.includes('\n')
                ? `"${errorMessage.replace(/"/g, '""')}"`
                : errorMessage;

            rowValues.push(escapedError);
            csvLines.push(rowValues.join(','));
        });

        return csvLines.join('\n');
    }

    /**
     * Parse topics string into array
     */
    parseTopics(topicsString) {
        if (!topicsString || topicsString.trim() === '') {
            return [];
        }

        return topicsString.split(',').map(topic => topic.trim()).filter(topic => topic !== '');
    }
}

module.exports = new DataValidator();