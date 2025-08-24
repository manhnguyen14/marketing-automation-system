-- Create email_queue_items table for pipeline-based email processing
CREATE TABLE IF NOT EXISTS email_queue_items (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    pipeline_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'WAIT_GENERATE_TEMPLATE' CHECK (status IN (
                                                               'WAIT_GENERATE_TEMPLATE',
                                                               'PENDING_REVIEW',
                                                               'SCHEDULED',
                                                               'SENT',
                                                               'FAILED_GENERATE',
                                                               'FAILED_SEND',
                                                               'REJECTED_TEMPLATE'
                                                                         )),
    template_id INTEGER REFERENCES email_templates(template_id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    context_data JSONB DEFAULT '{}',
    variables JSONB DEFAULT '{}',
    tag VARCHAR(255),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue_items(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_pipeline ON email_queue_items(pipeline_name);
CREATE INDEX IF NOT EXISTS idx_email_queue_customer ON email_queue_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_template ON email_queue_items(template_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue_items(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_email_queue_tag ON email_queue_items(tag);
CREATE INDEX IF NOT EXISTS idx_email_queue_created ON email_queue_items(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_updated ON email_queue_items(updated_at);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled
    ON email_queue_items(status, scheduled_date)
    WHERE status IN ('SCHEDULED', 'WAIT_GENERATE_TEMPLATE');

CREATE INDEX IF NOT EXISTS idx_email_queue_pipeline_status
    ON email_queue_items(pipeline_name, status);

-- Create GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_email_queue_context_data
    ON email_queue_items USING GIN(context_data);
CREATE INDEX IF NOT EXISTS idx_email_queue_variables
    ON email_queue_items USING GIN(variables);

-- Add comments for documentation
COMMENT ON TABLE email_queue_items IS 'Email queue for pipeline-based email processing with AI template generation';
COMMENT ON COLUMN email_queue_items.id IS 'Primary key for email queue item (used as job_id in email_records)';
COMMENT ON COLUMN email_queue_items.customer_id IS 'Foreign key reference to customers table';
COMMENT ON COLUMN email_queue_items.pipeline_name IS 'Name of the marketing pipeline that created this queue item';
COMMENT ON COLUMN email_queue_items.status IS 'Current processing status of the email queue item';
COMMENT ON COLUMN email_queue_items.template_id IS 'Foreign key reference to email_templates (null until template generated)';
COMMENT ON COLUMN email_queue_items.scheduled_date IS 'When the email should be sent';
COMMENT ON COLUMN email_queue_items.context_data IS 'Pipeline-specific context data for AI template generation';
COMMENT ON COLUMN email_queue_items.variables IS 'Template variables for email rendering';
COMMENT ON COLUMN email_queue_items.tag IS 'Pipeline-specific tag for categorization';
COMMENT ON COLUMN email_queue_items.retry_count IS 'Number of retry attempts for failed operations';
COMMENT ON COLUMN email_queue_items.last_error IS 'Last error message from failed operations';
COMMENT ON COLUMN email_queue_items.created_at IS 'Timestamp when queue item was created';
COMMENT ON COLUMN email_queue_items.updated_at IS 'Timestamp when queue item was last updated';