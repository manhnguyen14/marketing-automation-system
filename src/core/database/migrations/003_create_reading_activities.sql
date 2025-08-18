-- Create reading_activities table for customer behavior tracking
CREATE TABLE IF NOT EXISTS reading_activities (
                                                  activity_id SERIAL PRIMARY KEY,
                                                  customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(book_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('chapter_read', 'book_started', 'book_completed', 'book_abandoned')),
    progress_percentage DECIMAL(5,2) CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON reading_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_activities_book_id ON reading_activities(book_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON reading_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_date ON reading_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_progress ON reading_activities(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_activities_customer_book ON reading_activities(customer_id, book_id);

-- Add comments for documentation
COMMENT ON TABLE reading_activities IS 'Customer reading behavior tracking for marketing automation';
COMMENT ON COLUMN reading_activities.activity_id IS 'Primary key for activity identification';
COMMENT ON COLUMN reading_activities.customer_id IS 'Foreign key reference to customers table';
COMMENT ON COLUMN reading_activities.book_id IS 'Foreign key reference to books table';
COMMENT ON COLUMN reading_activities.activity_type IS 'Type of reading activity: chapter_read, book_started, book_completed, book_abandoned';
COMMENT ON COLUMN reading_activities.progress_percentage IS 'Reading progress percentage (0-100)';
COMMENT ON COLUMN reading_activities.activity_date IS 'Timestamp when activity occurred';