-- Add new fields to existing email_records table for Postmark integration
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES email_templates(template_id);
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(100);
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS processed_html_content TEXT;
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS processed_text_content TEXT;
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS variables_used JSONB;

-- Postmark request fields (individual fields instead of JSONB)
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS cc_emails TEXT[];
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS bcc_emails TEXT[];
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS reply_to VARCHAR(255);
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS tag_string VARCHAR(100);
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Postmark response fields (extracted + JSONB for full response)
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS error_code VARCHAR(50);
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS postmark_response_data JSONB;
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE;

-- Add batch tracking field
ALTER TABLE email_records ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_email_records_template_id ON email_records(template_id);
CREATE INDEX IF NOT EXISTS idx_email_records_campaign_id ON email_records(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_records_batch_id ON email_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_email_records_submitted_at ON email_records(submitted_at);
CREATE INDEX IF NOT EXISTS idx_email_records_tag_string ON email_records(tag_string);

-- Add GIN index for metadata and variables_used JSONB fields
CREATE INDEX IF NOT EXISTS idx_email_records_metadata ON email_records USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_email_records_variables_used ON email_records USING GIN(variables_used);

-- Add comments for new fields
COMMENT ON COLUMN email_records.template_id IS 'Foreign key reference to email_templates table';
COMMENT ON COLUMN email_records.campaign_id IS 'Campaign identifier for grouping emails';
COMMENT ON COLUMN email_records.processed_html_content IS 'Final HTML content after variable replacement';
COMMENT ON COLUMN email_records.processed_text_content IS 'Final text content after variable replacement';
COMMENT ON COLUMN email_records.variables_used IS 'JSON object of variables and their values used in template';
COMMENT ON COLUMN email_records.cc_emails IS 'Array of CC email addresses';
COMMENT ON COLUMN email_records.bcc_emails IS 'Array of BCC email addresses';
COMMENT ON COLUMN email_records.reply_to IS 'Reply-to email address';
COMMENT ON COLUMN email_records.tag_string IS 'Postmark tag for email categorization';
COMMENT ON COLUMN email_records.metadata IS 'Additional metadata for email tracking';
COMMENT ON COLUMN email_records.error_code IS 'Postmark error code if sending failed';
COMMENT ON COLUMN email_records.error_message IS 'Postmark error message if sending failed';
COMMENT ON COLUMN email_records.postmark_response_data IS 'Full Postmark API response as JSON';
COMMENT ON COLUMN email_records.submitted_at IS 'Timestamp when email was submitted to Postmark';
COMMENT ON COLUMN email_records.batch_id IS 'Batch identifier for grouping multiple emails';