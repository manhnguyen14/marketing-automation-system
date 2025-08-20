const csv = require('csv-parser');
const { Readable } = require('stream');
const database = require('../../../core/database');
const genericValidator = require('../validators/genericValidator');
const csvValidator = require('../validators/csvValidator');
const importConfigs = require('../config/importConfigs');

class GenericImportService {
    constructor() {
        this.importInProgress = false;
        this.currentEntity = null;
    }

    /**
     * Main import function - works with any configured entity
     */
    async importData(fileBuffer, entityName, importMode) {
        if (this.importInProgress) {
            throw new Error('Import already in progress. Please wait for current import to complete.');
        }

        this.importInProgress = true;
        this.currentEntity = entityName;

        try {
            // Get entity configuration
            const config = importConfigs.getConfig(entityName);

            // Stage 1-2: File and CSV structure validation
            const structureValidation = await csvValidator.validateCSVStructure(fileBuffer, importMode, config);
            if (!structureValidation.isValid) {
                this.importInProgress = false;
                return {
                    success: false,
                    stage: 'file_validation',
                    error: structureValidation.errors.join('; '),
                    message: 'File validation failed. Please fix the issues and try again.'
                };
            }

            // Parse CSV data
            const parseResult = await this.parseCSVData(fileBuffer);
            if (!parseResult.success) {
                this.importInProgress = false;
                return {
                    success: false,
                    stage: 'csv_parsing',
                    error: parseResult.error,
                    message: 'CSV parsing failed. Please check file format and try again.'
                };
            }

            const { headers, rows } = parseResult.data;

            // Stage 3: Data validation and processing
            const processResult = await this.processRows(rows, headers, importMode, config);

            this.importInProgress = false;
            this.currentEntity = null;
            return processResult;

        } catch (error) {
            this.importInProgress = false;
            this.currentEntity = null;

            return {
                success: false,
                stage: 'system_error',
                error: error.message,
                message: 'System error occurred during import. Please try again.'
            };
        }
    }

    /**
     * Parse CSV file into headers and rows
     */
    async parseCSVData(fileBuffer) {
        return new Promise((resolve) => {
            const rows = [];
            let headers = [];
            let hasError = false;

            const stream = Readable.from(fileBuffer.toString('utf8'))
                .pipe(csv({
                    skipEmptyLines: true,
                    strict: false
                }));

            stream.on('headers', (parsedHeaders) => {
                headers = parsedHeaders.map(h => h.trim());
            });

            stream.on('data', (row) => {
                const cleanRow = {};
                Object.keys(row).forEach(key => {
                    const cleanKey = key.trim();
                    cleanRow[cleanKey] = typeof row[key] === 'string' ? row[key].trim() : row[key];
                });
                rows.push(cleanRow);
            });

            stream.on('error', (error) => {
                hasError = true;
                resolve({
                    success: false,
                    error: `CSV parsing error: ${error.message}`
                });
            });

            stream.on('end', () => {
                if (!hasError) {
                    resolve({
                        success: true,
                        data: { headers, rows }
                    });
                }
            });
        });
    }

    /**
     * Process rows with generic validation and database operations
     */
    async processRows(rows, headers, importMode, config) {
        const successfulRows = [];
        const failedRows = [];
        const uniqueFieldTracker = new Set();
        const batchSize = parseInt(process.env.IMPORT_BATCH_SIZE) || 100;

        // Process rows in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const batchResult = await this.processBatch(batch, i, importMode, config, uniqueFieldTracker);

            successfulRows.push(...batchResult.successful);
            failedRows.push(...batchResult.failed);
        }

        // Generate results
        const result = {
            success: true,
            data: {
                total_records: rows.length,
                successful_records: successfulRows.length,
                failed_records: failedRows.length,
                entity: config.entityName
            },
            message: this.generateResultMessage(successfulRows.length, failedRows.length, rows.length, config.entityName)
        };

        // Add error report if there are failed rows
        if (failedRows.length > 0) {
            result.error_report = genericValidator.buildErrorReport(headers, failedRows);
        }

