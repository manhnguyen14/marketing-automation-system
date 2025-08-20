const genericImportService = require('../../data-import/services/genericImportService');
const dataValidationService = require('../../data-import/services/dataValidationService');
const importConfigs = require('../../data-import/config/importConfigs');

class GenericImportUIController {
    constructor() {
        this.renderEntityImportPage = this.renderEntityImportPage.bind(this);
        this.handleEntityFileUpload = this.handleEntityFileUpload.bind(this);
        this.downloadEntityTemplate = this.downloadEntityTemplate.bind(this);
        this.showEntityErrorReport = this.showEntityErrorReport.bind(this);
        this.clearEntityErrorReport = this.clearEntityErrorReport.bind(this);
        this.getEntityImportStatus = this.getEntityImportStatus.bind(this);
        this.renderEntitySelectionPage = this.renderEntitySelectionPage.bind(this);
    }
    /**
     * Render entity import interface
     * GET /admin/import-data/:entity
     */
    async renderEntityImportPage(req, res) {
        try {
            const { entity } = req.params;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                req.session.errorMessage = `Entity '${entity}' is not supported for import.`;
                return res.redirect('/admin/dashboard');
            }

            const config = importConfigs.getConfig(entity);

            // Get import configuration for display
            const importConfig = {
                maxFileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152,
                maxFileSizeMB: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
                batchSize: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
                allowedFormats: ['.csv'],
                entity: entity,
                entityDisplayName: config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1),
                importModes: [
                    {
                        value: `add_${entity}`,
                        label: `Add New ${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}s`,
                        description: `Create new ${entity} records`
                    },
                    {
                        value: `update_${entity}`,
                        label: `Update Existing ${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)}s`,
                        description: `Update existing ${entity} records`
                    }
                ],
                allowedFields: config.allowedFields,
                requiredFields: config.requiredFields,
                templates: config.templates
            };

            // Get current import status
            const importStatus = genericImportService.isImportInProgress();
            const currentEntity = genericImportService.getCurrentEntity();

            res.render('import-generic', {
                title: `${importConfig.entityDisplayName} Data Import`,
                showNav: true,
                config: importConfig,
                importStatus: importStatus && currentEntity === entity,
                // Flash messages from session
                successMessage: req.session.successMessage,
                errorMessage: req.session.errorMessage,
                errorReport: req.session.errorReport
            });

