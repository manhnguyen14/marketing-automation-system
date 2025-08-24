const connection = require('../connection');
const PipelineExecutionLog = require('../models/PipelineExecutionLog');

class PipelineExecutionService {
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
    async createExecutionLog(logData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const log = PipelineExecutionLog.create(logData);

        const query = `
            INSERT INTO pipeline_execution_log (
                pipeline_name, execution_step, status, queue_items_created,
                execution_data, error_message, execution_time_ms
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const values = [
            log.pipelineName,
            log.executionStep,
            log.status,
            log.queueItemsCreated,
            log.executionData,
            log.errorMessage,
            log.executionTimeMs
        ];

        const result = await pool.query(query, values);
        return PipelineExecutionLog.fromDatabaseRow(result.rows[0]);
    }

    async startExecution(pipelineName, executionStep = 'CREATE_QUEUE_ITEMS') {
        const logData = {
            pipeline_name: pipelineName,
            execution_step: executionStep,
            status: 'IN_PROGRESS',
            execution_data: { startTime: new Date().toISOString() }
        };

        return await this.createExecutionLog(logData);
    }

    // Read operations
    async getExecutionById(id) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM pipeline_execution_log WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return PipelineExecutionLog.fromDatabaseRow(result.rows[0]);
    }

    async getExecutionsByPipeline(pipelineName, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, limit = 50, offset = 0 } = options;

        let query = 'SELECT * FROM pipeline_execution_log WHERE pipeline_name = $1';
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
        return result.rows.map(row => PipelineExecutionLog.fromDatabaseRow(row));
    }

    async getRecentExecutions(limit = 20) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT * FROM pipeline_execution_log 
            ORDER BY created_at DESC 
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        return result.rows.map(row => PipelineExecutionLog.fromDatabaseRow(row));
    }

    async getLastExecution(pipelineName) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT * FROM pipeline_execution_log 
            WHERE pipeline_name = $1 
            ORDER BY created_at DESC 
            LIMIT 1
        `;

        const result = await pool.query(query, [pipelineName]);

        if (result.rows.length === 0) {
            return null;
        }

        return PipelineExecutionLog.fromDatabaseRow(result.rows[0]);
    }

    // Update operations
    async updateExecution(id, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const allowedFields = [
            'execution_step', 'status', 'queue_items_created',
            'execution_data', 'error_message', 'execution_time_ms'
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
        values.push(id);

        const query = `
            UPDATE pipeline_execution_log 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            throw new Error('Execution log not found');
        }

        return PipelineExecutionLog.fromDatabaseRow(result.rows[0]);
    }

    async completeExecution(id, success = true, queueItemsCreated = 0, errorMessage = null) {
        const execution = await this.getExecutionById(id);
        if (!execution) throw new Error('Execution log not found');

        // Calculate execution time
        const startTime = execution.executionData?.startTime ?
            new Date(execution.executionData.startTime) :
            new Date(execution.createdAt);
        const executionTimeMs = Date.now() - startTime.getTime();

        const updateData = {
            status: success ? 'SUCCESS' : 'FAILED',
            queue_items_created: queueItemsCreated,
            execution_time_ms: executionTimeMs,
            execution_data: {
                ...execution.executionData,
                endTime: new Date().toISOString(),
                completed: true
            }
        };

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        return await this.updateExecution(id, updateData);
    }

    async markSuccess(id, queueItemsCreated = 0) {
        return await this.completeExecution(id, true, queueItemsCreated);
    }

    async markFailed(id, errorMessage) {
        return await this.completeExecution(id, false, 0, errorMessage);
    }

    // Analytics operations
    async getExecutionStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                pipeline_name,
                status,
                COUNT(*) as count,
                AVG(execution_time_ms) as avg_time_ms,
                SUM(queue_items_created) as total_queue_items
            FROM pipeline_execution_log 
            GROUP BY pipeline_name, status
            ORDER BY pipeline_name, status
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getPipelinePerformance(pipelineName) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
            SELECT 
                COUNT(*) as total_executions,
                COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as successful_executions,
                COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_executions,
                AVG(execution_time_ms) as avg_execution_time_ms,
                SUM(queue_items_created) as total_queue_items_created,
                MAX(created_at) as last_execution
            FROM pipeline_execution_log 
            WHERE pipeline_name = $1
        `;

        const result = await pool.query(query, [pipelineName]);
        const stats = result.rows[0];

        return {
            pipelineName,
            totalExecutions: parseInt(stats.total_executions),
            successfulExecutions: parseInt(stats.successful_executions),
            failedExecutions: parseInt(stats.failed_executions),
            successRate: stats.total_executions > 0 ?
                ((stats.successful_executions / stats.total_executions) * 100).toFixed(2) : '0.00',
            avgExecutionTimeMs: stats.avg_execution_time_ms ?
                Math.round(parseFloat(stats.avg_execution_time_ms)) : null,
            avgExecutionTimeSeconds: stats.avg_execution_time_ms ?
                (parseFloat(stats.avg_execution_time_ms) / 1000).toFixed(2) : null,
            totalQueueItemsCreated: parseInt(stats.total_queue_items_created) || 0,
            lastExecution: stats.last_execution
        };
    }

    // Cleanup operations
    async deleteOldExecutions(daysOld = 90) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const query = `
            DELETE FROM pipeline_execution_log 
            WHERE created_at < $1
            RETURNING id
        `;

        const result = await pool.query(query, [cutoffDate]);
        return {
            deletedCount: result.rows.length,
            cutoffDate: cutoffDate.toISOString()
        };
    }
}

module.exports = new PipelineExecutionService();