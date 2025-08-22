-- Create email_templates table for managing email templates
CREATE TABLE IF NOT EXISTS email_templates (
                                               template_id SERIAL PRIMARY KEY,
                                               name VARCHAR(255) NOT NULL,
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT,
    template_type VARCHAR(20) DEFAULT 'predefined' CHECK (template_type IN ('predefined', 'ai_generated')),
    status VARCHAR(20) DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'WAIT_REVIEW', 'INACTIVE')),
    variation VARCHAR(100),
    prompt TEXT,
    required_variables TEXT[],
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_status ON email_templates(status);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);

-- Create unique constraint for name within category
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_name_category
    ON email_templates(name, category) WHERE status != 'INACTIVE';

-- Add comments for documentation
COMMENT ON TABLE email_templates IS 'Email templates for marketing campaigns and automation';
COMMENT ON COLUMN email_templates.template_id IS 'Primary key for email template';
COMMENT ON COLUMN email_templates.name IS 'Template name for identification';
COMMENT ON COLUMN email_templates.subject_template IS 'Email subject with variable placeholders';
COMMENT ON COLUMN email_templates.html_template IS 'HTML email content with variable placeholders';
COMMENT ON COLUMN email_templates.text_template IS 'Plain text email content (optional)';
COMMENT ON COLUMN email_templates.template_type IS 'Type: predefined (developer-created) or ai_generated';
COMMENT ON COLUMN email_templates.status IS 'Approval status: APPROVED, WAIT_REVIEW, INACTIVE';
COMMENT ON COLUMN email_templates.variation IS 'A/B testing variation identifier';
COMMENT ON COLUMN email_templates.prompt IS 'AI generation prompt (for ai_generated templates)';
COMMENT ON COLUMN email_templates.required_variables IS 'Array of required variables for template';
COMMENT ON COLUMN email_templates.category IS 'Template category for organization';