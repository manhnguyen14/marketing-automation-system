# Database Modification Guidelines

## Overview

This guide covers how to safely modify the database schema in the Marketing Automation System. Always follow the migration-first approach to ensure consistency across environments.

---

## 1. Adding Fields to Existing Tables

### Example: Adding `summary` field to `books` table

#### Step 1: Create Migration File
Create a new migration file with the next sequential number:

**File:** `src/core/database/migrations/006_add_summary_to_books.sql`

```sql
-- Add summary field to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add index if the field will be searched
CREATE INDEX IF NOT EXISTS idx_books_summary ON books USING GIN(to_tsvector('english', summary));

-- Add comment for documentation
COMMENT ON COLUMN books.summary IS 'Book summary/description for marketing and recommendations';
```

#### Step 2: Update Book Model
**File:** `src/core/database/models/Book.js`

```javascript
class Book {
  constructor(data = {}) {
    this.bookId = data.book_id || null;
    this.title = data.title || '';
    this.author = data.author || '';
    this.genre = data.genre || '';
    this.topics = data.topics || [];
    this.summary = data.summary || '';  // ✅ ADD THIS LINE
    this.status = data.status || 'published';
    this.createdAt = data.created_at || null;
  }

  // Update validation if needed
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!this.author || this.author.trim().length === 0) {
      errors.push('Author is required');
    }

    // ✅ ADD SUMMARY VALIDATION IF NEEDED
    if (this.summary && this.summary.length > 5000) {
      errors.push('Summary must be less than 5000 characters');
    }

    if (!['draft', 'published', 'archived'].includes(this.status)) {
      errors.push('Status must be draft, published, or archived');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update data transformation methods
  toDatabaseFormat() {
    return {
      book_id: this.bookId,
      title: this.title,
      author: this.author,
      genre: this.genre,
      topics: this.topics,
      summary: this.summary,  // ✅ ADD THIS LINE
      status: this.status,
      created_at: this.createdAt
    };
  }

  toJSON() {
    return {
      bookId: this.bookId,
      title: this.title,
      author: this.author,
      genre: this.genre,
      topics: this.topics,
      summary: this.summary,  // ✅ ADD THIS LINE
      status: this.status,
      createdAt: this.createdAt,
      isPublished: this.isPublished(),
      isAvailable: this.isAvailable()
    };
  }

  // Update method
  update(updateData) {
    // Only update allowed fields
    const allowedFields = ['title', 'author', 'genre', 'topics', 'summary', 'status'];  // ✅ ADD 'summary'
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'topics') {
          this.topics = updateData[key] || [];
        } else {
          this[this._camelCase(key)] = updateData[key];
        }
      }
    });
    
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  // ✅ ADD NEW METHOD FOR SUMMARY SEARCH
  matchesSummary(searchTerm) {
    return this.summary.toLowerCase().includes(searchTerm.toLowerCase());
  }
}
```

#### Step 3: Update Book Service
**File:** `src/core/database/services/bookService.js`

```javascript
// Update createBook method
async createBook(bookData) {
  const pool = this.getPool();
  if (!pool) throw new Error('Database not available');

  const book = Book.create(bookData);
  
  const query = `
    INSERT INTO books (title, author, genre, topics, summary, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  
  const values = [
    book.title,
    book.author,
    book.genre,
    book.topics,
    book.summary,  // ✅ ADD THIS LINE
    book.status
  ];

  const result = await pool.query(query, values);
  return Book.fromDatabaseRow(result.rows[0]);
}

