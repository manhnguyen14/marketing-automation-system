-- Create customers table for marketing automation system
CREATE TABLE IF NOT EXISTS customers (
                                         customer_id SERIAL PRIMARY KEY,
                                         email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    topics_of_interest TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company);
CREATE INDEX IF NOT EXISTS idx_customers_topics ON customers USING GIN(topics_of_interest);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Customer data for email marketing campaigns';
COMMENT ON COLUMN customers.customer_id IS 'Primary key for customer identification';
COMMENT ON COLUMN customers.email IS 'Unique email address for marketing communications';
COMMENT ON COLUMN customers.name IS 'Customer full name for personalization';
COMMENT ON COLUMN customers.company IS 'Company name for B2B segmentation';
COMMENT ON COLUMN customers.status IS 'Customer status: active, inactive, or blacklisted';
COMMENT ON COLUMN customers.topics_of_interest IS 'Array of topics for content personalization';
COMMENT ON COLUMN customers.created_at IS 'Timestamp when customer was added to system';
COMMENT ON COLUMN customers.updated_at IS 'Timestamp when customer data was last updated';