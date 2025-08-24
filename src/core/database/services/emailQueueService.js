const connection = require('../connection');
const EmailQueueItem = require('../models/EmailQueueItem');

class EmailQueueService {
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
    async createQueueItem(queueData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const item = EmailQueueItem.create(queueData);

        const query = `
            INSERT INTO email_queue_items (
                customer_id, pipeline_name, status, template_code, scheduled_date,
                context_data, variables, tag, retry_count, last_error
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            item.customerId,
            item.pipelineName,
            item.status,
            item.templateCode,
            item.scheduledDate,
            item.contextData,
            item.variables,
            item.tag,
            item.retryCount,
            item.lastError
        ];

        const result = await pool.query(query, values);
        return EmailQueueItem.fromDatabaseRow(result.rows[0]);
    }

    async bulkCreateQueueItems(queueItems) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const client = await pool.connect();
        const results = { created: 0, failed: 0, errors: [], ids: [] };

        try {
            await client.query('BEGIN');

            for (const queueData of queueItems) {
                try {
                    const item = EmailQueueItem.create(queueData);

                    const query = `
                        INSERT INTO email_queue_items (
                            customer_id, pipeline_name, status, template_code, scheduled_date,
                            context_data, variables, tag, retry_count, last_error
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        RETURNING id
                    `;

                    const values = [
                        item.customerId, item.pipelineName, item.status, item.templateCode,
                        item.scheduledDate, item.contextData, item.variables, item.tag,
                        item.retryCount, item.lastError
                    ];

                    const result = await client.query(query, values);
                    results.created++;
                    results.ids.push(result.rows[0].id);
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        customer_id: queueData.customer_id,
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
    async getQueueItemById(id) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM email_queue_items WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return EmailQueueItem.fromDatabaseRow(result.rows[0]);
    }

    async getQueueItemsByStatus(status, limit = 50) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT * FROM email_queue_items 
            WHERE status = $1 
            ORDER BY created_at ASC 
            LIMIT $2
        `;

        const result = await pool.query(query, [status, limit]);
        return result.rows.map(row => EmailQueueItem.fromDatabaseRow(row));
    }

    async getScheduledItems(currentTime = new Date(), limit = 100) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT * FROM email_queue_items 
            WHERE status = 'SCHEDULED' 
            AND scheduled_date <= $1
            ORDER BY scheduled_date ASC 
            LIMIT $2
        `;

        const result = await pool.query(query, [currentTime, limit]);
        return result.rows.map(row => EmailQueueItem.fromDatabaseRow(row));
    }

    async getQueueItemsByPipeline(pipelineName, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, limit = 100, offset = 0 } = options;

        let query = 'SELECT * FROM email_queue_items WHERE pipeline_name = $1';
        const values = [pipelineName];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => EmailQueueItem.fromDatabaseRow(row));
    }

    // Update operations
    async updateQueueItem(id, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const allowedFields = [
            'status', 'template_code', 'scheduled_date', 'context_data',
            'variables', 'tag', 'retry_count', 'last_error'
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

        // Add updated_at
        paramCount++;
        updateFields.push(`updated_at = $${paramCount}`);
        values.push(new Date());

        // Add ID parameter
        paramCount++;
        values.push(id);

        const query = `
            UPDATE email_queue_items 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Queue item not found');
        }

        return EmailQueueItem.fromDatabaseRow(result.rows[0]);
    }

    async updateStatus(id, newStatus) {
        return await this.updateQueueItem(id, { status: newStatus });
    }

    async markTemplateGenerated(id, templateCode) {
        return await this.updateQueueItem(id, {
            template_code: templateCode,
            status: 'PENDING_REVIEW'
        });
    }

    async markApproved(id, scheduledDate = new Date()) {
        return await this.updateQueueItem(id, {
            status: 'SCHEDULED',
            scheduled_date: scheduledDate
        });
    }

    async markSent(id) {
        return await this.updateQueueItem(id, { status: 'SENT' });
    }

    async markFailed(id, errorMessage, status = 'FAILED_SEND') {
        const item = await this.getQueueItemById(id);
        if (!item) throw new Error('Queue item not found');

        return await this.updateQueueItem(id, {
            status: status,
            last_error: errorMessage,
            retry_count: item.retryCount + 1
        });
    }

    // Analytics operations
    async getQueueStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM email_queue_items 
            GROUP BY status
            ORDER BY status
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getPipelineStats(pipelineName) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                status,
                COUNT(*) as count
            FROM email_queue_items 
            WHERE pipeline_name = $1
            GROUP BY status
            ORDER BY status
        `;

        const result = await pool.query(query, [pipelineName]);
        return result.rows;
    }

    async getQueueCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, pipelineName } = filters;

        let query = 'SELECT COUNT(*) as count FROM email_queue_items WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            values.push(status);
        }

        if (pipelineName) {
            paramCount++;
            query += ` AND pipeline_name = $${paramCount}`;
            values.push(pipelineName);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }

    // Cleanup operations
    async deleteOldQueueItems(daysOld = 30) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const query = `
            DELETE FROM email_queue_items 
            WHERE status = 'SENT' 
            AND updated_at < $1
            RETURNING id
        `;

        const result = await pool.query(query, [cutoffDate]);
        return {
            deletedCount: result.rows.length,
            cutoffDate: cutoffDate.toISOString()
        };
    }
}

module.exports = new EmailQueueService();