// Update updateBook method
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
    SET title = $1, author = $2, genre = $3, topics = $4, summary = $5, status = $6
    WHERE book_id = $7
    RETURNING *
  `;
  
  const values = [
    book.title,
    book.author,
    book.genre,
    book.topics,
    book.summary,  // ✅ ADD THIS LINE
    book.status,
    bookId
  ];

  const result = await pool.query(query, values);
  return Book.fromDatabaseRow(result.rows[0]);
}

// ✅ ADD NEW SEARCH METHOD
async searchBooksBySummary(searchTerm, limit = 50) {
  const pool = this.getPool();
  if (!pool) throw new Error('Database not available');

  const query = `
    SELECT * FROM books 
    WHERE summary ILIKE $1 
    AND status = 'published'
    ORDER BY title
    LIMIT $2
  `;
  
  const searchPattern = `%${searchTerm}%`;
  const result = await pool.query(query, [searchPattern, limit]);
  return result.rows.map(row => Book.fromDatabaseRow(row));
}
```

#### Step 4: Run Migration
```bash
npm run db:migrate
```

#### Step 5: Update Seed Data (Optional)
**File:** `scripts/seed-data.js`

```javascript
// Update the books array to include summary
const books = [
  {
    title: 'The Future of Technology',
    author: 'Dr. Sarah Tech',
    genre: 'Technology',
    topics: ['technology', 'artificial intelligence', 'future trends'],
    summary: 'An in-depth exploration of emerging technologies and their impact on society.'  // ✅ ADD
  },
  // ... other books with summaries
];
```

---

## 2. Adding New Tables to Schema

### Example: Adding `owned_books` table for customer purchases

#### Step 1: Create Migration File
**File:** `src/core/database/migrations/007_create_owned_books.sql`

```sql
-- Create owned_books table for customer purchases
CREATE TABLE IF NOT EXISTS owned_books (
  owned_book_id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  purchase_price DECIMAL(10,2),
  purchase_source VARCHAR(100), -- 'website', 'app', 'promo', etc.
  access_status VARCHAR(20) DEFAULT 'active' CHECK (access_status IN ('active', 'suspended', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one purchase record per customer-book combination
  UNIQUE(customer_id, book_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_owned_books_customer_id ON owned_books(customer_id);
CREATE INDEX IF NOT EXISTS idx_owned_books_book_id ON owned_books(book_id);
CREATE INDEX IF NOT EXISTS idx_owned_books_purchase_date ON owned_books(purchase_date);
CREATE INDEX IF NOT EXISTS idx_owned_books_access_status ON owned_books(access_status);

-- Add comments for documentation
COMMENT ON TABLE owned_books IS 'Customer book purchases and ownership tracking';
COMMENT ON COLUMN owned_books.owned_book_id IS 'Primary key for ownership record';
COMMENT ON COLUMN owned_books.customer_id IS 'Foreign key reference to customers table';
COMMENT ON COLUMN owned_books.book_id IS 'Foreign key reference to books table';
COMMENT ON COLUMN owned_books.purchase_date IS 'When the customer purchased the book';
COMMENT ON COLUMN owned_books.purchase_price IS 'Price paid for the book';
COMMENT ON COLUMN owned_books.purchase_source IS 'Where the purchase was made';
COMMENT ON COLUMN owned_books.access_status IS 'Current access status: active, suspended, expired';
```

#### Step 2: Create Data Model
**File:** `src/core/database/models/OwnedBook.js`

