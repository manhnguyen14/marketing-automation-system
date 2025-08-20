-- Create books table for ebook catalog
CREATE TABLE IF NOT EXISTS books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    genre VARCHAR(100),
    topics TEXT[],
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_topics ON books USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at);

-- Add comments for documentation
COMMENT ON TABLE books IS 'Book catalog for ebook platform and marketing campaigns';
COMMENT ON COLUMN books.book_id IS 'Primary key for book identification';
COMMENT ON COLUMN books.title IS 'Book title for display and search';
COMMENT ON COLUMN books.author IS 'Book author name for filtering and personalization';
COMMENT ON COLUMN books.genre IS 'Book genre for categorization';
COMMENT ON COLUMN books.topics IS 'Array of topics for content matching with customer interests';
COMMENT ON COLUMN books.status IS 'Book status: draft, published, or archived';
COMMENT ON COLUMN books.created_at IS 'Timestamp when book was added to catalog';