-- Create pipeline_execution_log table for tracking pipeline.js runs
CREATE TABLE IF NOT EXISTS pipeline_execution_log (
    id SERIAL PRIMARY KEY,
    pipeline_name VARCHAR(100) NOT NULL,
    execution_step VARCHAR(100),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'SUCCESS', 'FAILED')),
    queue_items_created INTEGER DEFAULT 0,
    execution_data JSONB DEFAULT '{}',
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pipeline_log_pipeline ON pipeline_execution_log(pipeline_name);
CREATE INDEX IF NOT EXISTS idx_pipeline_log_status ON pipeline_execution_log(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_log_created ON pipeline_execution_log(created_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_log_step ON pipeline_execution_log(execution_step);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_pipeline_log_pipeline_created
    ON pipeline_execution_log(pipeline_name, created_at DESC);

-- Create GIN index for JSONB field
CREATE INDEX IF NOT EXISTS idx_pipeline_log_execution_data
    ON pipeline_execution_log USING GIN(execution_data);

-- Add comments for documentation
COMMENT ON TABLE pipeline_execution_log IS 'Log of pipeline execution runs for monitoring and debugging';
COMMENT ON COLUMN pipeline_execution_log.id IS 'Primary key for pipeline execution log entry';
COMMENT ON COLUMN pipeline_execution_log.pipeline_name IS 'Name of the executed pipeline';
COMMENT ON COLUMN pipeline_execution_log.execution_step IS 'Current step being executed (CREATE_QUEUE_ITEMS, etc.)';
COMMENT ON COLUMN pipeline_execution_log.status IS 'Execution status: IN_PROGRESS, SUCCESS, or FAILED';
COMMENT ON COLUMN pipeline_execution_log.queue_items_created IS 'Number of email queue items created by this execution';
COMMENT ON COLUMN pipeline_execution_log.execution_data IS 'Additional execution metadata and statistics';
COMMENT ON COLUMN pipeline_execution_log.error_message IS 'Error details if execution failed';
COMMENT ON COLUMN pipeline_execution_log.execution_time_ms IS 'Total execution time in milliseconds';
COMMENT ON COLUMN pipeline_execution_log.created_at IS 'Timestamp when execution started';