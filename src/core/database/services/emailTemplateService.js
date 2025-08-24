const connection = require('../connection');
const EmailTemplate = require('../models/EmailTemplate');

class EmailTemplateService {
    constructor() {
        this.pool = null;
    }

    async initialize() {
        this.pool = connection.getPool();
    }

    getPool() {
        if (!this.pool) {
            this.pool = connection.getPool();
        }
        return this.pool;
    }

    // Create operations
    async createTemplate(templateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const template = EmailTemplate.create(templateData);

        const query = `
            INSERT INTO email_templates (
                name, template_code, subject_template, html_template, text_template,
                template_type, status, variation, prompt, required_variables, category
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const values = [
            template.name,
            template.templateCode,
            template.subjectTemplate,
            template.htmlTemplate,
            template.textTemplate,
            template.templateType,
            template.status,
            template.variation,
            template.prompt,
            template.requiredVariables,
            template.category
        ];

        try {
            const result = await pool.query(query, values);
            return EmailTemplate.fromDatabaseRow(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                if (error.constraint && error.constraint.includes('template_code')) {
                    throw new Error('Template with this code already exists');
                } else {
                    throw new Error('Template with this name and category already exists');
                }
            }
            throw error;
        }
    }

    // Read operations
    async getTemplateById(templateId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM email_templates WHERE template_id = $1';
        const result = await pool.query(query, [templateId]);

        if (result.rows.length === 0) {
            return null;
        }

        return EmailTemplate.fromDatabaseRow(result.rows[0]);
    }

    async getTemplateByCode(templateCode) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM email_templates WHERE template_code = $1';
        const result = await pool.query(query, [templateCode]);

        if (result.rows.length === 0) {
            return null;
        }

        return EmailTemplate.fromDatabaseRow(result.rows[0]);
    }

    async getTemplateByName(name, category = null) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        let query = 'SELECT * FROM email_templates WHERE name = $1';
        const values = [name];

        if (category) {
            query += ' AND category = $2';
            values.push(category);
        }

        query += ' AND status != \'INACTIVE\' ORDER BY created_at DESC LIMIT 1';

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        return EmailTemplate.fromDatabaseRow(result.rows[0]);
    }

    async getTemplatesByType(templateType, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, category, limit = 50, offset = 0 } = options;

        let query = 'SELECT * FROM email_templates WHERE template_type = $1';
        const values = [templateType];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(category);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailTemplate.fromDatabaseRow(row));
    }

    async getApprovedTemplates(options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { category, templateType, limit = 100, offset = 0 } = options;

        let query = 'SELECT * FROM email_templates WHERE status = \'APPROVED\'';
        const values = [];
        let paramCount = 0;

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(category);
        }

        if (templateType) {
            paramCount++;
            query += ` AND template_type = $${paramCount}`;
            values.push(templateType);
        }

        query += ` ORDER BY name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailTemplate.fromDatabaseRow(row));
    }

    async getAllTemplates(options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, templateType, category, limit = 50, offset = 0 } = options;

        let query = 'SELECT * FROM email_templates WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        if (templateType) {
            paramCount++;
            query += ` AND template_type = $${paramCount}`;
            values.push(templateType);
        }

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(category);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailTemplate.fromDatabaseRow(row));
    }

    async getTemplatesWaitingReview() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT * FROM email_templates 
            WHERE status = 'WAIT_REVIEW' 
            ORDER BY created_at ASC
        `;

        const result = await pool.query(query);
        return result.rows.map(row => EmailTemplate.fromDatabaseRow(row));
    }

    // Update operations
    async updateTemplate(templateId, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        template.update(updateData);

        const query = `
            UPDATE email_templates 
            SET name = $1, subject_template = $2, html_template = $3, text_template = $4,
                status = $5, variation = $6, prompt = $7, required_variables = $8, 
                category = $9, updated_at = NOW()
            WHERE template_id = $10
            RETURNING *
        `;

        const values = [
            template.name,
            template.subjectTemplate,
            template.htmlTemplate,
            template.textTemplate,
            template.status,
            template.variation,
            template.prompt,
            template.requiredVariables,
            template.category,
            templateId
        ];

        try {
            const result = await pool.query(query, values);
            return EmailTemplate.fromDatabaseRow(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Template name already exists in this category');
            }
            throw error;
        }
    }

    async updateTemplateStatus(templateId, status) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        if (!EmailTemplate.getValidStatuses().includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const query = `
            UPDATE email_templates 
            SET status = $1, updated_at = NOW()
            WHERE template_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [status, templateId]);

        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        return EmailTemplate.fromDatabaseRow(result.rows[0]);
    }

    async approveTemplate(templateId) {
        return await this.updateTemplateStatus(templateId, 'APPROVED');
    }

    async rejectTemplate(templateId) {
        return await this.updateTemplateStatus(templateId, 'INACTIVE');
    }

    // Delete operations
    async deleteTemplate(templateId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        // Check if template is used in any email records
        const usageQuery = 'SELECT COUNT(*) as count FROM email_records WHERE template_id = $1';
        const usageResult = await pool.query(usageQuery, [templateId]);

        if (parseInt(usageResult.rows[0].count) > 0) {
            throw new Error('Cannot delete template that has been used in email campaigns');
        }

        const query = 'DELETE FROM email_templates WHERE template_id = $1 RETURNING *';
        const result = await pool.query(query, [templateId]);

        if (result.rows.length === 0) {
            throw new Error('Template not found');
        }

        return EmailTemplate.fromDatabaseRow(result.rows[0]);
    }

    // Template processing operations
    async validateTemplateVariables(templateId, variables = {}) {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        return template.validateVariableValues(variables);
    }

    async renderTemplate(templateId, variables = {}) {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        if (!template.canBeUsedForSending()) {
            throw new Error('Template is not approved for sending');
        }

        const variableValidation = template.validateVariableValues(variables);
        if (!variableValidation.isValid) {
            throw new Error(`Variable validation failed: ${variableValidation.errors.join(', ')}`);
        }

        return template.renderComplete(variables);
    }

    async renderTemplateByCode(templateCode, variables = {}) {
        const template = await this.getTemplateByCode(templateCode);
        if (!template) {
            throw new Error('Template not found');
        }

        if (!template.canBeUsedForSending()) {
            throw new Error('Template is not approved for sending');
        }

        const variableValidation = template.validateVariableValues(variables);
        if (!variableValidation.isValid) {
            throw new Error(`Variable validation failed: ${variableValidation.errors.join(', ')}`);
        }

        return template.renderComplete(variables);
    }

    async previewTemplate(templateId, variables = {}) {
        const template = await this.getTemplateById(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Allow preview even for non-approved templates
        return template.renderComplete(variables);
    }

    async previewTemplateByCode(templateCode, variables = {}) {
        const template = await this.getTemplateByCode(templateCode);
        if (!template) {
            throw new Error('Template not found');
        }

        // Allow preview even for non-approved templates
        return template.renderComplete(variables);
    }

    // Analytics and reporting
    async getTemplateCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, templateType, category } = filters;

        let query = 'SELECT COUNT(*) as count FROM email_templates WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        if (templateType) {
            paramCount++;
            query += ` AND template_type = $${paramCount}`;
            values.push(templateType);
        }

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(category);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }

    async getTemplateStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                template_type,
                status,
                COUNT(*) as count
            FROM email_templates 
            GROUP BY template_type, status
            ORDER BY template_type, status
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getTemplateUsageStats(templateId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                COUNT(*) as total_sent,
                COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
                COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked
            FROM email_records 
            WHERE template_id = $1
        `;

        const result = await pool.query(query, [templateId]);
        return result.rows[0];
    }

    // Search operations
    async searchTemplates(searchTerm, filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, templateType, category, limit = 50 } = filters;

        let query = `
            SELECT * FROM email_templates 
            WHERE (name ILIKE $1 OR category ILIKE $1)
        `;
        const values = [`%${searchTerm}%`];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        if (templateType) {
            paramCount++;
            query += ` AND template_type = $${paramCount}`;
            values.push(templateType);
        }

        if (category) {
            paramCount++;
            query += ` AND category = $${paramCount}`;
            values.push(category);
        }

        query += ` ORDER BY 
            CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
            name
            LIMIT $${paramCount + 1}
        `;
        values.push(limit);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailTemplate.fromDatabaseRow(row));
    }

    // Utility methods
    async getTemplateCategories() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT DISTINCT category 
            FROM email_templates 
            WHERE category IS NOT NULL AND category != ''
            ORDER BY category
        `;

        const result = await pool.query(query);
        return result.rows.map(row => row.category);
    }
}

module.exports = new EmailTemplateService();