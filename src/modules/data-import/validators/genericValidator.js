const database = require('../../../core/database');
const importConfigs = require('../config/importConfigs');

class GenericValidator {
    /**
     * Validate individual row data using entity configuration
     */
    async validateRowData(rowData, rowIndex, importMode, entityName, uniqueFieldTracker) {
        const config = importConfigs.getConfig(entityName);
        const errors = [];

        // Trim all string fields
        const trimmedData = this.trimRowData(rowData);

        // Validate based on import mode
        if (importMode === `add_${entityName}`) {
            const addValidation = await this.validateAddModeRow(trimmedData, rowIndex, config, uniqueFieldTracker);
            errors.push(...addValidation.errors);
        } else if (importMode === `update_${entityName}`) {
            const updateValidation = await this.validateUpdateModeRow(trimmedData, rowIndex, config, uniqueFieldTracker);
            errors.push(...updateValidation.errors);
        }

        // Common field validations
        const fieldValidation = this.validateFields(trimmedData, rowIndex, config);
        errors.push(...fieldValidation.errors);

        return {
            isValid: errors.length === 0,
            errors,
            trimmedData
        };
    }

    /**
     * Validate row for Add mode
     */
    async validateAddModeRow(rowData, rowIndex, config, uniqueFieldTracker) {
        const errors = [];

        // Check required fields
        config.requiredFields.add.forEach(field => {
            if (!rowData[field] || rowData[field] === '') {
                errors.push(`Row ${rowIndex}: ${field} is required for Add ${config.entityName} mode`);
            }
        });

        // Validate unique fields
        if (config.uniqueFields) {
            for (const uniqueConstraint of config.uniqueFields) {
                if (uniqueConstraint.field) {
                    // Single field uniqueness
                    await this.validateSingleFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors);
                } else if (uniqueConstraint.fields) {
                    // Compound field uniqueness
                    await this.validateCompoundFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors);
                }
            }
        }

        return { errors };
    }

    /**
     * Validate row for Update mode
     */
    async validateUpdateModeRow(rowData, rowIndex, config, uniqueFieldTracker) {
        const errors = [];

        // Primary key is required for update mode
        if (!rowData[config.primaryKey] || rowData[config.primaryKey] === '') {
            errors.push(`Row ${rowIndex}: ${config.primaryKey} is required for Update ${config.entityName} mode`);
            return { errors };
        }

        // Validate primary key format
        const primaryKeyValidation = this.validateField(rowData[config.primaryKey], config.fieldValidations[config.primaryKey], config.primaryKey);
        if (!primaryKeyValidation.isValid) {
            errors.push(`Row ${rowIndex}: ${primaryKeyValidation.error}`);
            return { errors };
        }

        // Check if record exists in database
        try {
            const service = database[config.serviceName];
            const getMethodName = `get${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}ById`;

            if (service && service[getMethodName]) {
                const existingRecord = await service[getMethodName](rowData[config.primaryKey]);
                if (!existingRecord) {
                    errors.push(`Row ${rowIndex}: ${config.primaryKey} not found in database: ${rowData[config.primaryKey]}`);
                    return { errors };
                }

                // Validate unique fields if being updated
                if (config.uniqueFields) {
                    for (const uniqueConstraint of config.uniqueFields) {
                        if (uniqueConstraint.field) {
                            await this.validateSingleFieldUniquenessForUpdate(rowData, rowIndex, uniqueConstraint, config, existingRecord, uniqueFieldTracker, errors);
                        } else if (uniqueConstraint.fields) {
                            await this.validateCompoundFieldUniquenessForUpdate(rowData, rowIndex, uniqueConstraint, config, existingRecord, uniqueFieldTracker, errors);
                        }
                    }
                }
            }
        } catch (dbError) {
            errors.push(`Row ${rowIndex}: Database error checking ${config.entityName}: ${dbError.message}`);
        }

        return { errors };
    }

    /**
     * Validate single field uniqueness (e.g., email)
     */
    async validateSingleFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors) {
        const field = uniqueConstraint.field;
        const value = rowData[field];

        if (value) {
            // Check for duplicate within CSV
            const trackingKey = `${field}:${value.toLowerCase()}`;
            if (uniqueFieldTracker.has(trackingKey)) {
                errors.push(`Row ${rowIndex}: Duplicate ${field} found within CSV file: ${value}`);
            } else {
                uniqueFieldTracker.add(trackingKey);
            }

            // Check for duplicate in database
            try {
                const service = database[config.serviceName];
                if (service && service[uniqueConstraint.checkMethod]) {
                    const existingRecord = await service[uniqueConstraint.checkMethod](value);
                    if (existingRecord) {
                        errors.push(`Row ${rowIndex}: ${uniqueConstraint.message}: ${value}`);
                    }
                }
            } catch (dbError) {
                errors.push(`Row ${rowIndex}: Database error checking ${field} uniqueness: ${dbError.message}`);
            }
        }
    }

    /**
     * Validate compound field uniqueness (e.g., title + author)
     */
    async validateCompoundFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors) {
        const fields = uniqueConstraint.fields;
        const values = fields.map(field => rowData[field]).filter(v => v);

        if (values.length === fields.length) {
            // Check for duplicate within CSV
            const trackingKey = fields.map(field => `${field}:${rowData[field].toLowerCase()}`).join('|');
            if (uniqueFieldTracker.has(trackingKey)) {
                errors.push(`Row ${rowIndex}: Duplicate ${fields.join(' + ')} combination found within CSV file`);
            } else {
                uniqueFieldTracker.add(trackingKey);
            }

            // Check for duplicate in database
            try {
                const service = database[config.serviceName];
                if (service && service[uniqueConstraint.checkMethod]) {
                    const existingRecord = await service[uniqueConstraint.checkMethod](...values);
                    if (existingRecord) {
                        errors.push(`Row ${rowIndex}: ${uniqueConstraint.message}`);
                    }
                }
            } catch (dbError) {
                errors.push(`Row ${rowIndex}: Database error checking ${fields.join(' + ')} uniqueness: ${dbError.message}`);
            }
        }
    }

    /**
     * Validate single field uniqueness for updates
     */
    async validateSingleFieldUniquenessForUpdate(rowData, rowIndex, uniqueConstraint, config, existingRecord, uniqueFieldTracker, errors) {
        const field = uniqueConstraint.field;
        const value = rowData[field];
        const existingValue = existingRecord[this.toCamelCase(field)];

        if (value && value !== '' && value !== existingValue) {
            // Field is being changed - validate uniqueness
            await this.validateSingleFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors);
        }
    }

    /**
     * Validate compound field uniqueness for updates
     */
    async validateCompoundFieldUniquenessForUpdate(rowData, rowIndex, uniqueConstraint, config, existingRecord, uniqueFieldTracker, errors) {
        const fields = uniqueConstraint.fields;
        const hasChanges = fields.some(field => {
            const newValue = rowData[field];
            const existingValue = existingRecord[this.toCamelCase(field)];
            return newValue && newValue !== '' && newValue !== existingValue;
        });

        if (hasChanges) {
            // At least one field is being changed - validate compound uniqueness
            await this.validateCompoundFieldUniqueness(rowData, rowIndex, uniqueConstraint, config, uniqueFieldTracker, errors);
        }
    }

    /**
     * Validate all fields using configuration
     */
    validateFields(rowData, rowIndex, config) {
        const errors = [];

        Object.keys(config.fieldValidations).forEach(field => {
            if (rowData[field] !== undefined && rowData[field] !== '') {
                const fieldConfig = config.fieldValidations[field];
                const validation = this.validateField(rowData[field], fieldConfig, field);

                if (!validation.isValid) {
                    errors.push(`Row ${rowIndex}: ${validation.error}`);
                }
            }
        });

        return { errors };
    }

    /**
     * Validate individual field based on configuration
     */
    validateField(value, fieldConfig, fieldName) {
        switch (fieldConfig.type) {
            case 'email':
                return this.validateEmail(value);
            case 'string':
                return this.validateString(value, fieldConfig, fieldName);
            case 'integer':
                return this.validateInteger(value, fieldName);
            case 'enum':
                return this.validateEnum(value, fieldConfig, fieldName);
            case 'array':
                return this.validateArray(value, fieldConfig, fieldName);
            default:
                return { isValid: true };
        }
    }

    validateEmail(email) {
        if (email.length > 255) {
            return { isValid: false, error: 'Email exceeds maximum length of 255 characters' };
        }

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, error: 'Invalid email format' };
        }

        return { isValid: true };
    }

    validateString(value, fieldConfig, fieldName) {
        if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
            return { isValid: false, error: `${fieldName} exceeds maximum length of ${fieldConfig.maxLength} characters` };
        }
        return { isValid: true };
    }

    validateInteger(value, fieldName) {
        const num = parseInt(value);
        if (isNaN(num) || num <= 0 || !Number.isInteger(parseFloat(value))) {
            return { isValid: false, error: `${fieldName} must be a positive integer` };
        }
        return { isValid: true };
    }

    validateEnum(value, fieldConfig, fieldName) {
        const normalizedValue = value.toLowerCase();
        if (!fieldConfig.values.includes(normalizedValue)) {
            return {
                isValid: false,
                error: `Invalid ${fieldName} value: ${value}. Must be one of: ${fieldConfig.values.join(', ')}`
            };
        }
        return { isValid: true };
    }

    validateArray(value, fieldConfig, fieldName) {
        try {
            const items = value.split(fieldConfig.separator || ',').map(item => item.trim()).filter(item => item !== '');

            if (fieldConfig.maxItems && items.length > fieldConfig.maxItems) {
                return {
                    isValid: false,
                    error: `${fieldName} exceeds maximum of ${fieldConfig.maxItems} items`
                };
            }

            if (fieldConfig.maxItemLength) {
                for (let item of items) {
                    if (item.length > fieldConfig.maxItemLength) {
                        return {
                            isValid: false,
                            error: `${fieldName} item "${item}" exceeds maximum length of ${fieldConfig.maxItemLength} characters`
                        };
                    }
                }
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: `Invalid ${fieldName} format: ${error.message}`
            };
        }
    }

    trimRowData(rowData) {
        const trimmed = {};
        Object.keys(rowData).forEach(key => {
            const value = rowData[key];
            trimmed[key] = typeof value === 'string' ? value.trim() : value;
        });
        return trimmed;
    }

    buildErrorReport(originalHeaders, failedRows) {
        if (failedRows.length === 0) return '';

        const errorHeaders = [...originalHeaders, 'Error_Message'];
        const csvLines = [errorHeaders.join(',')];

        failedRows.forEach(failedRow => {
            const rowValues = originalHeaders.map(header => {
                const value = failedRow.data[header] || '';
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });

            const errorMessage = failedRow.errors.join('; ');
            const escapedError = errorMessage.includes(',') || errorMessage.includes('"') || errorMessage.includes('\n')
                ? `"${errorMessage.replace(/"/g, '""')}"`
                : errorMessage;

            rowValues.push(escapedError);
            csvLines.push(rowValues.join(','));
        });

        return csvLines.join('\n');
    }

    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }
}

module.exports = new GenericValidator();