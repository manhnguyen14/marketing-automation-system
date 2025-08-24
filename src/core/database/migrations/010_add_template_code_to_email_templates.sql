-- Add template_code field to email_templates table
-- This migration adds a unique template_code field to replace template_id references

-- Add the template_code column
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS template_code VARCHAR(100);

-- Create a unique index on template_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_template_code ON email_templates(template_code);

-- Add a comment to explain the field
COMMENT ON COLUMN email_templates.template_code IS 'Unique code identifier for the template, used for referencing templates instead of template_id';

-- Note: We're not making it NOT NULL yet because existing data needs to be populated first
-- In a production environment, you would:
-- 1. Add the column as nullable
-- 2. Populate existing rows with template codes
-- 3. Add NOT NULL constraint in a separate migration
-- Since this project hasn't gone live yet, we can handle this in the application layer
