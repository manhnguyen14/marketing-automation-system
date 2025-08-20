const express = require('express');
const multer = require('multer');
const authMiddleware = require('../../../core/auth/middleware/authMiddleware');
const fileValidator = require('../../../shared/middleware/fileValidator');
const genericImportController = require('../controllers/genericImportController');
const importConfigs = require('../config/importConfigs');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware.requireAuth);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152, // 2MB default
        files: 1
    },
    fileFilter: (req, file, cb) => {
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
 * Middleware to validate entity parameter
 */
function validateEntity(req, res, next) {
    const { entity } = req.params;

    if (!entity) {
        return res.status(400).json({
            success: false,
            error: 'Entity parameter required',
            message: 'Please specify an entity type'
        });
    }

    if (!importConfigs.hasEntity(entity)) {
        const availableEntities = importConfigs.getAvailableEntities();
        return res.status(400).json({
            success: false,
            error: 'Invalid entity type',
            message: `Entity '${entity}' is not supported. Available entities: ${availableEntities.join(', ')}`
        });
    }

    next();
}

/**
 * Middleware to validate import mode for entity
 */
function validateImportMode(req, res, next) {
    const { entity } = req.params;
    const { mode } = req.body;

    if (!mode) {
        return res.status(400).json({
            success: false,
            error: 'Import mode required',
            message: 'Please specify import mode (add or update)'
        });
    }

    // Normalize mode format
    const normalizedMode = mode.startsWith('add_') || mode.startsWith('update_')
        ? mode
        : `${mode}_${entity}`;

    const validModes = [`add_${entity}`, `update_${entity}`];

    if (!validModes.includes(normalizedMode)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid import mode',
            message: `Import mode must be 'add' or 'update' for ${entity}`
        });
    }

    // Store normalized mode for controller
    req.body.mode = normalizedMode;
    next();
}

/**
 * Generic entity import routes
 */

// Upload and import CSV file for any entity
router.post('/:entity/upload',
    validateEntity,
    upload.single('file'),
    fileValidator.validateCSVFile,
    validateImportMode,
    genericImportController.uploadEntityCSV
);

// Validate CSV file without importing (preview)
router.post('/:entity/validate',
    validateEntity,
    upload.single('file'),
    fileValidator.validateCSVFile,
    validateImportMode,
    genericImportController.validateEntityCSV
);

// Get import configuration and limits for entity
router.get('/:entity/config',
    validateEntity,
    genericImportController.getEntityImportConfig
);

// Get import template for entity
router.get('/:entity/template',
    validateEntity,
    genericImportController.getEntityImportTemplate
);

/**
 * General import routes (not entity-specific)
 */

// Get all available entities for import
router.get('/entities',
    genericImportController.getAvailableEntities
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
 * Health check for generic import system
 */
router.get('/health', (req, res) => {
    try {
        // Validate all configurations
        importConfigs.validateAllConfigs();

        res.status(200).json({
            success: true,
            module: 'data-import-generic',
            status: 'healthy',
            entities: importConfigs.getAvailableEntities(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            module: 'data-import-generic',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;