```javascript
class OwnedBook {
  constructor(data = {}) {
    this.ownedBookId = data.owned_book_id || null;
    this.customerId = data.customer_id || null;
    this.bookId = data.book_id || null;
    this.purchaseDate = data.purchase_date || null;
    this.purchasePrice = data.purchase_price || 0;
    this.purchaseSource = data.purchase_source || '';
    this.accessStatus = data.access_status || 'active';
    this.createdAt = data.created_at || null;
  }

  // Business logic methods
  isActive() {
    return this.accessStatus === 'active';
  }

  hasAccess() {
    return this.accessStatus === 'active';
  }

  getDaysOwned() {
    if (!this.purchaseDate) return 0;
    
    const purchaseDate = new Date(this.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now - purchaseDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.customerId) {
      errors.push('Customer ID is required');
    }

    if (!this.bookId) {
      errors.push('Book ID is required');
    }

    if (this.purchasePrice < 0) {
      errors.push('Purchase price cannot be negative');
    }

    if (!['active', 'suspended', 'expired'].includes(this.accessStatus)) {
      errors.push('Access status must be active, suspended, or expired');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Data transformation methods
  toDatabaseFormat() {
    return {
      owned_book_id: this.ownedBookId,
      customer_id: this.customerId,
      book_id: this.bookId,
      purchase_date: this.purchaseDate,
      purchase_price: this.purchasePrice,
      purchase_source: this.purchaseSource,
      access_status: this.accessStatus,
      created_at: this.createdAt
    };
  }

  toJSON() {
    return {
      ownedBookId: this.ownedBookId,
      customerId: this.customerId,
      bookId: this.bookId,
      purchaseDate: this.purchaseDate,
      purchasePrice: this.purchasePrice,
      purchaseSource: this.purchaseSource,
      accessStatus: this.accessStatus,
      createdAt: this.createdAt,
      isActive: this.isActive(),
      hasAccess: this.hasAccess(),
      daysOwned: this.getDaysOwned()
    };
  }

  // Factory methods
  static fromDatabaseRow(row) {
    return new OwnedBook(row);
  }

  static create(ownedBookData) {
    const ownedBook = new OwnedBook(ownedBookData);
    const validation = ownedBook.validate();
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    return ownedBook;
  }

  // Update method
  update(updateData) {
    const allowedFields = ['purchase_price', 'purchase_source', 'access_status'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        this[this._camelCase(key)] = updateData[key];
      }
    });
    
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
  }

  // Helper method for field name conversion
  _camelCase(str) {
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }
}

module.exports = OwnedBook;
```

#### Step 3: Create Service
**File:** `src/core/database/services/ownedBookService.js`

```javascript
const connection = require('../connection');
const OwnedBook = require('../models/OwnedBook');

class OwnedBookService {
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
  async createOwnedBook(ownedBookData) {
    const pool = this.getPool();
    if (!pool) throw new Error('Database not available');

    const ownedBook = OwnedBook.create(ownedBookData);
    
    const query = `
      INSERT INTO owned_books (customer_id, book_id, purchase_price, purchase_source, access_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      ownedBook.customerId,
      ownedBook.bookId,
      ownedBook.purchasePrice,
      ownedBook.purchaseSource,
      ownedBook.accessStatus
    ];

    try {
      const result = await pool.query(query, values);
      return OwnedBook.fromDatabaseRow(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Customer already owns this book');
      }
      throw error;
    }
  }

  // Read operations
  async getOwnedBooksByCustomer(customerId, options = {}) {
    const pool = this.getPool();
    if (!pool) throw new Error('Database not available');

    const { limit = 50, offset = 0, accessStatus } = options;
    
    let query = 'SELECT * FROM owned_books WHERE customer_id = $1';
    const values = [customerId];
    let paramCount = 1;

    if (accessStatus) {
      paramCount++;
      query += ` AND access_status = $${paramCount}`;
      values.push(accessStatus);
    }

    query += ` ORDER BY purchase_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows.map(row => OwnedBook.fromDatabaseRow(row));
  }

  async getCustomersByBook(bookId) {
    const pool = this.getPool();
    if (!pool) throw new Error('Database not available');

    const query = `
      SELECT ob.*, c.email, c.name 
      FROM owned_books ob
      JOIN customers c ON ob.customer_id = c.customer_id
      WHERE ob.book_id = $1 AND ob.access_status = 'active'
      ORDER BY ob.purchase_date DESC
    `;
    
    const result = await pool.query(query, [bookId]);
    return result.rows.map(row => ({
      ...OwnedBook.fromDatabaseRow(row).toJSON(),
      customerEmail: row.email,
      customerName: row.name
    }));
  }

  async hasBookAccess(customerId, bookId) {
    const pool = this.getPool();
    if (!pool) throw new Error('Database not available');

    const query = `
      SELECT * FROM owned_books 
      WHERE customer_id = $1 AND book_id = $2 AND access_status = 'active'
    `;
    
    const result = await pool.query(query, [customerId, bookId]);
    return result.rows.length > 0;
  }

  // Analytics
  async getPurchaseStats() {
    const pool = this.getPool();
    if (!pool) throw new Error('Database not available');

    const query = `
      SELECT 
        COUNT(*) as total_purchases,
        COUNT(DISTINCT customer_id) as unique_customers,
        COUNT(DISTINCT book_id) as unique_books,
        AVG(purchase_price) as average_price,
        SUM(purchase_price) as total_revenue
      FROM owned_books 
      WHERE access_status = 'active'
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }
}

