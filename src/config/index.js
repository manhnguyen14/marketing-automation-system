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

// Email configuration validation
function validateEmailConfig() {
    const emailErrors = [];

    if (!process.env.POSTMARK_TOKEN) {
        emailErrors.push('POSTMARK_TOKEN is required for email functionality');
    }

    if (!process.env.POSTMARK_FROM_EMAIL) {
        emailErrors.push('POSTMARK_FROM_EMAIL is required for email functionality');
    }

    if (emailErrors.length > 0) {
        console.warn('⚠️  Email configuration warnings:');
        emailErrors.forEach(error => console.warn(`   - ${error}`));
        console.warn('💡 Email functionality will be limited without proper configuration.\n');
    }
}

// Pipeline configuration is handled by ./pipeline.js.js

// Run validations
validateEmailConfig();

module.exports = {
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    auth: {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        jwtSecret: process.env.JWT_SECRET
    },
    database: {
        url: process.env.DATABASE_URL,
        poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX) || 10,
        acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 30000,
        ssl: process.env.NODE_ENV === 'production'
    },
    email: {
        postmark: {
            token: process.env.POSTMARK_TOKEN,
            fromEmail: process.env.POSTMARK_FROM_EMAIL || 'noreply@company.com',
            apiUrl: 'https://api.postmarkapp.com'
        },
        batch: {
            size: parseInt(process.env.EMAIL_BATCH_SIZE) || 50,
            timeout: parseInt(process.env.EMAIL_TIMEOUT_SECONDS) || 30,
            maxRecipients: parseInt(process.env.EMAIL_MAX_RECIPIENTS) || 500
        },
        templates: {
            cacheTtl: parseInt(process.env.TEMPLATE_CACHE_TTL) || 3600,
            variablePattern: /\{\{([^}]+)\}\}/g
        },
        validation: {
            requirePostmarkToken: true,
            requireFromEmail: true,
            maxSubjectLength: 255,
            maxContentLength: 1000000
        }
    },
    external: {
        postmarkToken: process.env.POSTMARK_TOKEN,
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiTimeout: parseInt(process.env.GEMINI_TIMEOUT_SECONDS) || 30
    },
    scheduler: {
        jobTimeoutSeconds: parseInt(process.env.JOB_TIMEOUT_SECONDS) || 60,
        retryCount: parseInt(process.env.RETRY_COUNT) || 3,
        retryIntervalMinutes: parseInt(process.env.RETRY_INTERVAL_MINUTES) || 30,
        emailBatchSize: parseInt(process.env.EMAIL_BATCH_SIZE) || 50
    }
};