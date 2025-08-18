const express = require('express');
const cookieParser = require('cookie-parser');
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
const errorHandler = require('./shared/middleware/errorHandler');

const app = express();

// View engine setup
app.engine('hbs', engine({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'modules/admin/views/layouts'),
    partialsDir: path.join(__dirname, 'modules/admin/views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'modules/admin/views'));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint (enhanced with database status)
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = await database.testConnection();

        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: dbStatus,
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

// Admin interface routes
app.use('/admin', adminModule.routes);

// Default redirects
app.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Error handling middleware (must be last)
app.use(errorHandler);

// Application initialization and startup
async function startServer() {
    try {
        console.log('='.repeat(50));
        console.log('🚀 Marketing Automation System Starting...');
        console.log('='.repeat(50));

        // Initialize database (non-blocking)
        const dbInitialized = await database.initialize();

        // Start server
        const server = app.listen(config.port, () => {
            console.log(`📡 Server running on: http://localhost:${config.port}`);
            console.log(`🔐 Admin login: http://localhost:${config.port}/admin/login`);
            console.log(`💡 Health check: http://localhost:${config.port}/api/health`);
            console.log('='.repeat(50));
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`Admin user: ${config.auth.username}`);

            if (dbInitialized && database.isReady()) {
                console.log('💾 Database: Connected and ready');
            } else {
                console.log('⚠️  Database: Not available (running in limited mode)');
            }

            console.log('='.repeat(50));
            console.log('✅ System ready for use!');
        });

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down gracefully...');

            server.close(async () => {
                await database.close();
                console.log('✅ Server shut down complete');
                process.exit(0);
            });
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