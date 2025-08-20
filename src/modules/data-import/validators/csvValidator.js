const csv = require('csv-parser');
const { Readable } = require('stream');

class CSVValidator {
    constructor() {
        this.errors = [];
    }

    /**
     * Validate CSV file structure and format
     * Stage 1-2 validation (fatal errors)
     */
    async validateCSVStructure(fileBuffer, importMode) {
        this.errors = [];

        try {
            // Convert buffer to string for initial validation
            const csvContent = fileBuffer.toString('utf8');

            // Check if file is empty
            if (!csvContent.trim()) {
                this.errors.push('File is empty');
                return { isValid: false, errors: this.errors };
            }

            // Check for BOM and remove if present
            const cleanContent = csvContent.replace(/^\uFEFF/, '');

            // Split into lines for basic structure validation
            const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());

            if (lines.length < 2) {
                this.errors.push('File must contain at least a header row and one data row');
                return { isValid: false, errors: this.errors };
            }

            // Validate header row
            const headerLine = lines[0];
            const headers = this.parseCSVLine(headerLine);

            if (!headers || headers.length === 0) {
                this.errors.push('Invalid or missing header row');
                return { isValid: false, errors: this.errors };
            }

            // Trim headers and convert to lowercase for comparison
            const cleanHeaders = headers.map(h => h.trim().toLowerCase());

            // Validate required headers based on import mode
            const validationResult = this.validateHeaders(cleanHeaders, importMode);
            if (!validationResult.isValid) {
                this.errors.push(...validationResult.errors);
                return { isValid: false, errors: this.errors };
            }

            // Validate CSV structure by parsing a few rows
            const structureValidation = await this.validateCSVParsing(fileBuffer);
            if (!structureValidation.isValid) {
                this.errors.push(...structureValidation.errors);
                return { isValid: false, errors: this.errors };
            }

            return { isValid: true, errors: [] };

        } catch (error) {
            this.errors.push(`File format error: ${error.message}`);
            return { isValid: false, errors: this.errors };
        }
    }

    /**
     * Validate required headers based on import mode
     */
    validateHeaders(headers, importMode) {
        const errors = [];

        // Define allowed headers
        const allowedHeaders = ['email', 'name', 'status', 'topics_of_interest'];

        if (importMode === 'update_customer') {
            allowedHeaders.push('customer_id');
        }

        // Check for required headers
        if (importMode === 'add_customer') {
            if (!headers.includes('email')) {
                errors.push('Missing required header: email (required for Add New Records mode)');
            }
        } else if (importMode === 'update_customer') {
            if (!headers.includes('customer_id')) {
                errors.push('Missing required header: customer_id (required for Update Existing Records mode)');
            }
        }

        // Check for duplicate headers
        const headerCounts = {};
        headers.forEach(header => {
            headerCounts[header] = (headerCounts[header] || 0) + 1;
        });

        Object.keys(headerCounts).forEach(header => {
            if (headerCounts[header] > 1) {
                errors.push(`Duplicate header found: ${header}`);
            }
        });

        // Check for invalid headers
        headers.forEach(header => {
            if (header && !allowedHeaders.includes(header)) {
                errors.push(`Invalid header: ${header}. Allowed headers: ${allowedHeaders.join(', ')}`);
            }
        });

        // Check for empty headers
        headers.forEach((header, index) => {
            if (!header || header.trim() === '') {
                errors.push(`Empty header found at column ${index + 1}`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Parse a single CSV line handling quotes and escaping
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add the last field
        result.push(current);
        return result;
    }

    /**
     * Validate CSV parsing using csv-parser library
     */
    async validateCSVParsing(fileBuffer) {
        return new Promise((resolve) => {
            const errors = [];
            let rowCount = 0;
            let headersParsed = false;

            const stream = Readable.from(fileBuffer.toString('utf8'))
                .pipe(csv({
                    skipEmptyLines: true,
                    strict: false // Don't fail on inconsistent columns
                }));

            stream.on('headers', (headers) => {
                headersParsed = true;
            });

            stream.on('data', (row) => {
                rowCount++;
                // Just count rows, detailed validation happens later
                if (rowCount > 10) {
                    // Stop after checking first 10 rows for structure
                    stream.destroy();
                }
            });

            stream.on('error', (error) => {
                errors.push(`CSV parsing error: ${error.message}`);
                resolve({ isValid: false, errors });
            });

            stream.on('end', () => {
                if (!headersParsed) {
                    errors.push('Failed to parse CSV headers');
                }
                if (rowCount === 0) {
                    errors.push('No data rows found');
                }
                resolve({ isValid: errors.length === 0, errors });
            });

            stream.on('close', () => {
                if (!headersParsed && errors.length === 0) {
                    errors.push('CSV parsing was interrupted');
                }
                resolve({ isValid: errors.length === 0, errors });
            });
        });
    }

    /**
     * Get file format validation errors
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Clear validation errors
     */
    clearErrors() {
        this.errors = [];
    }
}

module.exports = new CSVValidator();