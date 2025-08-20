const csvImportService = require('../services/csvImportService');
const dataValidationService = require('../services/dataValidationService');

class ImportController {
    /**
     * Upload and process CSV file for customer import
     * POST /api/data-import/customers/upload
     */
    async uploadCustomerCSV(req, res) {
        try {
            // Check if import is already in progress
            if (csvImportService.isImportInProgress()) {
                return res.status(409).json({
                    success: false,
                    error: 'Import already in progress',
                    message: 'Please wait for the current import to complete before starting a new one.'
                });
            }

            // Validate request
            const { mode } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    message: 'Please select a CSV file to upload.'
                });
            }

            if (!mode) {
                return res.status(400).json({
                    success: false,
                    error: 'Import mode required',
                    message: 'Please select import mode (add or update).'
                });
            }

            // Validate file and import mode (Stages 1-2)
            const fileValidation = await dataValidationService.validateFileForImport(file, mode);

            if (!fileValidation.success) {
                return res.status(400).json({
                    success: false,
                    error: fileValidation.errors.join('; '),
                    stage: fileValidation.stage,
                    message: fileValidation.message
                });
            }

            // Process import
            const importResult = await csvImportService.importCustomerData(
                file.buffer,
                fileValidation.importMode
            );

            // Return results
            if (importResult.success) {
                return res.status(200).json({
                    success: true,
                    data: importResult.data,
                    error_report: importResult.error_report || null,
                    message: importResult.message
                });
            } else {
                // Stage 1-2 errors or system errors
                return res.status(400).json({
                    success: false,
                    error: importResult.error,
                    stage: importResult.stage,
                    message: importResult.message
                });
            }

        } catch (error) {
            console.error('Import controller error:', error);

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during import. Please try again.'
            });
        }
    }

    /**
     * Validate CSV file without importing (preview)
     * POST /api/data-import/customers/validate
     */
    async validateCSVFile(req, res) {
        try {
            const { mode } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                    message: 'Please select a CSV file to upload.'
                });
            }

            if (!mode) {
                return res.status(400).json({
                    success: false,
                    error: 'Import mode required',
                    message: 'Please select import mode (add or update).'
                });
            }

            // Validate file and get preview (Stages 1-3 without importing)
            const validation = await dataValidationService.validateFileForImport(file, mode);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.errors.join('; '),
                    stage: validation.stage,
                    message: validation.message
                });
            }

            // Get preview data without importing
            const preview = await csvImportService.getImportPreview(file.buffer, validation.importMode);

            return res.status(200).json({
                success: true,
                data: {
                    preview: preview.preview,
                    total_rows: preview.total_rows,
                    valid_rows: preview.valid_rows,
                    invalid_rows: preview.invalid_rows,
                    import_mode: validation.importMode
                },
                message: 'File validation completed successfully.'
            });

        } catch (error) {
            console.error('Validation controller error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during validation.'
            });
        }
    }

    /**
     * Get import configuration and limits
     * GET /api/data-import/customers/config
     */
    async getImportConfig(req, res) {
        try {
            const config = {
                max_file_size: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152, // 2MB
                max_file_size_mb: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
                supported_formats: ['csv'],
                supported_modes: ['add_customer', 'update_customer'],
                batch_size: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
                max_rows: parseInt(process.env.IMPORT_MAX_ROWS) || 10000,
                required_headers: {
                    add: ['email'],
                    update: ['customer_id']
                },
                optional_headers: ['name', 'status', 'topics_of_interest'],
                valid_status_values: ['active', 'inactive'],
                encoding: 'UTF-8',
                field_limits: {
                    email: 255,
                    name: 255,
                    topics_max_length: 100
                }
            };

            return res.status(200).json({
                success: true,
                data: config,
                message: 'Import configuration retrieved successfully.'
            });

        } catch (error) {
            console.error('Config controller error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Unable to retrieve import configuration.'
            });
        }
    }

    /**
     * Get import template CSV (empty template for user reference)
     * GET /api/data-import/customers/template
     */
    async getImportTemplate(req, res) {
        try {
            const { format = 'add_customer' } = req.query;

            if (!['add_customer', 'update_customer'].includes(format)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid format parameter',
                    message: 'Format must be "add_customer" or "update_customer".'
                });
            }

            const template = this.generateTemplateCSV(format);

            return res.status(200).json({
                success: true,
                data: {
                    csv_template: template,
                    format: format,
                    instructions: this.getTemplateInstructions(format)
                },
                message: `Import template generated for ${format} mode.`
            });

        } catch (error) {
            console.error('Template controller error:', error);

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Unable to generate import template.'
            });
        }
    }

    /**
     * Generate CSV template with example data
     */
    generateTemplateCSV(format) {
        let headers;
        let exampleRow;

        if (format === 'add_customer') {
            headers = ['email', 'name', 'status', 'topics_of_interest'];
            exampleRow = [
                'user@example.com',
                'John Doe',
                'active',
                '"technology,business"'
            ];
        } else {
            headers = ['customer_id', 'email', 'name', 'status', 'topics_of_interest'];
            exampleRow = [
                '1',
                'updated@example.com',
                'Updated Name',
                'inactive',
                '"technology,marketing"'
            ];
        }

        return [
            headers.join(','),
            exampleRow.join(',')
        ].join('\n');
    }

    /**
     * Get template instructions for format
     */
    getTemplateInstructions(format) {
        const commonInstructions = [
            'Save file with .csv extension',
            'Use UTF-8 encoding',
            'Maximum file size: 2MB',
            'Status must be "active" or "inactive"',
            'Topics should be comma-separated values in quotes',
            'Empty fields are allowed except for required fields'
        ];

        if (format === 'add_customer') {
            return [
                'Use this format for adding new customers',
                'Email field is required and must be unique',
                'All other fields are optional',
                ...commonInstructions
            ];
        } else {
            return [
                'Use this format for updating existing customers',
                'Customer ID is required and must exist in database',
                'Only provide fields you want to update',
                'Email must be unique if being changed',
                ...commonInstructions
            ];
        }
    }

    /**
     * Format error response for consistency
     */
    formatErrorResponse(error, stage = 'unknown', statusCode = 400) {
        return {
            success: false,
            error: error.message || error,
            stage,
            message: this.getErrorMessage(stage, error)
        };
    }

    /**
     * Get user-friendly error message based on stage
     */
    getErrorMessage(stage, error) {
        switch (stage) {
            case 'file_upload':
                return 'File upload validation failed. Please check file size and format.';
            case 'csv_structure':
                return 'CSV format validation failed. Please check file structure and headers.';
            case 'data_validation':
                return 'Data validation failed. Please check the error report for details.';
            case 'database':
                return 'Database operation failed. Please try again.';
            default:
                return 'An error occurred during import. Please try again.';
        }
    }
}

module.exports = new ImportController();