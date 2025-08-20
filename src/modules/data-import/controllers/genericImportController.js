const genericImportService = require('../services/genericImportService');
const dataValidationService = require('../services/dataValidationService');
const importConfigs = require('../config/importConfigs');

class GenericImportController {
    /**
     * Upload and process CSV file for any entity import
     * POST /api/data-import/:entity/upload
     */
    async uploadEntityCSV(req, res) {
        try {
            const { entity } = req.params;
            const { mode } = req.body;
            const file = req.file;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid entity type',
                    message: `Entity '${entity}' is not supported. Available entities: ${importConfigs.getAvailableEntities().join(', ')}`
                });
            }

            // Check if import is already in progress
            if (genericImportService.isImportInProgress()) {
                return res.status(409).json({
                    success: false,
                    error: 'Import already in progress',
                    message: 'Please wait for the current import to complete before starting a new one.'
                });
            }

            // Validate request
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

            // Normalize mode to match expected format
            const importMode = mode.startsWith('add_') || mode.startsWith('update_')
                ? mode
                : `${mode}_${entity}`;

            // Validate file and import mode (Stages 1-2)
            const fileValidation = await dataValidationService.validateFileForImport(file, importMode, entity);

            if (!fileValidation.success) {
                return res.status(400).json({
                    success: false,
                    error: fileValidation.errors.join('; '),
                    stage: fileValidation.stage,
                    message: fileValidation.message
                });
            }

            // Process import
            const importResult = await genericImportService.importData(
                file.buffer,
                entity,
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
                return res.status(400).json({
                    success: false,
                    error: importResult.error,
                    stage: importResult.stage,
                    message: importResult.message
                });
            }

        } catch (error) {
            console.error('Generic import controller error:', error);

            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'An unexpected error occurred during import. Please try again.'
            });
        }
    }

    /**
     * Validate CSV file without importing (preview)
     * POST /api/data-import/:entity/validate
     */
    async validateEntityCSV(req, res) {
        try {
            const { entity } = req.params;
            const { mode } = req.body;
            const file = req.file;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid entity type',
                    message: `Entity '${entity}' is not supported`
                });
            }

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

            const importMode = mode.startsWith('add_') || mode.startsWith('update_')
                ? mode
                : `${mode}_${entity}`;

            // Validate file and get preview (Stages 1-3 without importing)
            const validation = await dataValidationService.validateFileForImport(file, importMode, entity);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.errors.join('; '),
                    stage: validation.stage,
                    message: validation.message
                });
            }

            // Get preview data without importing
            const preview = await genericImportService.getImportPreview(file.buffer, entity, validation.importMode);

            return res.status(200).json({
                success: true,
                data: {
                    preview: preview.preview,
                    total_rows: preview.total_rows,
                    valid_rows: preview.valid_rows,
                    invalid_rows: preview.invalid_rows,
                    import_mode: validation.importMode,
                    entity: entity
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
     * Get import configuration and limits for entity
     * GET /api/data-import/:entity/config
     */
    async getEntityImportConfig(req, res) {
        try {
            const { entity } = req.params;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid entity type',
                    message: `Entity '${entity}' is not supported`
                });
            }

            const config = importConfigs.getConfig(entity);

            const responseConfig = {
                entity: entity,
                max_file_size: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152,
                max_file_size_mb: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
                supported_formats: ['csv'],
                supported_modes: [`add_${entity}`, `update_${entity}`],
                batch_size: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
                max_rows: parseInt(process.env.IMPORT_MAX_ROWS) || 10000,
                required_headers: {
                    add: config.requiredFields.add,
                    update: config.requiredFields.update
                },
                allowed_headers: config.allowedFields,
                field_validations: config.fieldValidations,
                templates: config.templates
            };

            return res.status(200).json({
                success: true,
                data: responseConfig,
                message: `Import configuration retrieved successfully for ${entity}.`
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
     * Get import template CSV for entity
     * GET /api/data-import/:entity/template
     */
    async getEntityImportTemplate(req, res) {
        try {
            const { entity } = req.params;
            const { format = `add_${entity}` } = req.query;

            // Validate entity
            if (!importConfigs.hasEntity(entity)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid entity type',
                    message: `Entity '${entity}' is not supported`
                });
            }

            const config = importConfigs.getConfig(entity);
            const validFormats = [`add_${entity}`, `update_${entity}`, 'add', 'update'];

            if (!validFormats.includes(format)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid format parameter',
                    message: `Format must be one of: ${validFormats.join(', ')}`
                });
            }

            // Normalize format
            const templateType = format.includes('_') ? format.split('_')[0] : format;
            const template = this.generateTemplateCSV(config, templateType);

            return res.status(200).json({
                success: true,
                data: {
                    csv_template: template,
                    format: format,
                    entity: entity,
                    instructions: config.templates[templateType]?.instructions || []
                },
                message: `Import template generated for ${entity} ${templateType} mode.`
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
    generateTemplateCSV(config, templateType) {
        const templateConfig = config.templates[templateType];
        if (!templateConfig) {
            throw new Error(`Template type '${templateType}' not found for entity`);
        }

        return [
            templateConfig.headers.join(','),
            templateConfig.exampleRow.join(',')
        ].join('\n');
    }

    /**
     * Get all available entities for import
     * GET /api/data-import/entities
     */
    async getAvailableEntities(req, res) {
        try {
            const entities = importConfigs.getAvailableEntities();
            const entityDetails = entities.map(entity => {
                const config = importConfigs.getConfig(entity);
                return {
                    name: entity,
                    displayName: config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1),
                    allowedFields: config.allowedFields,
                    requiredFields: config.requiredFields
                };
            });

            return res.status(200).json({
                success: true,
                data: {
                    entities: entityDetails,
                    count: entities.length
                },
                message: 'Available entities retrieved successfully.'
            });

        } catch (error) {
            console.error('Entities controller error:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'Unable to retrieve available entities.'
            });
        }
    }
}

module.exports = new GenericImportController();