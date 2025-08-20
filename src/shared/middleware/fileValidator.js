const mime = require('mime-types');

class FileValidatorMiddleware {
    constructor() {
        this.maxFileSize = parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152; // 2MB
        this.allowedExtensions = ['.csv'];
        this.allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    }

    /**
     * Validate CSV file middleware
     * Performs additional validation after multer processing
     */
    validateCSVFile(req, res, next) {
        try {
            const file = req.file;

            // Check if file exists (should be caught by multer, but double-check)
            if (!file) {
                return this.sendValidationError(
                    req, res,
                    'NO_FILE',
                    'No file uploaded',
                    'Please select a CSV file to upload'
                );
            }

            // Validate file properties
            const validationResult = this.validateFileProperties(file);
            if (!validationResult.isValid) {
                return this.sendValidationError(
                    req, res,
                    'FILE_VALIDATION',
                    validationResult.error,
                    validationResult.userMessage
                );
            }

            // Validate file content
            const contentValidation = this.validateFileContent(file);
            if (!contentValidation.isValid) {
                return this.sendValidationError(
                    req, res,
                    'CONTENT_VALIDATION',
                    contentValidation.error,
                    contentValidation.userMessage
                );
            }

            // Add validation metadata to request
            req.fileValidation = {
                validated: true,
                fileInfo: {
                    originalName: file.originalname,
                    size: file.size,
                    sizeMB: (file.size / 1024 / 1024).toFixed(2),
                    mimetype: file.mimetype,
                    extension: this.getFileExtension(file.originalname)
                }
            };

            next();

        } catch (error) {
            console.error('File validation middleware error:', error);

            return this.sendValidationError(
                req, res,
                'VALIDATION_ERROR',
                'File validation failed',
                'An error occurred while validating the file'
            );
        }
    }

    /**
     * Validate file properties (size, type, name)
     */
    validateFileProperties(file) {
        // Validate file size
        if (file.size > this.maxFileSize) {
            const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
            return {
                isValid: false,
                error: 'File size exceeds limit',
                userMessage: `File size exceeds maximum limit of ${maxSizeMB}MB`
            };
        }

        // Validate file extension
        const extension = this.getFileExtension(file.originalname);
        if (!this.allowedExtensions.includes(extension.toLowerCase())) {
            return {
                isValid: false,
                error: 'Invalid file extension',
                userMessage: 'Only CSV files (.csv) are allowed'
            };
        }

        // Validate MIME type if available
        if (file.mimetype && !this.allowedMimeTypes.includes(file.mimetype)) {
            return {
                isValid: false,
                error: 'Invalid MIME type',
                userMessage: 'File format is not recognized as CSV'
            };
        }

        // Validate filename
        if (!file.originalname || file.originalname.trim() === '') {
            return {
                isValid: false,
                error: 'Invalid filename',
                userMessage: 'Filename is missing or invalid'
            };
        }

        // Check for dangerous filename patterns
        if (this.isDangerousFilename(file.originalname)) {
            return {
                isValid: false,
                error: 'Dangerous filename',
                userMessage: 'Filename contains potentially unsafe characters'
            };
        }

        return { isValid: true };
    }

    /**
     * Validate file content for basic CSV characteristics
     */
    validateFileContent(file) {
        try {
            const buffer = file.buffer;

            // Check if buffer exists and has content
            if (!buffer || buffer.length === 0) {
                return {
                    isValid: false,
                    error: 'Empty file buffer',
                    userMessage: 'File appears to be empty or corrupted'
                };
            }

            // Check for minimum file size (at least some content)
            if (buffer.length < 10) {
                return {
                    isValid: false,
                    error: 'File too small',
                    userMessage: 'File is too small to contain valid CSV data'
                };
            }

            // Basic CSV content validation
            const contentValidation = this.validateCSVContent(buffer);
            if (!contentValidation.isValid) {
                return {
                    isValid: false,
                    error: contentValidation.error,
                    userMessage: contentValidation.userMessage
                };
            }

            return { isValid: true };

        } catch (error) {
            return {
                isValid: false,
                error: 'Content validation error',
                userMessage: 'Unable to validate file content'
            };
        }
    }

