/**
 * Data Import Module
 *
 * Generic CSV file import functionality for any entity type
 * Supports dynamic entity configuration with comprehensive validation
 */

// Configuration
const importConfigs = require('./config/importConfigs');

// Controllers
const genericImportController = require('./controllers/genericImportController');

// Services
const genericImportService = require('./services/genericImportService');
const dataValidationService = require('./services/dataValidationService');

// Validators
const csvValidator = require('./validators/csvValidator');
const genericValidator = require('./validators/genericValidator');

// Routes
const genericRoutes = require('./routes/genericRoutes');

/**
 * Data Import Module Class
 */
class DataImportModule {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the data import module
     */
    async initialize() {
        try {
            // Validate environment configuration
            this.validateConfiguration();

            // Validate all entity configurations
            this.validateEntityConfigurations();

            // Initialize services if needed
            await this.initializeServices();

            this.initialized = true;
            console.log('📁 Data Import Module: Initialized successfully');
            console.log(`   - Supported entities: ${importConfigs.getAvailableEntities().join(', ')}`);

            return true;
        } catch (error) {
            console.error('❌ Data Import Module: Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Validate required environment configuration
     */
    validateConfiguration() {
        const requiredConfig = {
            IMPORT_MAX_FILE_SIZE: process.env.IMPORT_MAX_FILE_SIZE || '2097152',
            IMPORT_BATCH_SIZE: process.env.IMPORT_BATCH_SIZE || '100',
            IMPORT_TIMEOUT_MINUTES: process.env.IMPORT_TIMEOUT_MINUTES || '10'
        };

        // Validate file size limit
        const maxFileSize = parseInt(requiredConfig.IMPORT_MAX_FILE_SIZE);
        if (isNaN(maxFileSize) || maxFileSize <= 0) {
            throw new Error('Invalid IMPORT_MAX_FILE_SIZE configuration');
        }

        // Validate batch size
        const batchSize = parseInt(requiredConfig.IMPORT_BATCH_SIZE);
        if (isNaN(batchSize) || batchSize <= 0 || batchSize > 1000) {
            throw new Error('Invalid IMPORT_BATCH_SIZE configuration (must be 1-1000)');
        }

        // Validate timeout
        const timeout = parseInt(requiredConfig.IMPORT_TIMEOUT_MINUTES);
        if (isNaN(timeout) || timeout <= 0) {
            throw new Error('Invalid IMPORT_TIMEOUT_MINUTES configuration');
        }

        console.log('📁 Data Import Module: Environment configuration validated');
        console.log(`   - Max file size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        console.log(`   - Batch size: ${batchSize} records`);
        console.log(`   - Timeout: ${timeout} minutes`);
    }

    /**
     * Validate all entity configurations
     */
    validateEntityConfigurations() {
        try {
            importConfigs.validateAllConfigs();
            console.log('📁 Data Import Module: Entity configurations validated');
        } catch (error) {
            throw new Error(`Entity configuration validation failed: ${error.message}`);
        }
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        // Services are stateless and don't require explicit initialization
        // This method is here for future extensibility
        console.log('📁 Data Import Module: Services ready');
    }

    /**
     * Get module status and configuration
     */
    getStatus() {
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

        return {
            module: 'data-import',
            initialized: this.initialized,
            configuration: {
                max_file_size: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152,
                max_file_size_mb: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
                batch_size: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
                timeout_minutes: parseInt(process.env.IMPORT_TIMEOUT_MINUTES) || 10,
                supported_formats: ['csv'],
                supported_entities: entities
            },
            entities: entityDetails,
            services: {
                generic_import: 'ready',
                data_validation: 'ready',
                generic_validator: 'ready',
                csv_validator: 'ready'
            },
            import_status: {
                in_progress: genericImportService.isImportInProgress(),
                current_entity: genericImportService.getCurrentEntity()
            }
        };
    }

    /**
     * Get module routes
     */
    getRoutes() {
        if (!this.initialized) {
            throw new Error('Data Import Module not initialized');
        }

        return genericRoutes;
    }

    /**
     * Get module controllers
     */
    getControllers() {
        return {
            genericImport: genericImportController
        };
    }

    /**
     * Get module services
     */
    getServices() {
        return {
            genericImport: genericImportService,
            dataValidation: dataValidationService
        };
    }

    /**
     * Get module validators
     */
    getValidators() {
        return {
            csv: csvValidator,
            generic: genericValidator
        };
    }

    /**
     * Get entity configurations
     */
    getEntityConfigs() {
        return importConfigs;
    }

    /**
     * Add new entity configuration
     */
    addEntityConfig(entityName, config) {
        if (!this.initialized) {
            throw new Error('Data Import Module not initialized');
        }

        // Validate the new configuration
        const requiredProperties = [
            'entityName', 'tableName', 'primaryKey', 'serviceName',
            'requiredFields', 'allowedFields', 'fieldValidations', 'templates'
        ];

        const missing = requiredProperties.filter(prop => !config[prop]);
        if (missing.length > 0) {
            throw new Error(`Invalid configuration for ${entityName}. Missing: ${missing.join(', ')}`);
        }

        // Add to configurations
        importConfigs.configs[entityName] = config;

        console.log(`📁 Data Import Module: Added entity configuration for '${entityName}'`);
        return true;
    }

    /**
     * Shutdown module and cleanup resources
     */
    async shutdown() {
        try {
            // Reset any in-progress imports
            if (genericImportService.isImportInProgress()) {
                genericImportService.resetProgress();
                console.log('📁 Data Import Module: Reset in-progress import');
            }

            this.initialized = false;
            console.log('📁 Data Import Module: Shutdown completed');

            return true;
        } catch (error) {
            console.error('❌ Data Import Module: Shutdown failed:', error.message);
            return false;
        }
    }

    /**
     * Check if module is healthy
     */
    isHealthy() {
        if (!this.initialized) {
            return false;
        }

        try {
            // Validate configurations are still valid
            importConfigs.validateAllConfigs();
            return true;
        } catch (error) {
            console.error('❌ Data Import Module: Health check failed:', error.message);
            return false;
        }
    }

    /**
     * Get entity-specific import capabilities
     */
    getEntityCapabilities(entityName) {
        if (!importConfigs.hasEntity(entityName)) {
            throw new Error(`Entity '${entityName}' not found`);
        }

        const config = importConfigs.getConfig(entityName);

        return {
            entity: entityName,
            displayName: config.entityName.charAt(0).toUpperCase() + config.entityName.slice(1),
            supportedModes: [`add_${entityName}`, `update_${entityName}`],
            requiredFields: config.requiredFields,
            allowedFields: config.allowedFields,
            uniqueFields: config.uniqueFields,
            fieldValidations: config.fieldValidations,
            templates: config.templates,
            serviceName: config.serviceName,
            tableName: config.tableName,
            primaryKey: config.primaryKey
        };
    }
}

// Create and export module instance
const dataImportModule = new DataImportModule();

// Export individual components for direct access
module.exports = {
    // Main module instance
    module: dataImportModule,

    // Configuration
    configs: importConfigs,

    // Direct component access
    controllers: {
        genericImport: genericImportController
    },

    services: {
        genericImport: genericImportService,
        dataValidation: dataValidationService
    },

    validators: {
        csv: csvValidator,
        generic: genericValidator
    },

    routes: genericRoutes,

    // Convenience exports
    initialize: () => dataImportModule.initialize(),
    getRoutes: () => dataImportModule.getRoutes(),
    getStatus: () => dataImportModule.getStatus(),
    shutdown: () => dataImportModule.shutdown(),
    isHealthy: () => dataImportModule.isHealthy(),
    getEntityCapabilities: (entityName) => dataImportModule.getEntityCapabilities(entityName)
};