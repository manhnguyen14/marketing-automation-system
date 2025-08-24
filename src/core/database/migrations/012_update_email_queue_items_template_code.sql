-- Update email_queue_items table to use template_code instead of template_id
-- This migration changes the template reference from ID to code

-- Drop the foreign key constraint first
ALTER TABLE email_queue_items DROP CONSTRAINT IF EXISTS email_queue_items_template_id_fkey;

-- Change the column type and rename it
ALTER TABLE email_queue_items ALTER COLUMN template_id TYPE VARCHAR(100);
ALTER TABLE email_queue_items RENAME COLUMN template_id TO template_code;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_queue_items_template_code ON email_queue_items(template_code);

-- Add comment to explain the field
COMMENT ON COLUMN email_queue_items.template_code IS 'Template code identifier referencing email_templates.template_code';

-- Note: We're not adding a foreign key constraint to template_code because:
-- 1. The email_templates table might not have template_code populated yet
-- 2. We want flexibility in the application layer for AI-generated templates
-- 3. This project hasn't gone live yet, so we can handle data consistency in the application
