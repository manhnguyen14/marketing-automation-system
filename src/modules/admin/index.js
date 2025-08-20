/**
 * Admin Interface Module
 * Exports all admin interface components including generic import functionality
 */

// Controllers
const authUIController = require('./controllers/authUIController');
const dashboardController = require('./controllers/dashboardController');
const genericImportUIController = require('./controllers/genericImportUIController');

// Routes
const routes = require('./routes');
const genericImportRoutes = require('./routes/genericImportRoutes');

/**
 * Admin Module Class
 */
class AdminModule {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize admin module
     */
    async initialize() {
        try {
            this.initialized = true;
            console.log('🎨 Admin Module: Initialized successfully');
            console.log('   - Authentication UI: Ready');
            console.log('   - Dashboard: Ready');
            console.log('   - Generic Import UI: Ready');
            return true;
        } catch (error) {
            console.error('❌ Admin Module: Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Get all admin routes
     */
    getRoutes() {
        if (!this.initialized) {
            throw new Error('Admin Module not initialized');
        }

        return {
            main: routes,                      // Main admin routes (auth, dashboard)
            genericImport: genericImportRoutes // Generic import routes
        };
    }

    /**
     * Get admin controllers
     */
    getControllers() {
        return {
            authUI: authUIController,
            dashboard: dashboardController,
            genericImportUI: genericImportUIController
        };
    }

    /**
     * Get module status
     */
    getStatus() {
        return {
            module: 'admin',
            initialized: this.initialized,
            controllers: {
                authUI: 'ready',
                dashboard: 'ready',
                genericImportUI: 'ready'
            },
            routes: {
                main: 'ready',
                genericImport: 'ready'
            },
            features: {
                authentication: 'ready',
                dashboard: 'ready',
                genericImport: 'all_entities'
            }
        };
    }

    /**
     * Check if module is healthy
     */
    isHealthy() {
        return this.initialized;
    }

    /**
     * Shutdown admin module
     */
    async shutdown() {
        try {
            this.initialized = false;
            console.log('🎨 Admin Module: Shutdown completed');
            return true;
        } catch (error) {
            console.error('❌ Admin Module: Shutdown failed:', error.message);
            return false;
        }
    }
}

// Create module instance
const adminModule = new AdminModule();

// Export both individual components and module instance
module.exports = {
    // Module instance
    module: adminModule,

    // Individual controllers for direct access
    authUIController,
    dashboardController,
    genericImportUIController,

    // Routes for mounting
    routes: {
        main: routes,
        genericImport: genericImportRoutes
    },

    // Convenience exports
    initialize: () => adminModule.initialize(),
    getRoutes: () => adminModule.getRoutes(),
    getStatus: () => adminModule.getStatus(),
    shutdown: () => adminModule.shutdown(),
    isHealthy: () => adminModule.isHealthy()
};