/**
 * Data Import Module
 *
 * Handles CSV file import functionality for customer data
 * Supports both "add new records" and "update existing records" operations
 * with comprehensive validation and partial import capabilities.
 */

// Controllers
const importController = require('./controllers/importController');

// Services
const csvImportService = require('./services/csvImportService');
const dataValidationService = require('./services/dataValidationService');

// Validators
const csvValidator = require('./validators/csvValidator');
const dataValidator = require('./validators/dataValidator');

// Routes
const routes = require('./routes');

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

            // Initialize services if needed
            await this.initializeServices();

            this.initialized = true;
            console.log('📁 Data Import Module: Initialized successfully');

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

        console.log('📁 Data Import Module: Configuration validated');
        console.log(`   - Max file size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
        console.log(`   - Batch size: ${batchSize} records`);
        console.log(`   - Timeout: ${timeout} minutes`);
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
        return {
            module: 'data-import',
            initialized: this.initialized,
            configuration: {
                max_file_size: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152,
                max_file_size_mb: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
                batch_size: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
                timeout_minutes: parseInt(process.env.IMPORT_TIMEOUT_MINUTES) || 10,
                supported_formats: ['csv'],
                supported_modes: ['add_customer', 'update_customer'],
                supported_fields: ['email', 'name', 'status', 'topics_of_interest']
            },
            services: {
                csv_import: 'ready',
                data_validation: 'ready',
                csv_validator: 'ready',
                data_validator: 'ready'
            },
            import_status: {
                in_progress: csvImportService.isImportInProgress()
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
        return routes;
    }

    /**
     * Get module controllers (for testing or direct access)
     */
    getControllers() {
        return {
            import: importController
        };
    }

    /**
     * Get module services (for testing or direct access)
     */
    getServices() {
        return {
            csvImport: csvImportService,
            dataValidation: dataValidationService
        };
    }

    /**
     * Get module validators (for testing or direct access)
     */
    getValidators() {
        return {
            csv: csvValidator,
            data: dataValidator
        };
    }

    /**
     * Shutdown module and cleanup resources
     */
    async shutdown() {
        try {
            // Reset any in-progress imports
            if (csvImportService.isImportInProgress()) {
                csvImportService.resetProgress();
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
        return this.initialized;
    }
}

// Create and export module instance
const dataImportModule = new DataImportModule();

// Export individual components for direct access
module.exports = {
    // Main module instance
    module: dataImportModule,

    // Direct component access
    controllers: {
        import: importController
    },

    services: {
        csvImport: csvImportService,
        dataValidation: dataValidationService
    },

    validators: {
        csv: csvValidator,
        data: dataValidator
    },

    routes,

    // Convenience exports
    initialize: () => dataImportModule.initialize(),
    getRoutes: () => dataImportModule.getRoutes(),
    getStatus: () => dataImportModule.getStatus(),
    shutdown: () => dataImportModule.shutdown()
};