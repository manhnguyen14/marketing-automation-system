const csv = require('csv-parser');
const { Readable } = require('stream');
const database = require('../../../core/database');
const csvValidator = require('../validators/csvValidator');
const dataValidator = require('../validators/dataValidator');

class CSVImportService {
    constructor() {
        this.importInProgress = false;
    }

    /**
     * Main import function - processes CSV file with partial import support
     */
    async importCustomerData(fileBuffer, importMode) {
        if (this.importInProgress) {
            throw new Error('Import already in progress. Please wait for current import to complete.');
        }

        this.importInProgress = true;

        try {
            // Stage 1-2: File and CSV structure validation (fatal errors)
            const structureValidation = await csvValidator.validateCSVStructure(fileBuffer, importMode);
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

            // Stage 3: Data validation and processing (partial import)
            const processResult = await this.processRows(rows, headers, importMode);

            this.importInProgress = false;
            return processResult;

        } catch (error) {
            this.importInProgress = false;

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
                // Convert header keys to lowercase and trim values
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
     * Process rows with validation and database operations
     */
    async processRows(rows, headers, importMode) {
        const successfulRows = [];
        const failedRows = [];
        const existingEmails = new Set();
        const batchSize = 100; // Process in batches

        // Process rows in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const batchResult = await this.processBatch(batch, i, importMode, existingEmails);

            successfulRows.push(...batchResult.successful);
            failedRows.push(...batchResult.failed);
        }

        // Generate results
        const result = {
            success: true,
            data: {
                total_records: rows.length,
                successful_records: successfulRows.length,
                failed_records: failedRows.length
            },
            message: this.generateResultMessage(successfulRows.length, failedRows.length, rows.length)
        };

        // Add error report if there are failed rows
        if (failedRows.length > 0) {
            result.error_report = dataValidator.buildErrorReport(headers, failedRows);
        }

        return result;
    }

    /**
     * Process a batch of rows
     */
    async processBatch(batch, startIndex, importMode, existingEmails) {
        const successful = [];
        const failed = [];

        for (let i = 0; i < batch.length; i++) {
            const row = batch[i];
            const rowIndex = startIndex + i + 2; // +2 for 1-based index and header row

            try {
                // Validate row data
                const validation = await dataValidator.validateRowData(row, rowIndex, importMode, existingEmails);

                if (!validation.isValid) {
                    // Row failed validation - add to failed list
                    failed.push({
                        data: row,
                        errors: validation.errors
                    });
                    continue;
                }

                // Row is valid - process it
                const processResult = await this.processValidRow(validation.trimmedData, importMode);

                if (processResult.success) {
                    successful.push({
                        data: validation.trimmedData,
                        result: processResult.data
                    });

                    // Track email for duplicate detection within file
                    if (validation.trimmedData.email) {
                        existingEmails.add(validation.trimmedData.email.toLowerCase());
                    }
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
    async processValidRow(rowData, importMode) {
        try {
            if (importMode === 'add') {
                return await this.createCustomer(rowData);
            } else if (importMode === 'update') {
                return await this.updateCustomer(rowData);
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
     * Create new customer record
     */
    async createCustomer(rowData) {
        const customerData = {
            email: rowData.email,
            name: rowData.name || null,
            status: rowData.status ? rowData.status.toLowerCase() : 'active',
            topics_of_interest: rowData.topics_of_interest ?
                dataValidator.parseTopics(rowData.topics_of_interest) : []
        };

        const customer = await database.customers.createCustomer(customerData);

        return {
            success: true,
            data: {
                customer_id: customer.customerId,
                email: customer.email,
                operation: 'created'
            }
        };
    }

    /**
     * Update existing customer record
     */
    async updateCustomer(rowData) {
        const customerId = parseInt(rowData.customer_id);
        const updateData = {};

        // Only update fields that are provided and not empty
        if (rowData.email && rowData.email !== '') {
            updateData.email = rowData.email;
        }

        if (rowData.name !== undefined) {
            // Allow empty string to clear the name
            updateData.name = rowData.name || null;
        }

        if (rowData.status && rowData.status !== '') {
            updateData.status = rowData.status.toLowerCase();
        }

        if (rowData.topics_of_interest !== undefined) {
            // Allow empty string to clear topics
            updateData.topics_of_interest = rowData.topics_of_interest ?
                dataValidator.parseTopics(rowData.topics_of_interest) : [];
        }

        const customer = await database.customers.updateCustomer(customerId, updateData);

        return {
            success: true,
            data: {
                customer_id: customer.customerId,
                email: customer.email,
                operation: 'updated'
            }
        };
    }

    /**
     * Generate result message
     */
    generateResultMessage(successful, failed, total) {
        if (failed === 0) {
            return `Import completed successfully. All ${successful} records processed.`;
        } else if (successful === 0) {
            return `Import failed. All ${failed} records failed validation.`;
        } else {
            return `Partial import completed. ${successful} records processed successfully, ${failed} records failed validation.`;
        }
    }

    /**
     * Check if import is in progress
     */
    isImportInProgress() {
        return this.importInProgress;
    }

    /**
     * Reset import state
     */
    resetProgress() {
        this.importInProgress = false;
    }
}

module.exports = new CSVImportService();