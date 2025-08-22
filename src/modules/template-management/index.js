const templateController = require('./controllers/templateController');
const templateRoutes = require('./routes');

class TemplateManagementModule {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing template management module...');

            // Template management doesn't need special initialization
            // It depends on core database services which should already be initialized

            this.isInitialized = true;
            console.log('✅ Template management module initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Template management module initialization failed:', error.message);
            return false;
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            timestamp: new Date().toISOString()
        };
    }

    isReady() {
        return this.isInitialized;
    }

    getRoutes() {
        return templateRoutes;
    }

    getControllers() {
        return {
            templateController
        };
    }

    async shutdown() {
        try {
            console.log('🛑 Shutting down template management module...');
            this.isInitialized = false;
            console.log('✅ Template management module shutdown complete');
        } catch (error) {
            console.error('❌ Template management module shutdown failed:', error.message);
        }
    }
}

// Create and export module instance
const templateManagementModule = new TemplateManagementModule();

module.exports = templateManagementModule;

// Also export individual components for direct access
module.exports.controllers = {
    templateController
};

module.exports.routes = templateRoutes;