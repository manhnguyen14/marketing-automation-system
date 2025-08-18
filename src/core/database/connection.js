const { Pool } = require('pg');
const config = require('../../config');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            const connectionConfig = {
                connectionString: config.database.url,
                ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
                min: config.database.poolMin,
                max: config.database.poolMax,
                acquireTimeoutMillis: config.database.acquireTimeout,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 10000
            };

            this.pool = new Pool(connectionConfig);

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.isConnected = true;
            console.log('✅ Database connected successfully');

            return this.pool;
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            this.isConnected = false;
            // Don't throw error - let app continue running
            return null;
        }
    }

    async testConnection() {
        if (!this.pool) {
            return { connected: false, error: 'Database not initialized' };
        }

        try {
            const start = Date.now();
            await this.pool.query('SELECT 1');
            const responseTime = Date.now() - start;

            return {
                connected: true,
                responseTime: `${responseTime}ms`,
                poolStatus: {
                    total: this.pool.totalCount,
                    idle: this.pool.idleCount,
                    waiting: this.pool.waitingCount
                }
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message
            };
        }
    }

    getPool() {
        return this.pool;
    }

    isReady() {
        return this.isConnected && this.pool;
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            console.log('Database connection closed');
        }
    }
}

module.exports = new DatabaseConnection();