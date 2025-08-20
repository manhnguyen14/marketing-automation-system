const multer = require('multer');
const mime = require('mime-types');

class FileUploadMiddleware {
    constructor() {
        this.maxFileSize = parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152; // 2MB default
        this.allowedMimeTypes = [
            'text/csv',
            'application/csv',
            'text/plain'
        ];
        this.allowedExtensions = ['.csv'];
    }

    /**
     * Create multer configuration for CSV file uploads
     */
    createCSVUploadConfig() {
        return multer({
            storage: multer.memoryStorage(),
            limits: {
                fileSize: this.maxFileSize,
                files: 1, // Only one file at a time
                fields: 10, // Limit form fields
                fieldNameSize: 100, // Limit field name size
                fieldSize: 1024 // Limit field value size
            },
            fileFilter: this.csvFileFilter.bind(this)
        });
    }

    /**
     * File filter for CSV files only
     */
    csvFileFilter(req, file, callback) {
        try {
            // Check file extension
            const fileExtension = this.getFileExtension(file.originalname);
            if (!this.allowedExtensions.includes(fileExtension.toLowerCase())) {
                return callback(new Error('INVALID_FILE_TYPE'), false);
            }

            // Check MIME type if available
            if (file.mimetype && !this.allowedMimeTypes.includes(file.mimetype)) {
                return callback(new Error('INVALID_MIME_TYPE'), false);
            }

            // Validate filename
            if (!file.originalname || file.originalname.trim() === '') {
                return callback(new Error('INVALID_FILENAME'), false);
            }

            // Check for potentially dangerous filenames
            if (this.isDangerousFilename(file.originalname)) {
                return callback(new Error('DANGEROUS_FILENAME'), false);
            }

            callback(null, true);

        } catch (error) {
            callback(new Error('FILE_FILTER_ERROR'), false);
        }
    }

    /**
     * Middleware for handling single CSV file upload
     */
    uploadSingleCSV() {
        const upload = this.createCSVUploadConfig();

        return (req, res, next) => {
            upload.single('file')(req, res, (error) => {
                if (error) {
                    return this.handleUploadError(error, req, res, next);
                }
                next();
            });
        };
    }

    /**
     * Handle multer upload errors with user-friendly messages
     */
    handleUploadError(error, req, res, next) {
        let statusCode = 400;
        let errorMessage = 'File upload failed';
        let userMessage = 'An error occurred during file upload';

        if (error instanceof multer.MulterError) {
            switch (error.code) {
                case 'LIMIT_FILE_SIZE':
                    const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
                    errorMessage = 'File too large';
                    userMessage = `File size exceeds maximum limit of ${maxSizeMB}MB`;
                    break;

                case 'LIMIT_FILE_COUNT':
                    errorMessage = 'Too many files';
                    userMessage = 'Only one file can be uploaded at a time';
                    break;

                case 'LIMIT_UNEXPECTED_FILE':
                    errorMessage = 'Unexpected file field';
                    userMessage = 'File must be uploaded in the "file" field';
                    break;

                case 'LIMIT_FIELD_COUNT':
                    errorMessage = 'Too many form fields';
                    userMessage = 'Form contains too many fields';
                    break;

                default:
                    errorMessage = 'File upload error';
                    userMessage = error.message || 'Unknown file upload error';
            }
        } else if (error.message) {
            switch (error.message) {
                case 'INVALID_FILE_TYPE':
                    errorMessage = 'Invalid file type';
                    userMessage = 'Only CSV files (.csv) are allowed';
                    break;

                case 'INVALID_MIME_TYPE':
                    errorMessage = 'Invalid file format';
                    userMessage = 'File format is not recognized as CSV';
                    break;

                case 'INVALID_FILENAME':
                    errorMessage = 'Invalid filename';
                    userMessage = 'Filename is missing or invalid';
                    break;

                case 'DANGEROUS_FILENAME':
                    errorMessage = 'Dangerous filename';
                    userMessage = 'Filename contains potentially dangerous characters';
                    break;

                default:
                    errorMessage = error.message;
                    userMessage = 'File upload validation failed';
            }
        }

        // For API requests, return JSON error
        if (req.path.startsWith('/api/')) {
            return res.status(statusCode).json({
                success: false,
                error: errorMessage,
                message: userMessage
            });
        }

        // For admin interface, set flash message and redirect
        if (req.session) {
            req.session.errorMessage = userMessage;
            return res.redirect(req.get('Referer') || '/admin/import-data/customers');
        }

        // Fallback error response
        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            message: userMessage
        });
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') {
            return '';
        }

        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return '';
        }

        return filename.substring(lastDotIndex);
    }

    /**
     * Check if filename contains dangerous characters or patterns
     */
    isDangerousFilename(filename) {
        // Check for null bytes
        if (filename.includes('\0')) {
            return true;
        }

        // Check for path traversal attempts
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return true;
        }

        // Check for potentially dangerous characters
        const dangerousChars = ['<', '>', ':', '"', '|', '?', '*'];
        for (const char of dangerousChars) {
            if (filename.includes(char)) {
                return true;
            }
        }

        // Check filename length
        if (filename.length > 255) {
            return true;
        }

        return false;
    }

    /**
     * Validate file buffer content for basic CSV characteristics
     */
    validateCSVBuffer(buffer) {
        try {
            if (!buffer || buffer.length === 0) {
                return { isValid: false, error: 'File is empty' };
            }

            // Check file size
            if (buffer.length > this.maxFileSize) {
                const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
                return { isValid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
            }

            // Convert to string for content analysis
            const content = buffer.toString('utf8', 0, Math.min(1024, buffer.length));

            // Basic CSV content checks
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 1) {
                return { isValid: false, error: 'File appears to be empty' };
            }

            // Check for common CSV patterns
            const firstLine = lines[0];
            if (!firstLine.includes(',')) {
                return { isValid: false, error: 'File does not appear to be in CSV format' };
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, error: 'Unable to validate file content' };
        }
    }

    /**
     * Get upload configuration summary
     */
    getConfigSummary() {
        return {
            maxFileSize: this.maxFileSize,
            maxFileSizeMB: (this.maxFileSize / 1024 / 1024).toFixed(1),
            allowedExtensions: this.allowedExtensions,
            allowedMimeTypes: this.allowedMimeTypes,
            maxFiles: 1
        };
    }
}

// Create and export singleton instance
const fileUploadMiddleware = new FileUploadMiddleware();

module.exports = {
    // Main middleware functions
    uploadSingleCSV: () => fileUploadMiddleware.uploadSingleCSV(),

    // Utility functions
    validateCSVBuffer: (buffer) => fileUploadMiddleware.validateCSVBuffer(buffer),
    getConfigSummary: () => fileUploadMiddleware.getConfigSummary(),

    // Direct access to instance
    instance: fileUploadMiddleware
};