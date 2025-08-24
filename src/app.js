const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { engine } = require('express-handlebars');
const path = require('path');
require('dotenv').config();

// Import configuration and validate environment
const config = require('./config');

// Import core modules
const { authController } = require('./core/auth');
const database = require('./core/database');
const emailModule = require('./core/email');
const pipelineModule = require('./core/pipeline'); // ✅ ADD

// Import feature modules
const adminModule = require('./modules/admin');
const dataImportModule = require('./modules/data-import');
const templateManagementModule = require('./modules/template-management');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// View engine setup (keeping existing handlebars helpers)
app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'modules/admin/views/layouts'),
    partialsDir: path.join(__dirname, 'modules/admin/views/partials'),
    helpers: {
        // ... keeping all existing helpers unchanged ...
        eq: function(a, b) { return a === b; },
        ne: function(a, b) { return a !== b; },
        gt: function(a, b) { return a > b; },
        lt: function(a, b) { return a < b; },
        gte: function(a, b) { return a >= b; },
        lte: function(a, b) { return a <= b; },
        or: function(a, b) { return a || b; },
        and: function(a, b) { return a && b; },
        not: function(a) { return !a; },
        contains: function(array, item) {
            if (!array || !Array.isArray(array)) return false;
            return array.includes(item);
        },
        length: function(array) {
            if (!array) return 0;
            return Array.isArray(array) ? array.length : Object.keys(array).length;
        },
        join: function(array, separator) {
            if (!array || !Array.isArray(array)) return '';
            return array.join(separator || ', ');
        },
        capitalize: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        upper: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.toUpperCase();
        },
        lower: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.toLowerCase();
        },
        truncate: function(str, length) {
            if (!str || typeof str !== 'string') return '';
            if (str.length <= length) return str;
            return str.substring(0, length) + '...';
        },
        formatDate: function(date, format) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            switch (format) {
                case 'short': return d.toLocaleDateString();
                case 'long': return d.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                case 'time': return d.toLocaleTimeString();
                case 'datetime': return d.toLocaleString();
                default: return d.toLocaleDateString();
            }
        },
        formatNumber: function(num, decimals) {
            if (typeof num !== 'number') return num;
            if (decimals !== undefined) {
                return num.toFixed(decimals);
            }
            return num.toLocaleString();
        },
        percentage: function(num, total) {
            if (!num || !total || total === 0) return '0%';
            return ((num / total) * 100).toFixed(1) + '%';
        },
        fileSize: function(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },
        json: function(obj) {
            return JSON.stringify(obj, null, 2);
        },
        ifCond: function(v1, operator, v2, options) {
            switch (operator) {
                case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&': return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||': return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default: return options.inverse(this);
            }
        },
        times: function(n, options) {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += options.fn(i);
            }
            return result;
        },
        default: function(value, defaultValue) {
            return value || defaultValue;
        },
        isRequired: function(field, requiredFields) {
            return requiredFields && requiredFields.includes(field);
        }
    }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'modules/admin/views'));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Application initialization
