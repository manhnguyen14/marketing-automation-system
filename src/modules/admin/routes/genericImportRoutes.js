const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../../../core/auth');
const genericImportUIController = require('../controllers/genericImportUIController');
const importConfigs = require('../../data-import/config/importConfigs');

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
 * Middleware to validate entity parameter
 */
function validateEntity(req, res, next) {
    const { entity } = req.params;

    if (!entity) {
        req.session.errorMessage = 'Entity type is required.';
        return res.redirect('/admin/import');
    }

    if (!importConfigs.hasEntity(entity)) {
        const availableEntities = importConfigs.getAvailableEntities();
        req.session.errorMessage = `3. Entity '${entity}' is not supported. Available entities: ${availableEntities.join(', ')}`;
        return res.redirect('/admin/import');
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
        req.session.errorMessage = 'Please select an import mode.';
        return res.redirect(`/admin/import-data/${entity}`);
    }

    // Normalize mode format
    const normalizedMode = mode.startsWith('add_') || mode.startsWith('update_')
        ? mode
        : `${mode}_${entity}`;

    const validModes = [`add_${entity}`, `update_${entity}`];

    if (!validModes.includes(normalizedMode)) {
        req.session.errorMessage = `Invalid import mode for ${entity}. Must be 'add' or 'update'.`;
        return res.redirect(`/admin/import-data/${entity}`);
    }

    // Store normalized mode for controller
    req.body.mode = normalizedMode;
    next();
}

/**
 * All routes require authentication
 */
router.use(authMiddleware.requireAuth);

/**
 * Entity selection and general import routes
 */

// Main import page - entity selection
router.get('/', genericImportUIController.renderEntitySelectionPage);

/**
 * Entity-specific import routes
 */

// Entity import interface
router.get('/:entity',
    validateEntity,
    genericImportUIController.renderEntityImportPage
);

// Handle entity file upload
router.post('/:entity/upload',
    validateEntity,
    upload.single('file'),
    validateImportMode,
    genericImportUIController.handleEntityFileUpload
);

// Download entity template
router.get('/:entity/template',
    validateEntity,
    genericImportUIController.downloadEntityTemplate
);

// Show entity error report
router.get('/:entity/error-report',
    validateEntity,
    genericImportUIController.showEntityErrorReport
);

// Clear entity error report
router.post('/:entity/clear-report',
    validateEntity,
    genericImportUIController.clearEntityErrorReport
);

// Get entity import status (AJAX)
router.get('/:entity/status',
    validateEntity,
    genericImportUIController.getEntityImportStatus
);

/**
 * Error handling middleware for multer errors in admin interface
 */
router.use((error, req, res, next) => {
    const { entity } = req.params;

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

        // Redirect to appropriate page
        const redirectPath = entity ? `/admin/import-data/${entity}` : '/admin/import-data';
        return res.redirect(redirectPath);
    }

    next(error);
});

module.exports = router;