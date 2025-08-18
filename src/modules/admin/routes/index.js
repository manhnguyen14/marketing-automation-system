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

// Default admin route - redirect to dashboard
router.get('/', authMiddleware.requireAuth, (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;