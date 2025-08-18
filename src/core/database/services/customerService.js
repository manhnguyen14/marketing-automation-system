const connection = require('../connection');
const Customer = require('../models/Customer');

class CustomerService {
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
    async createCustomer(customerData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const customer = Customer.create(customerData);

        const query = `
      INSERT INTO customers (email, name, company, status, topics_of_interest)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [
            customer.email,
            customer.name,
            customer.company,
            customer.status,
            customer.topicsOfInterest
        ];

        try {
            const result = await pool.query(query, values);
            return Customer.fromDatabaseRow(result.rows[0]);
        } catch (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('Customer with this email already exists');
            }
            throw error;
        }
    }

    async bulkCreateCustomers(customersData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const client = await pool.connect();
        const results = { created: 0, failed: 0, errors: [] };

        try {
            await client.query('BEGIN');

            for (const customerData of customersData) {
                try {
                    const customer = Customer.create(customerData);

                    const query = `
            INSERT INTO customers (email, name, company, status, topics_of_interest)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING customer_id
          `;

                    const values = [
                        customer.email,
                        customer.name,
                        customer.company,
                        customer.status,
                        customer.topicsOfInterest
                    ];

                    await client.query(query, values);
                    results.created++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        email: customerData.email,
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
    async getCustomerById(customerId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM customers WHERE customer_id = $1';
        const result = await pool.query(query, [customerId]);

        if (result.rows.length === 0) {
            return null;
        }

        return Customer.fromDatabaseRow(result.rows[0]);
    }

    async getCustomerByEmail(email) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM customers WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return null;
        }

        return Customer.fromDatabaseRow(result.rows[0]);
    }

    async getAllCustomers(options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 50, offset = 0, status, company } = options;

        let query = 'SELECT * FROM customers';
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (company) {
            paramCount++;
            conditions.push(`company ILIKE $${paramCount}`);
            values.push(`%${company}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => Customer.fromDatabaseRow(row));
    }

    async getActiveCustomers(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { topics, company, limit = 100, offset = 0 } = filters;

        let query = `SELECT * FROM customers WHERE status = 'active'`;
        const values = [];
        let paramCount = 0;

        if (topics && topics.length > 0) {
            paramCount++;
            query += ` AND topics_of_interest && $${paramCount}`;
            values.push(topics);
        }

        if (company) {
            paramCount++;
            query += ` AND company ILIKE $${paramCount}`;
            values.push(`%${company}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => Customer.fromDatabaseRow(row));
    }

    async getCustomersByTopics(topics) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM customers 
      WHERE status = 'active' 
      AND topics_of_interest && $1
      ORDER BY created_at DESC
    `;

        const result = await pool.query(query, [topics]);
        return result.rows.map(row => Customer.fromDatabaseRow(row));
    }

    async getCustomersForTargeting(criteria) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const {
            topics,
            companies,
            excludeRecentEmails = true,
            emailDaysAgo = 7,
            limit = 1000
        } = criteria;

        let query = `
      SELECT DISTINCT c.* FROM customers c
      WHERE c.status = 'active'
    `;

        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (topics && topics.length > 0) {
            paramCount++;
            conditions.push(`c.topics_of_interest && $${paramCount}`);
            values.push(topics);
        }

        if (companies && companies.length > 0) {
            paramCount++;
            conditions.push(`c.company = ANY($${paramCount})`);
            values.push(companies);
        }

        if (excludeRecentEmails) {
            paramCount++;
            conditions.push(`
        NOT EXISTS (
          SELECT 1 FROM email_records er 
          WHERE er.recipient_id = c.customer_id 
          AND er.sent_at > NOW() - INTERVAL '$${paramCount} days'
        )
      `);
            values.push(emailDaysAgo);
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1}`;
        values.push(limit);

        const result = await pool.query(query, values);
        return result.rows.map(row => Customer.fromDatabaseRow(row));
    }

    // Update operations
    async updateCustomer(customerId, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const customer = await this.getCustomerById(customerId);
        if (!customer) {
            throw new Error('Customer not found');
        }

        customer.update(updateData);

        const query = `
      UPDATE customers 
      SET name = $1, company = $2, status = $3, topics_of_interest = $4, updated_at = NOW()
      WHERE customer_id = $5
      RETURNING *
    `;

        const values = [
            customer.name,
            customer.company,
            customer.status,
            customer.topicsOfInterest,
            customerId
        ];

        const result = await pool.query(query, values);
        return Customer.fromDatabaseRow(result.rows[0]);
    }

    async updateCustomerStatus(customerId, status) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      UPDATE customers 
      SET status = $1, updated_at = NOW()
      WHERE customer_id = $2
      RETURNING *
    `;

        const result = await pool.query(query, [status, customerId]);

        if (result.rows.length === 0) {
            throw new Error('Customer not found');
        }

        return Customer.fromDatabaseRow(result.rows[0]);
    }

    // Delete operations
    async deleteCustomer(customerId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'DELETE FROM customers WHERE customer_id = $1 RETURNING *';
        const result = await pool.query(query, [customerId]);

        if (result.rows.length === 0) {
            throw new Error('Customer not found');
        }

        return Customer.fromDatabaseRow(result.rows[0]);
    }

    // Analytics and reporting
    async getCustomerCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, company } = filters;

        let query = 'SELECT COUNT(*) as count FROM customers';
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (company) {
            paramCount++;
            conditions.push(`company ILIKE $${paramCount}`);
            values.push(`%${company}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }

    async getCustomersByCompany() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT company, COUNT(*) as customer_count
      FROM customers 
      WHERE company IS NOT NULL AND company != ''
      GROUP BY company
      ORDER BY customer_count DESC
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getCustomersByStatus() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT status, COUNT(*) as customer_count
      FROM customers 
      GROUP BY status
      ORDER BY customer_count DESC
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    // Search operations
    async searchCustomers(searchTerm, limit = 50) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM customers 
      WHERE name ILIKE $1 
      OR email ILIKE $1 
      OR company ILIKE $1
      ORDER BY 
        CASE WHEN email ILIKE $1 THEN 1 ELSE 2 END,
        name
      LIMIT $2
    `;

        const searchPattern = `%${searchTerm}%`;
        const result = await pool.query(query, [searchPattern, limit]);
        return result.rows.map(row => Customer.fromDatabaseRow(row));
    }
}

module.exports = new CustomerService();