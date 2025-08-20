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

// Import feature modules
const adminModule = require('./modules/admin');
const dataImportModule = require('./modules/data-import');
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// View engine setup
app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'modules/admin/views/layouts'),
    partialsDir: path.join(__dirname, 'modules/admin/views/partials'),
    helpers: {
        // Equality helper
        eq: function(a, b) {
            return a === b;
        },

        // Not equal helper
        ne: function(a, b) {
            return a !== b;
        },

        // Greater than helper
        gt: function(a, b) {
            return a > b;
        },

        // Less than helper
        lt: function(a, b) {
            return a < b;
        },

        // Greater than or equal helper
        gte: function(a, b) {
            return a >= b;
        },

        // Less than or equal helper
        lte: function(a, b) {
            return a <= b;
        },

        // Or helper
        or: function(a, b) {
            return a || b;
        },

        // And helper
        and: function(a, b) {
            return a && b;
        },

        // Not helper
        not: function(a) {
            return !a;
        },

        // Contains helper
        contains: function(array, item) {
            if (!array || !Array.isArray(array)) return false;
            return array.includes(item);
        },

        // Length helper
        length: function(array) {
            if (!array) return 0;
            return Array.isArray(array) ? array.length : Object.keys(array).length;
        },

        // Join helper for arrays
        join: function(array, separator) {
            if (!array || !Array.isArray(array)) return '';
            return array.join(separator || ', ');
        },

        // Capitalize helper
        capitalize: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        // Uppercase helper
        upper: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.toUpperCase();
        },

        // Lowercase helper
        lower: function(str) {
            if (!str || typeof str !== 'string') return '';
            return str.toLowerCase();
        },

        // Truncate helper
        truncate: function(str, length) {
            if (!str || typeof str !== 'string') return '';
            if (str.length <= length) return str;
            return str.substring(0, length) + '...';
        },

        // Date formatting helper
        formatDate: function(date, format) {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';

            switch (format) {
                case 'short':
                    return d.toLocaleDateString();
                case 'long':
                    return d.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                case 'time':
                    return d.toLocaleTimeString();
                case 'datetime':
                    return d.toLocaleString();
                default:
                    return d.toLocaleDateString();
            }
        },

        // Number formatting helper
        formatNumber: function(num, decimals) {
            if (typeof num !== 'number') return num;
            if (decimals !== undefined) {
                return num.toFixed(decimals);
            }
            return num.toLocaleString();
        },

        // Percentage helper
        percentage: function(num, total) {
            if (!num || !total || total === 0) return '0%';
            return ((num / total) * 100).toFixed(1) + '%';
        },

        // File size helper
        fileSize: function(bytes) {
            if (!bytes || bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        },

        // JSON stringify helper (for debugging)
        json: function(obj) {
            return JSON.stringify(obj, null, 2);
        },

        // Conditional block helper
        ifCond: function(v1, operator, v2, options) {
            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '!=':
                    return (v1 != v2) ? options.fn(this) : options.inverse(this);
                case '!==':
                    return (v1 !== v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        },

        // Times helper for loops
        times: function(n, options) {
            let result = '';
            for (let i = 0; i < n; i++) {
                result += options.fn(i);
            }
            return result;
        },

        // Default value helper
        default: function(value, defaultValue) {
            return value || defaultValue;
        },

        // ✅ ADD: isRequired helper for generic import forms
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

        // 2. Initialize admin module
        console.log('🎨 Initializing admin module...');
        const adminInitialized = await adminModule.initialize();

        if (adminInitialized) {
            console.log('🎨 Admin Module: Initialized successfully');
        } else {
            console.log('⚠️  Admin Module: Initialization failed');
        }

        // 3. Initialize data import module
        console.log('📁 Initializing data import module...');
        const importInitialized = await dataImportModule.initialize();

        if (importInitialized) {
            console.log('📁 Data Import Module: Initialized successfully');
        } else {
            console.log('⚠️  Data Import Module: Initialization failed (will retry on first use)');
        }

        // 4. Setup routes after initialization
        console.log('🛣️  Setting up routes...');

        // Health check endpoint (enhanced with database status)
        app.get('/api/health', async (req, res) => {
            try {
                const dbStatus = await database.testConnection();
                const importStatus = dataImportModule.getStatus();

                res.json({
                    success: true,
                    data: {
                        status: 'healthy',
                        timestamp: new Date().toISOString(),
                        database: dbStatus,
                        modules: {
                            dataImport: importStatus
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

        // Data Import API routes - only setup if module is initialized
        if (importInitialized) {
            app.use('/api/data-import', dataImportModule.getRoutes());
            console.log('🛣️  Data import API routes: ✅ Configured');
        } else {
            // Fallback routes for when module is not initialized
            app.use('/api/data-import', (req, res) => {
                res.status(503).json({
                    success: false,
                    error: 'Data import service unavailable',
                    message: 'Module initialization failed. Please contact administrator.'
                });
            });
            console.log('🛣️  Data import API routes: ⚠️ Fallback configured');
        }

        // ✅ UPDATE: Admin interface routes - add generic import routes
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
                // Shutdown data import module
                try {
                    await dataImportModule.shutdown();
                    console.log('📁 Data import module shutdown: ✅');
                } catch (error) {
                    console.error('📁 Data import module shutdown: ❌', error.message);
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