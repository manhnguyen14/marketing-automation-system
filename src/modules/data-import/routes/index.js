const express = require('express');
const multer = require('multer');
const authMiddleware = require('../../../core/auth/middleware/authMiddleware');
const fileUpload = require('../../../shared/middleware/fileUpload');
const fileValidator = require('../../../shared/middleware/fileValidator');
const importController = require('../controllers/importController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.requireAuth);

// Configure multer for file uploads (memory storage for direct processing)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152, // 2MB default
        files: 1 // Only one file at a time
    },
    fileFilter: (req, file, cb) => {
        // Basic file type validation (additional validation in middleware)
        if (file.mimetype === 'text/csv' ||
            file.mimetype === 'application/csv' ||
            file.mimetype === 'text/plain' ||
            file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

/**
 * Customer import routes
 */

// Upload and import CSV file
router.post('/customers/upload',
    upload.single('file'),
    fileValidator.validateCSVFile,
    importController.uploadCustomerCSV
);

// Validate CSV file without importing (preview)
router.post('/customers/validate',
    upload.single('file'),
    fileValidator.validateCSVFile,
    importController.validateCSVFile
);

// Get import configuration and limits
router.get('/customers/config',
    importController.getImportConfig
);

// Get import template
router.get('/customers/template',
    importController.getImportTemplate
);

/**
 * Error handling middleware for multer
 */
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                const maxSizeMB = (parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024;
                return res.status(400).json({
                    success: false,
                    error: 'File too large',
                    message: `File size exceeds maximum limit of ${maxSizeMB.toFixed(1)}MB`
                });

            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Too many files',
                    message: 'Only one file can be uploaded at a time'
                });

            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Unexpected file field',
                    message: 'File must be uploaded in the "file" field'
                });

            default:
                return res.status(400).json({
                    success: false,
                    error: 'File upload error',
                    message: error.message
                });
        }
    }

    if (error.message === 'Only CSV files are allowed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid file type',
            message: 'Only CSV files (.csv) are allowed'
        });
    }

    // Pass other errors to global error handler
    next(error);
});

/**
 * Health check for data import module
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        module: 'data-import',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;