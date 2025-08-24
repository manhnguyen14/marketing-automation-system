module.exports = {
    postmark: {
        token: process.env.POSTMARK_TOKEN,
        fromEmail: `${process.env.POSTMARK_FROM_NAME || 'BH Team'} <${process.env.POSTMARK_FROM_EMAIL || 'manhnp@mpos.vn'}>`,
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
        maxContentLength: 1000000 // 1MB
    }
};