-- Create jobs table for email campaign scheduling
CREATE TABLE IF NOT EXISTS jobs (
    job_id SERIAL PRIMARY KEY,
    pipeline_name VARCHAR(100) NOT NULL,
    action_tag VARCHAR(100),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'NEW' CHECK (status IN ('NEW', 'RUNNING', 'DONE', 'FAILED')),
    description TEXT,
    metadata JSONB,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
                                 );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_time ON jobs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_jobs_pipeline ON jobs(pipeline_name);
CREATE INDEX IF NOT EXISTS idx_jobs_action_tag ON jobs(action_tag);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_scheduled ON jobs(status, scheduled_time);

-- Add comments for documentation
COMMENT ON TABLE jobs IS 'Scheduled jobs for email campaign automation';
COMMENT ON COLUMN jobs.job_id IS 'Primary key for job identification';
COMMENT ON COLUMN jobs.pipeline_name IS 'Name of marketing automation pipeline';
COMMENT ON COLUMN jobs.action_tag IS 'Tag for grouping related jobs or A/B testing';
COMMENT ON COLUMN jobs.scheduled_time IS 'When the job should be executed';
COMMENT ON COLUMN jobs.status IS 'Job execution status: NEW, RUNNING, DONE, FAILED';
COMMENT ON COLUMN jobs.description IS 'Human-readable description of job purpose';
COMMENT ON COLUMN jobs.metadata IS 'JSON metadata for job configuration and context';
COMMENT ON COLUMN jobs.success_count IS 'Number of successful operations in job';
COMMENT ON COLUMN jobs.fail_count IS 'Number of failed operations in job';
COMMENT ON COLUMN jobs.created_at IS 'Timestamp when job was created';
COMMENT ON COLUMN jobs.started_at IS 'Timestamp when job execution began';
COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when job execution finished';