        return result;
    }

    /**
     * Process a batch of rows
     */
    async processBatch(batch, startIndex, importMode, config, uniqueFieldTracker) {
        const successful = [];
        const failed = [];

        for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const rowIndex = startIndex + i + 2; // +2 for 1-based index and header row

            try {
                // Validate row data using generic validator
                const validation = await genericValidator.validateRowData(row, rowIndex, importMode, config.entityName, uniqueFieldTracker);

                if (!validation.isValid) {
                    failed.push({
                        data: row,
                        errors: validation.errors
                    });
                    continue;
                }

                // Row is valid - process it
                const processResult = await this.processValidRow(validation.trimmedData, importMode, config);

                if (processResult.success) {
                    successful.push({
                        data: validation.trimmedData,
                        result: processResult.data
                    });
                } else {
                    failed.push({
                        data: row,
                        errors: [processResult.error]
                    });
                }

            } catch (error) {
                failed.push({
                    data: row,
                    errors: [`Row ${rowIndex}: Unexpected error - ${error.message}`]
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Process a single valid row (database operations)
     */
    async processValidRow(rowData, importMode, config) {
        try {
            const service = database[config.serviceName];
            if (!service) {
                throw new Error(`Database service not found: ${config.serviceName}`);
            }

            if (importMode === `add_${config.entityName}`) {
                return await this.createRecord(rowData, config, service);
            } else if (importMode === `update_${config.entityName}`) {
                return await this.updateRecord(rowData, config, service);
            } else {
                throw new Error(`Invalid import mode: ${importMode}`);
            }
        } catch (error) {
            return {
                success: false,
                error: `Database operation failed: ${error.message}`
            };
        }
    }

    /**
     * Create new record - generic implementation
     */
    async createRecord(rowData, config, service) {
        const entityData = this.buildEntityData(rowData, config, 'add');

        // Use entity-specific create method
        const methodName = `create${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}`;
        const record = await service[methodName](entityData);

        return {
            success: true,
            data: {
                [config.primaryKey]: record[this.toCamelCase(config.primaryKey)],
                operation: 'created'
            }
        };
    }

    /**
     * Update existing record - generic implementation
     */
    async updateRecord(rowData, config, service) {
        const recordId = parseInt(rowData[config.primaryKey]);
        const updateData = this.buildEntityData(rowData, config, 'update');

        // Remove primary key from update data
        delete updateData[config.primaryKey];

        // Use entity-specific update method
        const methodName = `update${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}`;
        const record = await service[methodName](recordId, updateData);

        return {
            success: true,
            data: {
                [config.primaryKey]: record[this.toCamelCase(config.primaryKey)],
                operation: 'updated'
            }
        };
    }

    /**
     * Build entity data from row data using configuration
     */
    buildEntityData(rowData, config, mode) {
        const entityData = {};

        Object.keys(config.fieldValidations).forEach(field => {
            if (rowData[field] !== undefined) {
                const fieldConfig = config.fieldValidations[field];
                let value = rowData[field];

                // Apply field-specific transformations
                switch (fieldConfig.type) {
                    case 'array':
                        if (value && value !== '') {
                            entityData[field] = value.split(fieldConfig.separator || ',').map(item => item.trim()).filter(item => item !== '');
                        } else {
                            entityData[field] = [];
                        }
                        break;

                    case 'enum':
                        if (value && value !== '') {
                            entityData[field] = value.toLowerCase();
                        } else if (fieldConfig.default) {
                            entityData[field] = fieldConfig.default;
                        }
                        break;

                    case 'integer':
                        if (value && value !== '') {
                            entityData[field] = parseInt(value);
                        }
                        break;

                    default:
                        if (value !== undefined) {
                            entityData[field] = value || null;
                        }
                }
            }
        });

        return entityData;
    }

    /**
     * Generate result message
     */
    generateResultMessage(successful, failed, total, entityName) {
        const entityDisplayName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

        if (failed === 0) {
            return `${entityDisplayName} import completed successfully. All ${successful} records processed.`;
        } else if (successful === 0) {
            return `${entityDisplayName} import failed. All ${failed} records failed validation.`;
        } else {
            return `Partial ${entityName} import completed. ${successful} records processed successfully, ${failed} records failed validation.`;
        }
    }

    /**
     * Get import preview without actually importing
     */
    async getImportPreview(fileBuffer, entityName, importMode, previewRows = 5) {
        try {
            const config = importConfigs.getConfig(entityName);
            const parseResult = await this.parseCSVData(fileBuffer);

            if (!parseResult.success) {
                return { success: false, error: parseResult.error };
            }

            const { headers, rows } = parseResult.data;
            const previewData = rows.slice(0, previewRows);
            const uniqueFieldTracker = new Set();

            const previewValidation = [];
            for (let i = 0; i < previewData.length; i++) {
                const validation = await genericValidator.validateRowData(
                    previewData[i],
                    i + 2,
                    importMode,
                    config.entityName,
                    uniqueFieldTracker
                );

                previewValidation.push({
                    rowIndex: i + 2,
                    data: validation.trimmedData,
                    isValid: validation.isValid,
                    errors: validation.errors
                });
            }

            return {
                success: true,
                preview: previewValidation,
                total_rows: rows.length,
                valid_rows: previewValidation.filter(row => row.isValid).length,
                invalid_rows: previewValidation.filter(row => !row.isValid).length
            };

        } catch (error) {
            return {
                success: false,
                error: `Preview generation failed: ${error.message}`
            };
        }
    }

    /**
     * Utility method to convert snake_case to camelCase
     */
    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    /**
     * Check if import is in progress
     */
    isImportInProgress() {
        return this.importInProgress;
    }

    /**
     * Get current entity being imported
     */
    getCurrentEntity() {
        return this.currentEntity;
    }

    /**
     * Reset import state
     */
    resetProgress() {
        this.importInProgress = false;
        this.currentEntity = null;
    }
}

module.exports = new GenericImportService();