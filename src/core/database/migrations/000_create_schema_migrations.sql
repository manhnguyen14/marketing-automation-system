-- Create schema_migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Add comment for documentation
COMMENT ON TABLE schema_migrations IS 'Tracks which database migrations have been applied';
COMMENT ON COLUMN schema_migrations.migration_id IS 'Migration file identifier (e.g., 001, 002, 003)';
COMMENT ON COLUMN schema_migrations.applied_at IS 'Timestamp when migration was applied';