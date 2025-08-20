const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../../core/auth');
const authUIController = require('../controllers/authUIController');
const dashboardController = require('../controllers/dashboardController');

/**
 * Public routes (no authentication required)
 */

// Login page - redirect to dashboard if already authenticated
router.get('/login', authMiddleware.redirectIfAuthenticated, authUIController.showLogin);

/**
 * Protected routes (authentication required)
 */

// Dashboard - main admin interface
router.get('/dashboard', authMiddleware.requireAuth, dashboardController.showDashboard);

/**
 * Import Navigation Routes
 */

// Main import page - redirect to generic import selection
router.get('/import', authMiddleware.requireAuth, (req, res) => {
    res.redirect('/admin/import-data');
});

/**
 * General Admin Routes
 */

// Default admin route - redirect to dashboard
router.get('/', authMiddleware.requireAuth, (req, res) => {
    res.redirect('/admin/dashboard');
});

// Health check for admin module
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        module: 'admin',
        status: 'healthy',
        features: {
            authentication: 'ready',
            dashboard: 'ready',
            genericImport: 'ready'
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;