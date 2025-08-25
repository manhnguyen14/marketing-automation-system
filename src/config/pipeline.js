require('dotenv').config();

/**
 * Pipeline-specific configuration
 * Validates and exports pipeline.js system settings
 */

// Validate pipeline.js environment variables
function validatePipelineConfig() {
    const warnings = [];
    const errors = [];

    // Template generation configuration
    const maxRetries = parseInt(process.env.MAX_TEMPLATE_RETRIES);
    if (isNaN(maxRetries) || maxRetries < 1 || maxRetries > 10) {
        warnings.push('MAX_TEMPLATE_RETRIES should be between 1-10, defaulting to 3');
    }

    const retryDelay = parseInt(process.env.TEMPLATE_RETRY_DELAY_MINUTES);
    if (isNaN(retryDelay) || retryDelay < 1 || retryDelay > 60) {
        warnings.push('TEMPLATE_RETRY_DELAY_MINUTES should be between 1-60, defaulting to 10');
    }

    // Queue processing configuration
    const scanInterval = parseInt(process.env.QUEUE_SCAN_INTERVAL_SECONDS);
    if (isNaN(scanInterval) || scanInterval < 30 || scanInterval > 300) {
        warnings.push('QUEUE_SCAN_INTERVAL_SECONDS should be between 30-300, defaulting to 60');
    }

    // Log warnings
    if (warnings.length > 0) {
        console.warn('⚠️ Pipeline configuration warnings:');
        warnings.forEach(warning => console.warn(`   - ${warning}`));
    }

    // Log errors
    if (errors.length > 0) {
        console.error('❌ Pipeline configuration errors:');
        errors.forEach(error => console.error(`   - ${error}`));
        throw new Error('Pipeline configuration validation failed');
    }

    console.log('✅ Pipeline configuration validated');
}

// Run validation
validatePipelineConfig();

module.exports = {
    // Template generation settings
    templateGeneration: {
        maxRetries: parseInt(process.env.MAX_TEMPLATE_RETRIES) || 3,
        retryDelayMinutes: parseInt(process.env.TEMPLATE_RETRY_DELAY_MINUTES) || 10,
        batchSize: parseInt(process.env.TEMPLATE_BATCH_SIZE) || 20,
        timeoutMinutes: parseInt(process.env.TEMPLATE_TIMEOUT_MINUTES) || 5
    },

    // Queue processing settings
    queueProcessing: {
        scanIntervalSeconds: parseInt(process.env.QUEUE_SCAN_INTERVAL_SECONDS) || 60,
        scanSendMailIntervalSeconds: parseInt(process.env.QUEUE_SCAN_SEND_MAIL_INTERVAL_SECONDS) || 120,
        batchSize: parseInt(process.env.QUEUE_BATCH_SIZE) || 50,
        maxProcessingTime: parseInt(process.env.MAX_PROCESSING_TIME_SECONDS) || 300
    },

    // Email sending settings
    emailSending: {
        maxRecipientsPerJob: parseInt(process.env.EMAIL_MAX_RECIPIENTS_PER_JOB) || 50,
        retryDelayMinutes: parseInt(process.env.EMAIL_RETRY_DELAY_MINUTES) || 5,
        maxEmailRetries: parseInt(process.env.MAX_EMAIL_RETRIES) || 3
    },

    // Performance settings
    performance: {
        executionTimeoutSeconds: parseInt(process.env.PIPELINE_EXECUTION_TIMEOUT_SECONDS) || 300,
        maxConcurrentPipelines: parseInt(process.env.MAX_CONCURRENT_PIPELINES) || 3,
        logRetentionDays: parseInt(process.env.PIPELINE_LOG_RETENTION_DAYS) || 90
    },

    // Development settings
    development: {
        enableDebugLogging: process.env.PIPELINE_DEBUG === 'true',
        mockAIGeneration: process.env.MOCK_AI_GENERATION === 'true', // Default false, explicit true to enable mock
        skipRealEmailSending: process.env.SKIP_REAL_EMAIL_SENDING === 'true'
    },

    // AI service settings (pipeline-specific)
    ai: {
        geminiTimeout: parseInt(process.env.GEMINI_TIMEOUT_SECONDS) || 30,
        enableMockGeneration: process.env.MOCK_AI_GENERATION === 'true'
    }
};