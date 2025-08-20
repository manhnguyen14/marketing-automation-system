-- Create email_records table for campaign tracking
CREATE TABLE IF NOT EXISTS email_records (
    email_id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(job_id) ON DELETE SET NULL,
    pipeline_id VARCHAR(100) NOT NULL,
    recipient_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    email_address VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('predefined', 'ai_generated')),
    template_id VARCHAR(100),
    postmark_message_id VARCHAR(100),
    sent_at TIMESTAMP WITH TIME ZONE,
                                                                                        delivery_status VARCHAR(50),
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_records_recipient ON email_records(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_records_pipeline ON email_records(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_email_records_job_id ON email_records(job_id);
CREATE INDEX IF NOT EXISTS idx_email_records_postmark ON email_records(postmark_message_id);
CREATE INDEX IF NOT EXISTS idx_email_records_sent_at ON email_records(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_records_content_type ON email_records(content_type);
CREATE INDEX IF NOT EXISTS idx_email_records_delivery_status ON email_records(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_records_template_id ON email_records(template_id);

-- Add comments for documentation
COMMENT ON TABLE email_records IS 'Email campaign execution and tracking records';
COMMENT ON COLUMN email_records.email_id IS 'Primary key for email record identification';
COMMENT ON COLUMN email_records.job_id IS 'Foreign key reference to jobs table (nullable)';
COMMENT ON COLUMN email_records.pipeline_id IS 'Identifier for marketing pipeline that sent email';
COMMENT ON COLUMN email_records.recipient_id IS 'Foreign key reference to customers table';
COMMENT ON COLUMN email_records.email_address IS 'Recipient email address (denormalized for tracking)';
COMMENT ON COLUMN email_records.subject IS 'Email subject line';
COMMENT ON COLUMN email_records.content_type IS 'Email content type: predefined or ai_generated';
COMMENT ON COLUMN email_records.template_id IS 'Identifier for email template used';
COMMENT ON COLUMN email_records.postmark_message_id IS 'Postmark API message ID for tracking';
COMMENT ON COLUMN email_records.sent_at IS 'Timestamp when email was sent';
COMMENT ON COLUMN email_records.delivery_status IS 'Email delivery status from Postmark';
COMMENT ON COLUMN email_records.opened_at IS 'Timestamp when email was opened (if tracked)';
COMMENT ON COLUMN email_records.clicked_at IS 'Timestamp when email link was clicked (if tracked)';
COMMENT ON COLUMN email_records.bounced_at IS 'Timestamp when email bounced (if occurred)';
COMMENT ON COLUMN email_records.created_at IS 'Timestamp when email record was created';