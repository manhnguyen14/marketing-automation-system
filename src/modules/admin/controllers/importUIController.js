const dataImportModule = require('../../data-import');

/**
 * Render customer import interface
 * GET /admin/import/customers
 */
async function renderImportPage(req, res) {
    try {
        // Get import configuration for display
        const config = {
            maxFileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152,
            maxFileSizeMB: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
            batchSize: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
            allowedFormats: ['.csv'],
            importModes: [
                { value: 'add_customer', label: 'Add New Records', description: 'Create new customer records' },
                { value: 'update_customer', label: 'Update Existing Records', description: 'Update existing customer records' }
            ]
        };

        // Get current import status
        const importStatus = dataImportModule.services.csvImport.isImportInProgress();

        res.render('import-customers', {
            title: 'Customer Data Import',
            showNav: true,
            config,
            importStatus,
            // Flash messages from session
            successMessage: req.session.successMessage,
            errorMessage: req.session.errorMessage,
            errorReport: req.session.errorReport
        });

        // Clear flash messages after rendering (but keep errorReport)
        delete req.session.successMessage;
        delete req.session.errorMessage;

    } catch (error) {
        console.error('Import UI render error:', error);

        res.render('error', {
            title: 'Import Error',
            showNav: true,
            error: {
                message: 'Unable to load import interface',
                details: error.message
            }
        });
    }
}

/**
 * Handle CSV file upload from admin interface
 * POST /admin/import/customers/upload
 */
async function handleFileUpload(req, res) {
    try {
        const { mode } = req.body;
        const file = req.file;

        // Validate request
        if (!file) {
            req.session.errorMessage = 'Please select a CSV file to upload.';
            return res.redirect('/admin/import/customers');
        }

        if (!mode) {
            req.session.errorMessage = 'Please select an import mode (Add New Records or Update Existing Records).';
            return res.redirect('/admin/import/customers');
        }

        // Check if import is already in progress
        if (dataImportModule.services.csvImport.isImportInProgress()) {
            req.session.errorMessage = 'An import operation is already in progress. Please wait for it to complete.';
            return res.redirect('/admin/import/customers');
        }

        // Validate file using data import service
        const fileValidation = await dataImportModule.services.dataValidation.validateFileForImport(file, mode);

        if (!fileValidation.success) {
            req.session.errorMessage = `File validation failed: ${fileValidation.errors.join('; ')}`;
            return res.redirect('/admin/import/customers');
        }

        // Start import process
        const importResult = await dataImportModule.services.csvImport.importCustomerData(
            file.buffer,
            fileValidation.importMode
        );

        // Handle results
        if (importResult.success) {
            const { data } = importResult;

            if (data.failed_records > 0) {
                // Partial import - show success with error details
                req.session.successMessage = `Partial import completed: ${data.successful_records} records processed successfully, ${data.failed_records} records failed.`;
                req.session.errorReport = importResult.error_report;
            } else {
                // Full success
                req.session.successMessage = `Import completed successfully: ${data.successful_records} records processed.`;
            }
        } else {
            // Import failed
            req.session.errorMessage = `Import failed: ${importResult.message || importResult.error}`;
        }

        return res.redirect('/admin/import/customers');

    } catch (error) {
        console.error('File upload error:', error);
        req.session.errorMessage = 'An unexpected error occurred during import. Please try again.';
        return res.redirect('/admin/import/customers');
    }
}
/**
 * Generate CSV template content
 */
function generateTemplateCSV(format) {
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
    } else if (format === 'update_customer') {
        headers = ['customer_id', 'email', 'name', 'status', 'topics_of_interest'];
        exampleRow = [
            '1',
            'updated@example.com',
            'Updated Name',
            'inactive',
            '"technology,marketing"'
        ];
    }

    // Create template with headers and example row
    const csvLines = [
        headers.join(','),
        exampleRow.join(','),
        '', // Empty line for user to add data
        '# Instructions:',
        '# - Save this file with .csv extension',
        '# - Use UTF-8 encoding',
        '# - Maximum file size: 2MB',
        '# - Email is required for Add mode',
        '# - Customer ID is required for Update mode',
        '# - Status must be "active" or "inactive"',
        '# - Topics should be comma-separated in quotes',
        '# - Remove these instruction lines before importing'
    ];

    return csvLines.join('\n');
}

/**
 * Download CSV template
 * GET /admin/import/customers/template?format=add|update
 */
async function downloadTemplate(req, res) {
    try {
        const { format = 'add_customer' } = req.query;

        if (!['add_customer', 'update_customer'].includes(format)) {
            req.session.errorMessage = 'Invalid template format requested.';
            return res.redirect('/admin/import/customers');
        }

        // Generate template
        const template = generateTemplateCSV(format);
        const filename = `customer-import-template-${format}.csv`;

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache');

        return res.send(template);

    } catch (error) {
        console.error('Template download error:', error);
        req.session.errorMessage = 'Unable to download template. Please try again.';
        return res.redirect('/admin/import/customers');
    }
}

/**
 * Show error report from session
 * GET /admin/import/customers/error-report
 */
async function showErrorReport(req, res) {
    try {
        const errorReport = req.session.errorReport;

        if (!errorReport) {
            req.session.errorMessage = 'No error report available.';
            return res.redirect('/admin/import/customers');
        }

        res.render('import-error-report', {
            title: 'Import Error Report',
            showNav: true,
            errorReport,
            // Clear error report after displaying
            clearReport: () => {
                delete req.session.errorReport;
            }
        });

    } catch (error) {
        console.error('Error report display error:', error);
        req.session.errorMessage = 'Unable to display error report.';
        return res.redirect('/admin/import/customers');
    }
}

/**
 * Clear error report from session
 * POST /admin/import/customers/clear-report
 */
async function clearErrorReport(req, res) {
    try {
        delete req.session.errorReport;
        req.session.successMessage = 'Error report cleared.';
        return res.redirect('/admin/import/customers');

    } catch (error) {
        console.error('Clear report error:', error);
        req.session.errorMessage = 'Unable to clear error report.';
        return res.redirect('/admin/import/customers');
    }
}

/**
 * Get import status as JSON (for AJAX requests)
 * GET /admin/import/customers/status
 */
async function getImportStatus(req, res) {
    try {
        const isInProgress = dataImportModule.services.csvImport.isImportInProgress();
        const progress = dataImportModule.services.csvImport.getProgress();

        return res.json({
            success: true,
            data: {
                in_progress: isInProgress,
                progress: progress
            }
        });

    } catch (error) {
        console.error('Status check error:', error);

        return res.status(500).json({
            success: false,
            error: 'Unable to check import status'
        });
    }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate uploaded file basic properties
 */
function validateUploadedFile(file) {
    const errors = [];
    const maxFileSize = parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152;

    if (!file) {
        errors.push('No file selected');
        return { isValid: false, errors };
    }

    if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(1);
        errors.push(`File size exceeds ${maxSizeMB}MB limit`);
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
        errors.push('File must have .csv extension');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    renderImportPage,
    handleFileUpload,
    generateTemplateCSV,
    downloadTemplate,
    showErrorReport,
    clearErrorReport,
    getImportStatus,
    formatFileSize,
    validateUploadedFile
};
