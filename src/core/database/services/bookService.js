const connection = require('../connection');
const Book = require('../models/Book');

class BookService {
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
    async createBook(bookData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const book = Book.create(bookData);

        const query = `
      INSERT INTO books (title, author, genre, topics, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const values = [
            book.title,
            book.author,
            book.genre,
            book.topics,
            book.status
        ];

        const result = await pool.query(query, values);
        return Book.fromDatabaseRow(result.rows[0]);
    }

    async bulkCreateBooks(booksData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const client = await pool.connect();
        const results = { created: 0, failed: 0, errors: [] };

        try {
            await client.query('BEGIN');

            for (const bookData of booksData) {
                try {
                    const book = Book.create(bookData);

                    const query = `
            INSERT INTO books (title, author, genre, topics, status)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING book_id
          `;

                    const values = [
                        book.title,
                        book.author,
                        book.genre,
                        book.topics,
                        book.status
                    ];

                    await client.query(query, values);
                    results.created++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        title: bookData.title,
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
    async getBookById(bookId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'SELECT * FROM books WHERE book_id = $1';
        const result = await pool.query(query, [bookId]);

        if (result.rows.length === 0) {
            return null;
        }

        return Book.fromDatabaseRow(result.rows[0]);
    }

    async getAllBooks(options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { limit = 50, offset = 0, status, genre, author } = options;

        let query = 'SELECT * FROM books';
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (genre) {
            paramCount++;
            conditions.push(`genre ILIKE $${paramCount}`);
            values.push(`%${genre}%`);
        }

        if (author) {
            paramCount++;
            conditions.push(`author ILIKE $${paramCount}`);
            values.push(`%${author}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    async getPublishedBooks(options = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { topics, genre, limit = 100, offset = 0 } = options;

        let query = `SELECT * FROM books WHERE status = 'published'`;
        const values = [];
        let paramCount = 0;

        if (topics && topics.length > 0) {
            paramCount++;
            query += ` AND topics && $${paramCount}`;
            values.push(topics);
        }

        if (genre) {
            paramCount++;
            query += ` AND genre ILIKE $${paramCount}`;
            values.push(`%${genre}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    async getBooksByTopics(topics) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM books 
      WHERE status = 'published' 
      AND topics && $1
      ORDER BY created_at DESC
    `;

        const result = await pool.query(query, [topics]);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    async getBooksByGenre(genre) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM books 
      WHERE status = 'published' 
      AND genre ILIKE $1
      ORDER BY created_at DESC
    `;

        const result = await pool.query(query, [`%${genre}%`]);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    async getBooksByAuthor(author) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM books 
      WHERE author ILIKE $1
      ORDER BY created_at DESC
    `;

        const result = await pool.query(query, [`%${author}%`]);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    // Update operations
    async updateBook(bookId, updateData) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const book = await this.getBookById(bookId);
        if (!book) {
            throw new Error('Book not found');
        }

        book.update(updateData);

        const query = `
      UPDATE books 
      SET title = $1, author = $2, genre = $3, topics = $4, status = $5
      WHERE book_id = $6
      RETURNING *
    `;

        const values = [
            book.title,
            book.author,
            book.genre,
            book.topics,
            book.status,
            bookId
        ];

        const result = await pool.query(query, values);
        return Book.fromDatabaseRow(result.rows[0]);
    }

    async updateBookStatus(bookId, status) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      UPDATE books 
      SET status = $1
      WHERE book_id = $2
      RETURNING *
    `;

        const result = await pool.query(query, [status, bookId]);

        if (result.rows.length === 0) {
            throw new Error('Book not found');
        }

        return Book.fromDatabaseRow(result.rows[0]);
    }

    // Delete operations
    async deleteBook(bookId) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = 'DELETE FROM books WHERE book_id = $1 RETURNING *';
        const result = await pool.query(query, [bookId]);

        if (result.rows.length === 0) {
            throw new Error('Book not found');
        }

        return Book.fromDatabaseRow(result.rows[0]);
    }

    // Analytics and reporting
    async getBookCount(filters = {}) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const { status, genre } = filters;

        let query = 'SELECT COUNT(*) as count FROM books';
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(status);
        }

        if (genre) {
            paramCount++;
            conditions.push(`genre ILIKE $${paramCount}`);
            values.push(`%${genre}%`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count);
    }

    async getBooksByGenreStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT genre, COUNT(*) as book_count
      FROM books 
      WHERE genre IS NOT NULL AND genre != ''
      GROUP BY genre
      ORDER BY book_count DESC
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getBooksByStatusStats() {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT status, COUNT(*) as book_count
      FROM books 
      GROUP BY status
      ORDER BY book_count DESC
    `;

        const result = await pool.query(query);
        return result.rows;
    }

    async getTopAuthors(limit = 10) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT author, COUNT(*) as book_count
      FROM books 
      WHERE author IS NOT NULL AND author != ''
      GROUP BY author
      ORDER BY book_count DESC
      LIMIT $1
    `;

        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    // Search operations
    async searchBooks(searchTerm, limit = 50) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM books 
      WHERE title ILIKE $1 
      OR author ILIKE $1 
      OR genre ILIKE $1
      ORDER BY 
        CASE 
          WHEN title ILIKE $1 THEN 1
          WHEN author ILIKE $1 THEN 2
          ELSE 3
        END,
        title
      LIMIT $2
    `;

        const searchPattern = `%${searchTerm}%`;
        const result = await pool.query(query, [searchPattern, limit]);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    // Recent and featured books
    async getRecentBooks(limit = 10) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        const query = `
      SELECT * FROM books 
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT $1
    `;

        const result = await pool.query(query, [limit]);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }

    async getBooksForRecommendation(customerTopics, excludeBookIds = [], limit = 5) {
        const pool = this.getPool();
        if (!pool) throw new Error('Database not available');

        let query = `
      SELECT * FROM books 
      WHERE status = 'published'
      AND topics && $1
    `;

        const values = [customerTopics];
        let paramCount = 1;

        if (excludeBookIds.length > 0) {
            paramCount++;
            query += ` AND book_id != ALL($${paramCount})`;
            values.push(excludeBookIds);
        }

        query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
        values.push(limit);

        const result = await pool.query(query, values);
        return result.rows.map(row => Book.fromDatabaseRow(row));
    }
}

module.exports = new BookService();