module.exports = new OwnedBookService();
```

#### Step 4: Update Database Index
**File:** `src/core/database/index.js`

```javascript
// Add to imports
const OwnedBook = require('./models/OwnedBook');
const ownedBookService = require('./services/ownedBookService');

// Add to initialize method
async initialize() {
  // ... existing code ...
  
  // Initialize services with connection
  await customerService.initialize();
  await bookService.initialize();
  await ownedBookService.initialize();  // ✅ ADD THIS LINE

  // ... rest of existing code ...
}

// Add to service access methods
get ownedBooks() {
  if (!ownedBookService.getPool()) {
    ownedBookService.initialize();
  }
  return ownedBookService;
}

// Add to models
get models() {
  return {
    Customer,
    Book,
    Job,
    EmailRecord,
    OwnedBook  // ✅ ADD THIS LINE
  };
}
```

#### Step 5: Run Migration
```bash
npm run db:migrate
```

#### Step 6: Update Seed Data (Optional)
**File:** `scripts/seed-data.js`

```javascript
// Add after books creation
if (createdCustomers.length > 0 && createdBooks.length > 0) {
  // Create some owned books
  const ownedBooks = [];
  
  for (let i = 0; i < Math.min(createdCustomers.length, 3); i++) {
    const customer = createdCustomers[i];
    
    // Each customer owns 1-2 books
    const booksToOwn = createdBooks.slice(i, i + 2);
    
    for (const book of booksToOwn) {
      ownedBooks.push({
        customer_id: customer.customerId,
        book_id: book.bookId,
        purchase_price: Math.floor(Math.random() * 20) + 5, // $5-25
        purchase_source: ['website', 'app', 'promo'][Math.floor(Math.random() * 3)]
      });
    }
  }

  console.log('📚 Creating owned books...');
  const ownedBookResults = await database.ownedBooks.bulkCreateOwnedBooks(ownedBooks);
  console.log(`   ✅ Created ${ownedBookResults.created} owned books`);
}
```

---

## 3. Best Practices

### Migration Guidelines
1. **Always create migrations first** before updating models
2. **Use sequential numbering** (006, 007, 008...)
3. **Include rollback considerations** in comments
4. **Add appropriate indexes** for query performance
5. **Use IF NOT EXISTS** to make migrations idempotent

### Model Guidelines
1. **Update all transformation methods** (toDatabaseFormat, toJSON)
2. **Add validation rules** for new fields
3. **Include business logic methods** relevant to the field/table
4. **Maintain consistent naming conventions** (camelCase in JS, snake_case in SQL)

### Service Guidelines
1. **Update CRUD operations** to include new fields
2. **Add relevant query methods** for the new data
3. **Include error handling** for constraints
4. **Consider performance implications** of new queries

### Testing
1. **Test migration rollback** in development
2. **Verify model validation** with edge cases
3. **Test service methods** with real data
4. **Check performance** of new queries

---

## 4. Troubleshooting

### Common Issues
- **Migration fails**: Check for syntax errors in SQL
- **Model validation errors**: Ensure all required fields are handled
- **Service errors**: Verify database connection and field names
- **Performance issues**: Add appropriate indexes

### Recovery Commands
```bash
# Check migration status
npm run db:status

# Reset and rebuild (development only)
npm run db:reset
npm run db:migrate
npm run db:seed

# Check specific table
npm run db:status
```

Following these guidelines ensures consistent, safe database modifications that maintain data integrity and system performance.