            // Clear flash messages after rendering
            delete req.session.successMessage;
            delete req.session.errorMessage;

        } catch (error) {
            console.error('Entity import UI render error:', error);

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
     * POST /admin/import-data/:entity/upload
     */
    async handleEntityFileUpload(req, res) {
        try {
            const { entity } = req.params;
            const { mode } = req.body;
            const file = req.file;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                req.session.errorMessage = `Entity '${entity}' is not supported for import.`;
                return res.redirect('/admin/dashboard');
            }

            // Validate request
            if (!file) {
                req.session.errorMessage = 'Please select a CSV file to upload.';
                return res.redirect(`/admin/import-data/${entity}`);
            }

            if (!mode) {
                req.session.errorMessage = 'Please select an import mode.';
                return res.redirect(`/admin/import-data/${entity}`);
            }

            // Check if import is already in progress
            if (genericImportService.isImportInProgress()) {
                req.session.errorMessage = 'An import operation is already in progress. Please wait for it to complete.';
                return res.redirect(`/admin/import-data/${entity}`);
            }

            // Normalize mode
            const importMode = mode.startsWith('add_') || mode.startsWith('update_')
                ? mode
                : `${mode}_${entity}`;

            // Validate file using data import service
            const fileValidation = await dataValidationService.validateFileForImport(file, importMode, entity);

            if (!fileValidation.success) {
                req.session.errorMessage = `File validation failed: ${fileValidation.errors.join('; ')}`;
                return res.redirect(`/admin/import-data/${entity}`);
            }

            // Start import process
            const importResult = await genericImportService.importData(
                file.buffer,
                entity,
                fileValidation.importMode
            );

            // Handle results
            if (importResult.success) {
                const { data } = importResult;

                if (data.failed_records > 0) {
                    // Partial import - show success with error details
                    req.session.successMessage = `Partial import completed: ${data.successful_records} ${entity} records processed successfully, ${data.failed_records} records failed.`;
                    req.session.errorReport = importResult.error_report;
                } else {
                    // Full success
                    req.session.successMessage = `Import completed successfully: ${data.successful_records} ${entity} records processed.`;
                }
            } else {
                // Import failed
                req.session.errorMessage = `Import failed: ${importResult.message || importResult.error}`;
            }

            return res.redirect(`/admin/import-data/${entity}`);

        } catch (error) {
            console.error('Entity file upload error:', error);
            const { entity } = req.params;
            req.session.errorMessage = 'An unexpected error occurred during import. Please try again.';
            return res.redirect(`/admin/import-data/${entity}`);
        }
    }

    /**
     * Download CSV template for entity
     * GET /admin/import-data/:entity/template?format=add|update
     */
    async downloadEntityTemplate(req, res) {
        try {
            const { entity } = req.params;
            const { format = 'add' } = req.query;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                req.session.errorMessage = `Entity '${entity}' is not supported for import.`;
                return res.redirect('/admin/dashboard');
            }

            const config = importConfigs.getConfig(entity);
            const validFormats = ['add', 'update'];

            if (!validFormats.includes(format)) {
                req.session.errorMessage = 'Invalid template format requested.';
                return res.redirect(`/admin/import-data/${entity}`);
            }

            // Generate template
            console.log('Generating template for', entity, 'in', format, 'mode with config:', config.templates[format]);
            const template = this.generateTemplateCSV(config, format);
            const filename = `${entity}-import-template-${format}.csv`;

            // Set headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');

            return res.send(template);

        } catch (error) {
            console.error('Entity template download error:', error);
            const { entity } = req.params;
            req.session.errorMessage = 'Unable to download template. Please try again.';
            return res.redirect(`/admin/import-data/${entity}`);
        }
    }

    /**
     * Show error report from session
     * GET /admin/import-data/:entity/error-report
     */
    async showEntityErrorReport(req, res) {
        try {
            const { entity } = req.params;
            const errorReport = req.session.errorReport;

            if (!errorReport) {
                req.session.errorMessage = 'No error report available.';
                return res.redirect(`/admin/import-data/${entity}`);
            }

            const config = importConfigs.getConfig(entity);

            res.render('import-error-report', {
                title: `${config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)} Import Error Report`,
                showNav: true,
                errorReport,
                entity,
                entityDisplayName: config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1)
            });

        } catch (error) {
            console.error('Entity error report display error:', error);
            const { entity } = req.params;
            req.session.errorMessage = 'Unable to display error report.';
            return res.redirect(`/admin/import-data/${entity}`);
        }
    }

    /**
     * Clear error report from session
     * POST /admin/import-data/:entity/clear-report
     */
    async clearEntityErrorReport(req, res) {
        try {
            const { entity } = req.params;
            delete req.session.errorReport;
            req.session.successMessage = 'Error report cleared.';
            return res.redirect(`/admin/import-data/${entity}`);

        } catch (error) {
            console.error('Clear entity report error:', error);
            const { entity } = req.params;
            req.session.errorMessage = 'Unable to clear error report.';
            return res.redirect(`/admin/import-data/${entity}`);
        }
    }

    /**
     * Get import status as JSON (for AJAX requests)
     * GET /admin/import-data/:entity/status
     */
    async getEntityImportStatus(req, res) {
        try {
            const { entity } = req.params;
            const isInProgress = genericImportService.isImportInProgress();
            const currentEntity = genericImportService.getCurrentEntity();

            return res.json({
                success: true,
                data: {
                    in_progress: isInProgress && currentEntity === entity,
                    current_entity: currentEntity,
                    entity: entity
                }
            });

        } catch (error) {
            console.error('Entity status check error:', error);

            return res.status(500).json({
                success: false,
                error: 'Unable to check import status'
            });
        }
    }

    /**
     * Render entity selection page
     * GET /admin/import
     */
    async renderEntitySelectionPage(req, res) {
        try {
            const availableEntities = importConfigs.getAvailableEntities();
            const entityDetails = availableEntities.map(entity => {
                const config = importConfigs.getConfig(entity);
                return {
                    name: entity,
                    displayName: config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1),
                    description: `Import ${entity} data from CSV files`,
                    allowedFields: config.allowedFields,
                    requiredFields: config.requiredFields
                };
            });

            res.render('import-entity-selection', {
                title: 'Data Import',
                showNav: true,
                entities: entityDetails,
                // Flash messages from session
                successMessage: req.session.successMessage,
                errorMessage: req.session.errorMessage
            });

            // Clear flash messages after rendering
            delete req.session.successMessage;
            delete req.session.errorMessage;

        } catch (error) {
            console.error('Entity selection render error:', error);

            res.render('error', {
                title: 'Import Error',
                showNav: true,
                error: {
                    message: 'Unable to load import selection',
                    details: error.message
                }
            });
        }
    }

    /**
     * Generate CSV template content for entity
     */
    generateTemplateCSV(config, format) {
        console.log('start function generateTemplateCSV');
        const templateConfig = config.templates[format];
        if (!templateConfig) {
            throw new Error(`Template format '${format}' not found for entity`);
        }

        // Create template with headers and example row
        const csvLines = [
            templateConfig.headers.join(','),
            templateConfig.exampleRow.join(','),
            '', // Empty line for user to add data
            '# Instructions:',
            '# - Save this file with .csv extension',
            '# - Use UTF-8 encoding',
            '# - Maximum file size: 2MB',
            ...templateConfig.instructions.map(instruction => `# - ${instruction}`),
            '# - Remove these instruction lines before importing'
        ];

        return csvLines.join('\n');
    }
}

module.exports = new GenericImportUIController();