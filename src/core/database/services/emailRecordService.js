const connection = require('../connection');
const EmailRecord = require('../models/EmailRecord');

class EmailRecordService {
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
    async createEmailRecord(emailData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const email = EmailRecord.create(emailData);

        const query = `
            INSERT INTO email_records (
                job_id, pipeline_id, recipient_id, email_address, subject,
                content_type, template_code, campaign_id, processed_html_content,
                processed_text_content, variables_used, cc_emails, bcc_emails,
                reply_to, tag_string, metadata, batch_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *
        `;

        const values = [
            email.jobId,
            email.pipelineId,
            email.recipientId,
            email.emailAddress,
            email.subject,
            email.contentType,
            emailData.template_code || null,
            emailData.campaign_id || null,
            emailData.processed_html_content || null,
            emailData.processed_text_content || null,
            emailData.variables_used || null,
            emailData.cc_emails || null,
            emailData.bcc_emails || null,
            emailData.reply_to || null,
            emailData.tag_string || null,
            emailData.metadata || null,
            emailData.batch_id || null
        ];

        try {
            const result = await pool.query(query, values);
            return EmailRecord.fromDatabaseRow(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    async bulkCreateEmailRecords(emailsData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const client = await pool.connect();
        const results = { created: 0, failed: 0, errors: [], emailIds: [] };

        try {
            await client.query('BEGIN');

            for (const emailData of emailsData) {
                try {
                    const email = EmailRecord.create(emailData);

                    const query = `
                        INSERT INTO email_records (
                            job_id, pipeline_id, recipient_id, email_address, subject,
                            content_type, template_code, campaign_id, processed_html_content,
                            processed_text_content, variables_used, cc_emails, bcc_emails,
                            reply_to, tag_string, metadata, batch_id
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                        RETURNING email_id
                    `;

                    const values = [
                        email.jobId,
                        email.pipelineId,
                        email.recipientId,
                        email.emailAddress,
                        email.subject,
                        email.contentType,
                        emailData.template_code || null,
                        emailData.campaign_id || null,
                        emailData.processed_html_content || null,
                        emailData.processed_text_content || null,
                        emailData.variables_used || null,
                        emailData.cc_emails || null,
                        emailData.bcc_emails || null,
                        emailData.reply_to || null,
                        emailData.tag_string || null,
                        emailData.metadata || null,
                        emailData.batch_id || null
                    ];

                    const result = await client.query(query, values);
                    results.created++;
                    results.emailIds.push(result.rows[0].email_id);
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        email: emailData.email_address,
                        error: error.message
                    });
                }
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // Read operations
    async getEmailRecordById(emailId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM email_records WHERE email_id = $1';
        const result = await pool.query(query, [emailId]);

        if (result.rows.length === 0) {
            return null;
        }

        return EmailRecord.fromDatabaseRow(result.rows[0]);
    }

    async getEmailsByRecipient(recipientId, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 50, offset = 0, campaignId } = options;

        let query = 'SELECT * FROM email_records WHERE recipient_id = $1';
        const values = [recipientId];
        let paramCount = 1;

        if (campaignId) {
            paramCount++;
            query += ` AND campaign_id = $${paramCount}`;
            values.push(campaignId);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailRecord.fromDatabaseRow(row));
    }

    async getEmailsByCampaign(campaignId, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 100, offset = 0, deliveryStatus } = options;

        let query = 'SELECT * FROM email_records WHERE campaign_id = $1';
        const values = [campaignId];
        let paramCount = 1;

        if (deliveryStatus) {
            paramCount++;
            query += ` AND delivery_status = $${paramCount}`;
            values.push(deliveryStatus);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailRecord.fromDatabaseRow(row));
    }

    async getEmailsByBatch(batchId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM email_records WHERE batch_id = $1 ORDER BY created_at ASC';
        const result = await pool.query(query, [batchId]);
        return result.rows.map(row => EmailRecord.fromDatabaseRow(row));
    }

    async getEmailsByTemplate(templateCode, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 100, offset = 0, startDate, endDate } = options;

        let query = 'SELECT * FROM email_records WHERE template_code = $1';
        const values = [templateCode];
        let paramCount = 1;

        if (startDate) {
            paramCount++;
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND created_at <= $${paramCount}`;
            values.push(endDate);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailRecord.fromDatabaseRow(row));
    }

    // Update operations
    async updateEmailRecord(emailId, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const allowedFields = [
            'delivery_status', 'postmark_message_id', 'sent_at', 'opened_at',
            'clicked_at', 'bounced_at', 'error_code', 'error_message',
            'postmark_response_data', 'submitted_at'
        ];

        const updateFields = [];
        const values = [];
        let paramCount = 0;

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                paramCount++;
                updateFields.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        paramCount++;
        values.push(emailId);

        const query = `
            UPDATE email_records 
            SET ${updateFields.join(', ')}
            WHERE email_id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Email record not found');
        }

        return EmailRecord.fromDatabaseRow(result.rows[0]);
    }

    async updatePostmarkResponse(emailId, postmarkResponse) {
        const updateData = {
            postmark_message_id: postmarkResponse.MessageID,
            error_code: postmarkResponse.ErrorCode || null,
            error_message: postmarkResponse.Message || null,
            postmark_response_data: postmarkResponse,
            submitted_at: new Date()
        };

        if (postmarkResponse.ErrorCode === 0) {
            updateData.delivery_status = 'sent';
            updateData.sent_at = new Date();
        } else {
            updateData.delivery_status = 'failed';
        }

        return await this.updateEmailRecord(emailId, updateData);
    }

    async markAsDelivered(emailId, timestamp = new Date()) {
        return await this.updateEmailRecord(emailId, {
            delivery_status: 'delivered',
            sent_at: timestamp
        });
    }

    async markAsOpened(emailId, timestamp = new Date()) {
        return await this.updateEmailRecord(emailId, {
            delivery_status: 'delivered',
            opened_at: timestamp
        });
    }

    async markAsClicked(emailId, timestamp = new Date()) {
        return await this.updateEmailRecord(emailId, {
            delivery_status: 'delivered',
            opened_at: timestamp,
            clicked_at: timestamp
        });
    }

    async markAsBounced(emailId, timestamp = new Date()) {
        return await this.updateEmailRecord(emailId, {
            delivery_status: 'bounced',
            bounced_at: timestamp
        });
    }

    // Analytics and reporting
    async getEmailMetrics(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { campaignId, templateCode, startDate, endDate, batchId } = filters;

        let query = `
            SELECT 
                COUNT(*) as total_emails,
                COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent,
                COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as delivered,
                COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened,
                COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked,
                COUNT(CASE WHEN bounced_at IS NOT NULL THEN 1 END) as bounced,
                COUNT(CASE WHEN delivery_status = 'failed' THEN 1 END) as failed
            FROM email_records 
            WHERE 1=1
        `;
        const values = [];
        let paramCount = 0;

        if (campaignId) {
            paramCount++;
            query += ` AND campaign_id = $${paramCount}`;
            values.push(campaignId);
        }

        if (templateCode) {
            paramCount++;
            query += ` AND template_code = $${paramCount}`;
            values.push(templateCode);
        }

        if (batchId) {
            paramCount++;
            query += ` AND batch_id = $${paramCount}`;
            values.push(batchId);
        }

        if (startDate) {
            paramCount++;
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND created_at <= $${paramCount}`;
            values.push(endDate);
        }

        const result = await pool.query(query, values);
        const metrics = result.rows[0];

        // Calculate rates
        const total = parseInt(metrics.total_emails);
        const sent = parseInt(metrics.sent);
        const delivered = parseInt(metrics.delivered);

        return {
            ...metrics,
            total_emails: total,
            sent: sent,
            delivered: delivered,
            opened: parseInt(metrics.opened),
            clicked: parseInt(metrics.clicked),
            bounced: parseInt(metrics.bounced),
            failed: parseInt(metrics.failed),
            send_rate: total > 0 ? ((sent / total) * 100).toFixed(2) : '0.00',
            delivery_rate: sent > 0 ? ((delivered / sent) * 100).toFixed(2) : '0.00',
            open_rate: delivered > 0 ? ((parseInt(metrics.opened) / delivered) * 100).toFixed(2) : '0.00',
            click_rate: delivered > 0 ? ((parseInt(metrics.clicked) / delivered) * 100).toFixed(2) : '0.00',
            bounce_rate: sent > 0 ? ((parseInt(metrics.bounced) / sent) * 100).toFixed(2) : '0.00'
        };
    }

    async getCampaignMetrics(campaignId) {
        return await this.getEmailMetrics({ campaignId });
    }

    async getBatchMetrics(batchId) {
        return await this.getEmailMetrics({ batchId });
    }

    async getDeliveryStatus(emailIds) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        if (!Array.isArray(emailIds) || emailIds.length === 0) {
            return [];
        }

        const placeholders = emailIds.map((_, index) => `$${index + 1}`).join(',');
        const query = `
            SELECT email_id, email_address, delivery_status, postmark_message_id, 
                   sent_at, opened_at, clicked_at, bounced_at, error_code, error_message
            FROM email_records 
            WHERE email_id IN (${placeholders})
            ORDER BY email_id
        `;

        const result = await pool.query(query, emailIds);
        return result.rows;
    }

    // Search operations
    async searchEmails(searchTerm, filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { campaignId, deliveryStatus, limit = 50 } = filters;

        let query = `
            SELECT * FROM email_records 
            WHERE (email_address ILIKE $1 OR subject ILIKE $1)
        `;
        const values = [`%${searchTerm}%`];
        let paramCount = 1;

        if (campaignId) {
            paramCount++;
            query += ` AND campaign_id = $${paramCount}`;
            values.push(campaignId);
        }

        if (deliveryStatus) {
            paramCount++;
            query += ` AND delivery_status = $${paramCount}`;
            values.push(deliveryStatus);
        }

        query += ` ORDER BY 
            CASE WHEN email_address ILIKE $1 THEN 1 ELSE 2 END,
            created_at DESC
            LIMIT $${paramCount + 1}
        `;
        values.push(limit);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailRecord.fromDatabaseRow(row));
    }

    // Cleanup operations
    async deleteOldEmailRecords(daysOld = 365) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const query = `
            DELETE FROM email_records 
            WHERE created_at < $1
            RETURNING email_id
        `;

        const result = await pool.query(query, [cutoffDate]);
        return {
            deletedCount: result.rows.length,
            cutoffDate: cutoffDate.toISOString()
        };
    }

    // Utility methods
    async getEmailCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { campaignId, templateCode, deliveryStatus, startDate, endDate } = filters;

        let query = 'SELECT COUNT(*) as count FROM email_records WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (campaignId) {
            paramCount++;
            query += ` AND campaign_id = $${paramCount}`;
            values.push(campaignId);
        }

        if (templateCode) {
            paramCount++;
            query += ` AND template_code = $${paramCount}`;
            values.push(templateCode);
        }

        if (deliveryStatus) {
            paramCount++;
            query += ` AND delivery_status = $${paramCount}`;
            values.push(deliveryStatus);
        }

        if (startDate) {
            paramCount++;
            query += ` AND created_at >= $${paramCount}`;
            values.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND created_at <= $${paramCount}`;
            values.push(endDate);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }
}

module.exports = new EmailRecordService();