    /**
     * Validate CSV content structure
     */
    validateCSVContent(buffer) {
        try {
            // Read first part of file for analysis
            const sampleSize = Math.min(2048, buffer.length);
            const content = buffer.toString('utf8', 0, sampleSize);

            // Remove BOM if present
            const cleanContent = content.replace(/^\uFEFF/, '');

            // Check for basic content
            if (!cleanContent.trim()) {
                return {
                    isValid: false,
                    error: 'Empty file content',
                    userMessage: 'File appears to be empty'
                };
            }

            // Split into lines
            const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());

            if (lines.length < 1) {
                return {
                    isValid: false,
                    error: 'No data lines found',
                    userMessage: 'File must contain at least a header row'
                };
            }

            // Check first line for CSV characteristics
            const firstLine = lines[0].trim();

            // Must contain commas (basic CSV requirement)
            if (!firstLine.includes(',')) {
                return {
                    isValid: false,
                    error: 'No CSV delimiters found',
                    userMessage: 'File does not appear to be in CSV format (no commas found)'
                };
            }

            // Check for reasonable number of columns (between 2 and 20)
            const columnCount = firstLine.split(',').length;
            if (columnCount < 2) {
                return {
                    isValid: false,
                    error: 'Too few columns',
                    userMessage: 'CSV file must have at least 2 columns'
                };
            }

            if (columnCount > 20) {
                return {
                    isValid: false,
                    error: 'Too many columns',
                    userMessage: 'CSV file has too many columns (maximum 20 allowed)'
                };
            }

            // Check for potentially malicious content
            const maliciousPatterns = ['<script', '<?php', '<%', 'javascript:', 'data:'];
            const lowerContent = cleanContent.toLowerCase();

            for (const pattern of maliciousPatterns) {
                if (lowerContent.includes(pattern)) {
                    return {
                        isValid: false,
                        error: 'Potentially malicious content',
                        userMessage: 'File contains potentially unsafe content'
                    };
                }
            }

            return { isValid: true };

        } catch (error) {
            return {
                isValid: false,
                error: 'CSV parsing error',
                userMessage: 'Unable to parse file as CSV'
            };
        }
    }

    /**
     * Check if filename contains dangerous patterns
     */
    isDangerousFilename(filename) {
        // Null byte check
        if (filename.includes('\0')) return true;

        // Path traversal check
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return true;

        // Dangerous characters
        const dangerousChars = ['<', '>', ':', '"', '|', '?', '*', ';', '&'];
        for (const char of dangerousChars) {
            if (filename.includes(char)) return true;
        }

        // Length check
        if (filename.length > 255) return true;

        // Check for executable extensions
        const executableExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js', '.vbs'];
        const extension = this.getFileExtension(filename).toLowerCase();
        if (executableExtensions.includes(extension)) return true;

        return false;
    }

    /**
     * Get file extension from filename
     */
    getFileExtension(filename) {
        if (!filename || typeof filename !== 'string') return '';

        const lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
    }

    /**
     * Send validation error response
     */
    sendValidationError(req, res, errorCode, error, userMessage) {
        // For API requests
        if (req.path.startsWith('/api/')) {
            return res.status(400).json({
                success: false,
                error: error,
                error_code: errorCode,
                message: userMessage
            });
        }

        // For admin interface
        if (req.session) {
            req.session.errorMessage = userMessage;
            const redirectUrl = req.get('Referer') || '/admin/import/customers';
            return res.redirect(redirectUrl);
        }

        // Fallback response
        return res.status(400).json({
            success: false,
            error: error,
            message: userMessage
        });
    }

    /**
     * Validate import mode parameter for any entity
     */
    validateImportMode(req, res, next) {
        try {
            const { mode } = req.body;
            const { entity } = req.params; // Get entity from route parameter

            if (!mode) {
                return this.sendValidationError(
                    req, res,
                    'MISSING_MODE',
                    'Import mode required',
                    'Please select import mode (Add or Update)'
                );
            }

            // Normalize mode format to include entity
            let normalizedMode = mode;
            if (entity && !mode.includes('_')) {
                normalizedMode = `${mode}_${entity}`;
            }

            const validModePatterns = ['add_', 'update_'];
            const isValidMode = validModePatterns.some(pattern => normalizedMode.startsWith(pattern));

            if (!isValidMode) {
                return this.sendValidationError(
                    req, res,
                    'INVALID_MODE',
                    'Invalid import mode',
                    `Import mode must start with 'add' or 'update'${entity ? ` for ${entity}` : ''}`
                );
            }

            // Store normalized mode
            req.body.mode = normalizedMode;
            next();

        } catch (error) {
            console.error('Import mode validation error:', error);

            return this.sendValidationError(
                req, res,
                'MODE_VALIDATION_ERROR',
                'Mode validation failed',
                'An error occurred while validating import mode'
            );
        }
    }

    /**
     * Get validation configuration
     */
    getValidationConfig() {
        return {
            maxFileSize: this.maxFileSize,
            maxFileSizeMB: (this.maxFileSize / 1024 / 1024).toFixed(1),
            allowedExtensions: this.allowedExtensions,
            allowedMimeTypes: this.allowedMimeTypes,
            maxColumns: 20,
            minColumns: 2
        };
    }
}

// Create and export singleton instance
const fileValidatorMiddleware = new FileValidatorMiddleware();

module.exports = {
    // Main middleware functions
    validateCSVFile: (req, res, next) => fileValidatorMiddleware.validateCSVFile(req, res, next),
    validateImportMode: (req, res, next) => fileValidatorMiddleware.validateImportMode(req, res, next),

    // Utility functions
    getValidationConfig: () => fileValidatorMiddleware.getValidationConfig(),

    // Direct access to instance
    instance: fileValidatorMiddleware
};