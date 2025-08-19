const mime = require('mime-types');
const csvValidator = require('../validators/csvValidator');
const dataValidator = require('../validators/dataValidator');

class DataValidationService {
    constructor() {
        this.maxFileSize = parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152; // 2MB default
        this.allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
        this.allowedExtensions = ['.csv'];
    }

    /**
     * Validate uploaded file (Stage 1 validation)
     */
    validateUploadedFile(file) {
        const errors = [];

        // Check if file exists
        if (!file) {
            errors.push('No file uploaded');
            return { isValid: false, errors };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(1);
            errors.push(`File size exceeds maximum limit of ${maxSizeMB}MB`);
        }

        // Check file extension
        const fileExtension = this.getFileExtension(file.originalname);
        if (!this.allowedExtensions.includes(fileExtension.toLowerCase())) {
            errors.push(`Invalid file type. Only CSV files (.csv) are allowed`);
        }

        // Check MIME type if available
        if (file.mimetype && !this.allowedMimeTypes.includes(file.mimetype)) {
            errors.push(`Invalid file format. Expected CSV format`);
        }

        // Check file name
        if (!file.originalname || file.originalname.trim() === '') {
            errors.push('Invalid file name');
        }

        // Check file buffer
        if (!file.buffer || file.buffer.length === 0) {
            errors.push('File appears to be empty or corrupted');
        }

        return {
            isValid: errors.length === 0,
            errors,
            fileInfo: {
                name: file.originalname,
                size: file.size,
                sizeMB: (file.size / 1024 / 1024).toFixed(2),
                extension: fileExtension,
                mimetype: file.mimetype
            }
        };
    }

    /**
     * Validate import mode parameter
     */
    validateImportMode(mode) {
        const validModes = ['add', 'update'];

        if (!mode) {
            return {
                isValid: false,
                error: 'Import mode is required'
            };
        }

        if (!validModes.includes(mode.toLowerCase())) {
            return {
                isValid: false,
                error: `Invalid import mode: ${mode}. Must be 'add' or 'update'`
            };
        }

        return {
            isValid: true,
            normalizedMode: mode.toLowerCase()
        };
    }

    /**
     * Comprehensive file validation (Stages 1-2)
     */
    async validateFileForImport(file, importMode) {
        // Stage 1: File upload validation
        const fileValidation = this.validateUploadedFile(file);
        if (!fileValidation.isValid) {
            return {
                success: false,
                stage: 'file_upload',
                errors: fileValidation.errors,
                message: 'File upload validation failed'
            };
        }

        // Validate import mode
        const modeValidation = this.validateImportMode(importMode);
        if (!modeValidation.isValid) {
            return {
                success: false,
                stage: 'import_mode',
                errors: [modeValidation.error],
                message: 'Import mode validation failed'
            };
        }

        // Stage 2: CSV structure validation
        try {
            const structureValidation = await csvValidator.validateCSVStructure(
                file.buffer,
                modeValidation.normalizedMode
            );

            if (!structureValidation.isValid) {
                return {
                    success: false,
                    stage: 'csv_structure',
                    errors: structureValidation.errors,
                    message: 'CSV format validation failed'
                };
            }

            return {
                success: true,
                fileInfo: fileValidation.fileInfo,
                importMode: modeValidation.normalizedMode,
                message: 'File validation successful'
            };

        } catch (error) {
            return {
                success: false,
                stage: 'csv_structure',
                errors: [`CSV validation error: ${error.message}`],
                message: 'CSV format validation failed'
            };
        }
    }

    /**
     * Validate CSV data preview (first few rows for user confirmation)
     */
    async validateDataPreview(fileBuffer, importMode, previewRows = 5) {
        try {
            const csv = require('csv-parser');
            const { Readable } = require('stream');

            const rows = [];
            let headers = [];

            await new Promise((resolve, reject) => {
                const stream = Readable.from(fileBuffer.toString('utf8'))
                    .pipe(csv({ skipEmptyLines: true }));

                stream.on('headers', (parsedHeaders) => {
                    headers = parsedHeaders;
                });

                stream.on('data', (row) => {
                    if (rows.length < previewRows) {
                        rows.push(row);
                    } else {
                        stream.destroy(); // Stop reading after preview rows
                    }
                });

                stream.on('error', reject);
                stream.on('end', resolve);
                stream.on('close', resolve);
            });

            // Validate preview rows
            const previewValidation = [];
            const existingEmails = new Set();

            for (let i = 0; i < rows.length; i++) {
                const rowValidation = await dataValidator.validateRowData(
                    rows[i],
                    i + 2, // +2 for 1-based and header row
                    importMode,
                    existingEmails
                );

                previewValidation.push({
                    rowIndex: i + 2,
                    data: rowValidation.trimmedData,
                    isValid: rowValidation.isValid,
                    errors: rowValidation.errors
                });

                // Track emails for duplicate detection
                if (rowValidation.trimmedData.email) {
                    existingEmails.add(rowValidation.trimmedData.email.toLowerCase());
                }
            }

            return {
                success: true,
                headers,
                previewRows: previewValidation,
                totalRows: rows.length,
                hasErrors: previewValidation.some(row => !row.isValid)
            };

        } catch (error) {
            return {
                success: false,
                error: `Preview validation failed: ${error.message}`
            };
        }
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
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get validation summary for display
     */
    getValidationSummary(validationResult) {
        if (!validationResult.success) {
            return {
                status: 'error',
                stage: validationResult.stage,
                message: validationResult.message,
                errors: validationResult.errors,
                canProceed: false
            };
        }

        return {
            status: 'success',
            message: validationResult.message,
            fileInfo: validationResult.fileInfo,
            importMode: validationResult.importMode,
            canProceed: true
        };
    }

    /**
     * Generate validation error message for UI display
     */
    formatValidationErrors(errors) {
        if (!errors || errors.length === 0) {
            return '';
        }

        if (errors.length === 1) {
            return errors[0];
        }

        return `Multiple validation errors:\n• ${errors.join('\n• ')}`;
    }

    /**
     * Check if file appears to be CSV based on content
     */
    validateCSVContent(fileBuffer) {
        try {
            const content = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));

            // Basic CSV content checks
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                return { isValid: false, error: 'File must contain at least a header row and one data row' };
            }

            // Check for common CSV patterns
            const firstLine = lines[0];
            const hasCommas = firstLine.includes(',');
            const hasQuotes = firstLine.includes('"');

            if (!hasCommas) {
                return { isValid: false, error: 'File does not appear to be in CSV format (no commas found)' };
            }

            return { isValid: true };

        } catch (error) {
            return { isValid: false, error: `Content validation failed: ${error.message}` };
        }
    }
}

module.exports = new DataValidationService();