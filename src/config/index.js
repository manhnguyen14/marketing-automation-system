require('dotenv').config();

// Validate required environment variables
const requiredVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n📝 Please check your .env file and ensure all required variables are set.');
    console.error('💡 Copy .env.example to .env and update the values.\n');
    process.exit(1);
}

// Validate JWT secret length
if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security.');
    console.error('💡 Generate a secure random string for JWT_SECRET in your .env file.\n');
    process.exit(1);
}

module.exports = {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    auth: {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        jwtSecret: process.env.JWT_SECRET
    },
    // Add this database configuration section
    database: {
        url: process.env.DATABASE_URL,
        poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
        ssl: process.env.NODE_ENV === 'production' // Enable SSL in production
    },
    // Data import configuration
    dataImport: {
        maxFileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152, // 2MB default
        maxFileSizeMB: ((parseInt(process.env.IMPORT_MAX_FILE_SIZE) || 2097152) / 1024 / 1024).toFixed(1),
        batchSize: parseInt(process.env.IMPORT_BATCH_SIZE) || 100,
        timeoutMinutes: parseInt(process.env.IMPORT_TIMEOUT_MINUTES) || 10,
        allowedFormats: ['.csv'],
        allowedMimeTypes: ['text/csv', 'application/csv', 'text/plain'],
        supportedEntities: ['customers', 'books'] // Add new entities here
    },
    external: {
        postmarkToken: process.env.POSTMARK_TOKEN,
        geminiApiKey: process.env.GEMINI_API_KEY
    },
    scheduler: {
        jobTimeoutSeconds: parseInt(process.env.JOB_TIMEOUT_SECONDS) || 60,
        retryCount: parseInt(process.env.RETRY_COUNT) || 3,
        retryIntervalMinutes: parseInt(process.env.RETRY_INTERVAL_MINUTES) || 30,
        emailBatchSize: parseInt(process.env.EMAIL_BATCH_SIZE) || 50
    }
};