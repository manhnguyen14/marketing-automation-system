const express = require('express');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');
const path = require('path');
require('dotenv').config();

// Import configuration and validate environment
const config = require('./config');

// Import modules
const { authController } = require('./core/auth');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Authentication API routes
app.post('/api/auth/login', authController.login);
app.get('/api/auth/logout', authController.logout);

// Admin interface routes
app.use('/admin', adminModule.routes);

// Default redirects
app.get('/', (req, res) => res.redirect('/admin/dashboard'));

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Marketing Automation System Started');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/admin/login`);
    console.log(`💡 Health check: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50));
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Admin user: ${config.auth.username}`);
    console.log('='.repeat(50));
});

module.exports = app;