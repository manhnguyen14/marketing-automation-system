const connection = require('../connection');
const ReadingActivity = require('../models/ReadingActivity');

class ActivityService {
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
    async createActivity(activityData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const activity = ReadingActivity.create(activityData);

        const query = `
      INSERT INTO reading_activities (customer_id, book_id, activity_type, progress_percentage)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

        const values = [
            activity.customerId,
            activity.bookId,
            activity.activityType,
            activity.progressPercentage
        ];

        const result = await pool.query(query, values);
        return ReadingActivity.fromDatabaseRow(result.rows[0]);
    }

    async bulkCreateActivities(activitiesData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const client = await pool.connect();
        const results = { created: 0, failed: 0, errors: [] };

        try {
            await client.query('BEGIN');

            for (const activityData of activitiesData) {
                try {
                    const activity = ReadingActivity.create(activityData);

                    const query = `
            INSERT INTO reading_activities (customer_id, book_id, activity_type, progress_percentage)
            VALUES ($1, $2, $3, $4)
            RETURNING activity_id
          `;

                    const values = [
                        activity.customerId,
                        activity.bookId,
                        activity.activityType,
                        activity.progressPercentage
                    ];

                    await client.query(query, values);
                    results.created++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        customer_id: activityData.customer_id,
                        book_id: activityData.book_id,
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
    async getActivityById(activityId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM reading_activities WHERE activity_id = $1';
        const result = await pool.query(query, [activityId]);

        if (result.rows.length === 0) {
            return null;
        }

        return ReadingActivity.fromDatabaseRow(result.rows[0]);
    }

    async getActivitiesByCustomer(customerId, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 50, offset = 0, activityType, bookId } = options;

        let query = 'SELECT * FROM reading_activities WHERE customer_id = $1';
        const values = [customerId];
        let paramCount = 1;

        if (activityType) {
            paramCount++;
            query += ` AND activity_type = ${paramCount}`;
            values.push(activityType);
        }

        if (bookId) {
            paramCount++;
            query += ` AND book_id = ${paramCount}`;
            values.push(bookId);
        }

        query += ` ORDER BY activity_date DESC LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    async getActivitiesByBook(bookId, options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 50, offset = 0, activityType } = options;

        let query = 'SELECT * FROM reading_activities WHERE book_id = $1';
        const values = [bookId];
        let paramCount = 1;

        if (activityType) {
            paramCount++;
            query += ` AND activity_type = ${paramCount}`;
            values.push(activityType);
        }

        query += ` ORDER BY activity_date DESC LIMIT ${paramCount + 1} OFFSET ${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    async getRecentActivities(daysAgo = 7, limit = 100) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM reading_activities 
      WHERE activity_date > NOW() - INTERVAL '$1 days'
      ORDER BY activity_date DESC
      LIMIT $2
    `;

        const result = await pool.query(query, [daysAgo, limit]);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    // Customer reading patterns
    async getCustomerReadingProgress(customerId, bookId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM reading_activities 
      WHERE customer_id = $1 AND book_id = $2
      ORDER BY activity_date DESC
      LIMIT 1
    `;

        const result = await pool.query(query, [customerId, bookId]);

        if (result.rows.length === 0) {
            return null;
        }

        return ReadingActivity.fromDatabaseRow(result.rows[0]);
    }

    async getCustomersWithStagnantReading(daysAgo = 14) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT DISTINCT customer_id, book_id, progress_percentage
      FROM reading_activities ra1
      WHERE activity_type IN ('book_started', 'chapter_read')
      AND progress_percentage < 100
      AND activity_date < NOW() - INTERVAL '$1 days'
      AND NOT EXISTS (
        SELECT 1 FROM reading_activities ra2
        WHERE ra2.customer_id = ra1.customer_id
        AND ra2.book_id = ra1.book_id
        AND ra2.activity_date > ra1.activity_date
      )
      ORDER BY progress_percentage DESC
    `;

        const result = await pool.query(query, [daysAgo]);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    async getCompletedBooks(customerId, limit = 50) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM reading_activities 
      WHERE customer_id = $1 
      AND activity_type = 'book_completed'
      ORDER BY activity_date DESC
      LIMIT $2
    `;

        const result = await pool.query(query, [customerId, limit]);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    async getCurrentlyReading(customerId, limit = 10) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT DISTINCT ON (book_id) *
      FROM reading_activities 
      WHERE customer_id = $1 
      AND activity_type IN ('book_started', 'chapter_read')
      AND progress_percentage < 100
      ORDER BY book_id, activity_date DESC
      LIMIT $2
    `;

        const result = await pool.query(query, [customerId, limit]);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    // Update operations
    async updateActivity(activityId, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const activity = await this.getActivityById(activityId);
        if (!activity) {
            throw new Error('Activity not found');
        }

        activity.update(updateData);

        const query = `
      UPDATE reading_activities 
      SET activity_type = $1, progress_percentage = $2
      WHERE activity_id = $3
      RETURNING *
    `;

        const values = [
            activity.activityType,
            activity.progressPercentage,
            activityId
        ];

        const result = await pool.query(query, values);
        return ReadingActivity.fromDatabaseRow(result.rows[0]);
    }

    // Delete operations
    async deleteActivity(activityId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'DELETE FROM reading_activities WHERE activity_id = $1 RETURNING *';
        const result = await pool.query(query, [activityId]);

        if (result.rows.length === 0) {
            throw new Error('Activity not found');
        }

        return ReadingActivity.fromDatabaseRow(result.rows[0]);
    }

    // Analytics and reporting
    async getActivityCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { customerId, bookId, activityType, daysAgo } = filters;

        let query = 'SELECT COUNT(*) as count FROM reading_activities';
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (customerId) {
            paramCount++;
            conditions.push(`customer_id = ${paramCount}`);
            values.push(customerId);
        }

        if (bookId) {
            paramCount++;
            conditions.push(`book_id = ${paramCount}`);
            values.push(bookId);
        }

        if (activityType) {
            paramCount++;
            conditions.push(`activity_type = ${paramCount}`);
            values.push(activityType);
        }

        if (daysAgo) {
            paramCount++;
            conditions.push(`activity_date > NOW() - INTERVAL '${paramCount} days'`);
            values.push(daysAgo);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }

    async getActivityTypeStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT activity_type, COUNT(*) as activity_count
      FROM reading_activities 
      GROUP BY activity_type
      ORDER BY activity_count DESC
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getMostActiveCustomers(limit = 10, daysAgo = 30) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT customer_id, COUNT(*) as activity_count
      FROM reading_activities 
      WHERE activity_date > NOW() - INTERVAL '$1 days'
      GROUP BY customer_id
      ORDER BY activity_count DESC
      LIMIT $2
    `;

        const result = await pool.query(query, [daysAgo, limit]);
        return result.rows;
    }

    async getMostReadBooks(limit = 10, daysAgo = 30) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT book_id, COUNT(DISTINCT customer_id) as reader_count
      FROM reading_activities 
      WHERE activity_date > NOW() - INTERVAL '$1 days'
      GROUP BY book_id
      ORDER BY reader_count DESC
      LIMIT $2
    `;

        const result = await pool.query(query, [daysAgo, limit]);
        return result.rows;
    }

    async getCompletionRateByBook(bookId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT 
        COUNT(DISTINCT customer_id) as total_readers,
        COUNT(DISTINCT CASE WHEN activity_type = 'book_completed' THEN customer_id END) as completed_readers
      FROM reading_activities 
      WHERE book_id = $1
    `;

        const result = await pool.query(query, [bookId]);
        const row = result.rows[0];

        const totalReaders = parseInt(row.total_readers);
        const completedReaders = parseInt(row.completed_readers);

        return {
            totalReaders,
            completedReaders,
            completionRate: totalReaders > 0 ? (completedReaders / totalReaders) * 100 : 0
        };
    }

    // Advanced queries for marketing automation
    async getCustomersForEngagement(criteria) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const {
            activityTypes = ['chapter_read'],
            daysAgoMin = 1,
            daysAgoMax = 7,
            minProgress = 0,
            maxProgress = 100,
            limit = 100
        } = criteria;

        const query = `
      SELECT DISTINCT customer_id, book_id, progress_percentage, activity_date
      FROM reading_activities 
      WHERE activity_type = ANY($1)
      AND activity_date BETWEEN NOW() - INTERVAL '$2 days' AND NOW() - INTERVAL '$3 days'
      AND progress_percentage BETWEEN $4 AND $5
      ORDER BY activity_date DESC
      LIMIT $6
    `;

        const values = [activityTypes, daysAgoMax, daysAgoMin, minProgress, maxProgress, limit];
        const result = await pool.query(query, values);
        return result.rows.map(row => ReadingActivity.fromDatabaseRow(row));
    }

    async getAbandonedBooks(daysAgo = 30, minProgress = 10) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT customer_id, book_id, MAX(progress_percentage) as last_progress, MAX(activity_date) as last_activity
      FROM reading_activities 
      WHERE activity_type IN ('book_started', 'chapter_read')
      AND activity_date < NOW() - INTERVAL '$1 days'
      GROUP BY customer_id, book_id
      HAVING MAX(progress_percentage) >= $2 AND MAX(progress_percentage) < 100
      AND NOT EXISTS (
        SELECT 1 FROM reading_activities ra2
        WHERE ra2.customer_id = reading_activities.customer_id
        AND ra2.book_id = reading_activities.book_id
        AND ra2.activity_type = 'book_completed'
      )
      ORDER BY last_activity DESC
    `;

        const result = await pool.query(query, [daysAgo, minProgress]);
        return result.rows;
    }
}

module.exports = new ActivityService();