async function initializeApplication() {
    try {
        console.log('='.repeat(50));
        console.log('🚀 Marketing Automation System Starting...');
        console.log('='.repeat(50));

        // 1. Initialize database first
        console.log('💾 Initializing database...');
        const dbInitialized = await database.initialize();

        if (dbInitialized && database.isReady()) {
            console.log('💾 Database: Connected and ready');
        } else {
            console.log('⚠️  Database: Not available (running in limited mode)');
        }

        // 2. Initialize email module (depends on database)
        console.log('📧 Initializing email module...');
        const emailInitialized = await emailModule.initialize();

        if (emailInitialized && emailModule.isReady()) {
            console.log('📧 Email Module: Initialized and ready');
        } else {
            console.log('⚠️  Email Module: Not available (email functionality limited)');
        }

        // ✅ ADD: 3. Initialize pipeline.js module (depends on database and email)
        console.log('⚡ Initializing pipeline.js module...');
        const pipelineInitialized = await pipelineModule.initialize();

        if (pipelineInitialized && pipelineModule.isReady()) {
            console.log('⚡ Pipeline Module: Initialized and ready');
        } else {
            console.log('⚠️  Pipeline Module: Not available (automation limited)');
        }

        // 4. Initialize template management module
        console.log('📝 Initializing template management module...');
        const templateInitialized = await templateManagementModule.initialize();

        if (templateInitialized) {
            console.log('📝 Template Management: Initialized successfully');
        } else {
            console.log('⚠️  Template Management: Initialization failed');
        }

        // 5. Initialize admin module
        console.log('🎨 Initializing admin module...');
        const adminInitialized = await adminModule.initialize();

        if (adminInitialized) {
            console.log('🎨 Admin Module: Initialized successfully');
        } else {
            console.log('⚠️  Admin Module: Initialization failed');
        }

        // 6. Initialize data import module
        console.log('📁 Initializing data import module...');
        const importInitialized = await dataImportModule.initialize();

        if (importInitialized) {
            console.log('📁 Data Import Module: Initialized successfully');
        } else {
            console.log('⚠️  Data Import Module: Initialization failed (will retry on first use)');
        }

        // 7. Setup routes after initialization
        console.log('🛣️  Setting up routes...');

        // Health check endpoint (enhanced with all module status)
        app.get('/api/health', async (req, res) => {
            try {
                const dbStatus = await database.testConnection();
                const emailStatus = emailModule.getStatus();
                const emailConnectionTest = await emailModule.testConnection();
                const pipelineStatus = pipelineModule.getStatus(); // ✅ ADD
                const pipelineConnectionTest = await pipelineModule.testConnection(); // ✅ ADD
                const importStatus = dataImportModule.getStatus();
                const templateStatus = templateManagementModule.getStatus();

                res.json({
                    success: true,
                    data: {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        database: dbStatus,
                        modules: {
                            email: emailStatus,
                            emailConnection: emailConnectionTest,
                            pipeline: pipelineStatus, // ✅ ADD
                            pipelineConnection: pipelineConnectionTest, // ✅ ADD
                            dataImport: importStatus,
                            templateManagement: templateStatus
                        },
                        environment: config.nodeEnv
                    }
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Health check failed',
                    details: error.message
                });
            }
        });

        // Authentication API routes
        app.post('/api/auth/login', authController.login);
        app.get('/api/auth/logout', authController.logout);
        app.get('/api/auth/verify', authController.verify);

        // Email API routes
        if (emailInitialized) {
            app.use('/api/email', emailModule.getRoutes());
            console.log('🛣️  Email API routes: ✅ Configured');
        } else {
            app.use('/api/email', (req, res) => {
                res.status(503).json({
                    success: false,
                    error: 'Email service unavailable',
                    message: 'Email module initialization failed. Please contact administrator.'
                });
            });
            console.log('🛣️  Email API routes: ⚠️ Fallback configured');
        }

        // ✅ ADD: Pipeline API routes
        if (pipelineInitialized) {
            app.use('/api/pipeline.js', pipelineModule.getRoutes());
            console.log('🛣️  Pipeline API routes: ✅ Configured');
        } else {
            app.use('/api/pipeline.js', (req, res) => {
                res.status(503).json({
                    success: false,
                    error: 'Pipeline service unavailable',
                    message: 'Pipeline module initialization failed. Please contact administrator.'
                });
            });
            console.log('🛣️  Pipeline API routes: ⚠️ Fallback configured');
        }

        // Template management API routes
        if (templateInitialized) {
            app.use('/api/templates', templateManagementModule.getRoutes());
            console.log('🛣️  Template management API routes: ✅ Configured');
        } else {
            app.use('/api/templates', (req, res) => {
                res.status(503).json({
                    success: false,
                    error: 'Template management service unavailable',
                    message: 'Template module initialization failed. Please contact administrator.'
                });
            });
            console.log('🛣️  Template management API routes: ⚠️ Fallback configured');
        }

        // Data Import API routes
        if (importInitialized) {
            app.use('/api/data-import', dataImportModule.getRoutes());
            console.log('🛣️  Data import API routes: ✅ Configured');
        } else {
            app.use('/api/data-import', (req, res) => {
                res.status(503).json({
                    success: false,
                    error: 'Data import service unavailable',
                    message: 'Module initialization failed. Please contact administrator.'
                });
            });
            console.log('🛣️  Data import API routes: ⚠️ Fallback configured');
        }

        // Admin interface routes
        app.use('/admin/import-data', adminModule.getRoutes().genericImport);
        app.use('/admin', adminModule.getRoutes().main);
        console.log('🛣️  Admin interface routes: ✅ Configured');

        // Default redirects
        app.get('/', (req, res) => res.redirect('/admin/dashboard'));

        // Error handling middleware (must be last)
        app.use(errorHandler);

        console.log('🛣️  All routes configured successfully');
        return true;

    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        throw error;
    }
}

// Start server function
async function startServer() {
    try {
        // Initialize application
        await initializeApplication();

        // Start server
        const server = app.listen(config.port, () => {
            console.log(`📡 Server running on: http://localhost:${config.port}`);
            console.log(`🔐 Admin login: http://localhost:${config.port}/admin/login`);
            console.log(`📁 Data Import: http://localhost:${config.port}/admin/import-data`);
            console.log(`📧 Email API: http://localhost:${config.port}/api/email/health`);
            console.log(`⚡ Pipeline API: http://localhost:${config.port}/api/pipeline/health`); // ✅ ADD
            console.log(`📝 Templates API: http://localhost:${config.port}/api/templates`);
            console.log(`💡 Health check: http://localhost:${config.port}/api/health`);
            console.log('='.repeat(50));
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`Admin user: ${config.auth.username}`);
            console.log('='.repeat(50));
            console.log('✅ System ready for use!');
        });

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');

            server.close(async () => {
                // Shutdown modules in reverse order
                try {
                    await dataImportModule.shutdown();
                    console.log('📁 Data import module shutdown: ✅');
                } catch (error) {
                    console.error('📁 Data import module shutdown: ❌', error.message);
                }

                try {
                    await templateManagementModule.shutdown();
                    console.log('📝 Template management module shutdown: ✅');
                } catch (error) {
                    console.error('📝 Template management module shutdown: ❌', error.message);
                }

                // ✅ ADD: Shutdown pipeline.js module
                try {
                    await pipelineModule.shutdown();
                    console.log('⚡ Pipeline module shutdown: ✅');
                } catch (error) {
                    console.error('⚡ Pipeline module shutdown: ❌', error.message);
                }

                try {
                    await emailModule.shutdown();
                    console.log('📧 Email module shutdown: ✅');
                } catch (error) {
                    console.error('📧 Email module shutdown: ❌', error.message);
                }

                // Close database
                try {
                    await database.close();
                    console.log('💾 Database connection closed: ✅');
                } catch (error) {
                    console.error('💾 Database connection close: ❌', error.message);
                }

                console.log('✅ Server shut down complete');
                process.exit(0);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        return server;

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = app;