const postmarkService = require('./services/postmarkService');
const emailSendService = require('./services/emailSendService');
const emailController = require('./controllers/emailController');
const emailRoutes = require('./routes');

class EmailModule {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing core email module...');

            // Initialize Postmark service first
            postmarkService.initialize();

            // Initialize email send service
            await emailSendService.initialize();

            this.isInitialized = true;
            console.log('✅ Core email module initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Core email module initialization failed:', error.message);
            console.log('⚠️  Email functionality will be limited');
            return false;
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            services: {
                postmark: postmarkService.isInitialized,
                emailSend: emailSendService.isReady()
            },
            timestamp: new Date().toISOString()
        };
    }

    isReady() {
        return this.isInitialized &&
            postmarkService.isInitialized &&
            emailSendService.isReady();
    }

    getRoutes() {
        return emailRoutes;
    }

    getServices() {
        return {
            postmarkService,
            emailSendService
        };
    }

    getControllers() {
        return {
            emailController
        };
    }

    async shutdown() {
        try {
            console.log('🛑 Shutting down core email module...');
            this.isInitialized = false;
            console.log('✅ Core email module shutdown complete');
        } catch (error) {
            console.error('❌ Core email module shutdown failed:', error.message);
        }
    }

    async testConnection() {
        try {
            if (!this.isReady()) {
                return {
                    success: false,
                    error: 'Email module not ready'
                };
            }

            const postmarkTest = await postmarkService.testConnection();

            return {
                success: postmarkTest.connected,
                services: {
                    postmark: postmarkTest
                },
                module: this.getStatus()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create and export module instance
const emailModule = new EmailModule();

module.exports = emailModule;

// Also export individual components for direct access
module.exports.services = {
    postmarkService,
    emailSendService
};

module.exports.controllers = {
    emailController
};

module.exports.routes = emailRoutes;