const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../../../core/auth');
const authUIController = require('../controllers/authUIController');
const dashboardController = require('../controllers/dashboardController');
const importUIController = require('../controllers/importUIController');

// Configure multer for file uploads in admin interface
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152, // 2MB default
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

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

// Import routes
router.get('/import/customers', authMiddleware.requireAuth, importUIController.renderImportPage);
router.post('/import/customers/upload', authMiddleware.requireAuth, upload.single('file'), importUIController.handleFileUpload);
router.get('/import/customers/template', authMiddleware.requireAuth, importUIController.downloadTemplate);
router.get('/import/customers/error-report', authMiddleware.requireAuth, importUIController.showErrorReport);
router.post('/import/customers/clear-report', authMiddleware.requireAuth, importUIController.clearErrorReport);
router.get('/import/customers/status', authMiddleware.requireAuth, importUIController.getImportStatus);

// Error handling middleware for multer errors in admin interface
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.message === 'Only CSV files are allowed') {
        let errorMessage = 'File upload failed';

        if (error.code === 'LIMIT_FILE_SIZE') {
            const maxSizeMB = (parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024;
            errorMessage = `File size exceeds maximum limit of ${maxSizeMB.toFixed(1)}MB`;
        } else if (error.message === 'Only CSV files are allowed') {
            errorMessage = 'Only CSV files (.csv) are allowed';
        } else {
            errorMessage = error.message || 'File upload error';
        }

        // Set flash message and redirect
        if (req.session) {
            req.session.errorMessage = errorMessage;
        }

        return res.redirect('/admin/import/customers');
    }

    next(error);
});

// Default admin route - redirect to dashboard
router.get('/', authMiddleware.requireAuth, (req, res) => {
    res.redirect('/admin/dashboard');
});

module.exports = router;