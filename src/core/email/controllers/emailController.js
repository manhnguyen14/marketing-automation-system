const emailSendService = require('../services/emailSendService');
const emailTemplateService = require('../../database/services/emailTemplateService');
const postmarkService = require('../services/postmarkService');

class EmailController {
    // Send batch emails with template processing
    async sendBatchEmails(req, res) {
        try {
            const {
                templateId,
                recipients,
                campaignId,
                ccEmails = [],
                bccEmails = [],
                replyTo = null,
                tagString = null,
                metadata = {}
            } = req.body;

            // Validate request data
            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Recipients array is required and must not be empty'
                });
            }

            // Validate batch data
            const validation = emailSendService.validateBatchEmailData(req.body);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors
                });
            }

            // Check if service is ready
            if (!emailSendService.isReady()) {
                return res.status(503).json({
                    success: false,
                    error: 'Email service not available',
                    message: 'Email service is not properly initialized'
                });
            }

            console.log(`📧 Processing batch email request - Template: ${templateId}, Recipients: ${recipients.length}`);

            // Send emails
            const result = await emailSendService.sendBatchEmailsWithTemplate({
                templateId,
                recipients,
                campaignId,
                ccEmails,
                bccEmails,
                replyTo,
                tagString,
                metadata
            });

            res.json({
                success: true,
                data: result,
                message: 'Batch email sent successfully'
            });

        } catch (error) {
            console.error('❌ Batch email sending failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to send batch emails',
                details: error.message
            });
        }
    }

    // Preview template with variables
    async previewTemplate(req, res) {
        try {
            const { templateId, variables = {} } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`🔍 Generating template preview - Template: ${templateId}`);

            const result = await emailSendService.previewEmailTemplate(templateId, variables);

            res.json({
                success: true,
                data: result,
                message: 'Template preview generated successfully'
            });

        } catch (error) {
            console.error('❌ Template preview failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to generate template preview',
                details: error.message
            });
        }
    }

    // Get email service status
    async getServiceStatus(req, res) {
        try {
            const status = emailSendService.getStatus();
            const postmarkTest = await postmarkService.testConnection();

            res.json({
                success: true,
                data: {
                    emailService: status,
                    postmarkConnection: postmarkTest,
                    timestamp: new Date().toISOString()
                },
                message: 'Email service status retrieved'
            });

        } catch (error) {
            console.error('❌ Failed to get service status:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get service status',
                details: error.message
            });
        }
    }

    // Test email sending
    async testEmailSending(req, res) {
        try {
            const { testEmail } = req.body;

            if (!testEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Test email address is required'
                });
            }

            console.log(`🧪 Testing email sending to: ${testEmail}`);

            const result = await emailSendService.testEmailSending(testEmail);

            res.json({
                success: result.success,
                data: result,
                message: result.success ? 'Test email sent successfully' : 'Test email failed'
            });

        } catch (error) {
            console.error('❌ Email sending test failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Email sending test failed',
                details: error.message
            });
        }
    }

    // Get batch send statistics
    async getBatchStats(req, res) {
        try {
            const { batchId } = req.params;

            if (!batchId) {
                return res.status(400).json({
                    success: false,
                    error: 'Batch ID is required'
                });
            }

            console.log(`📊 Retrieving batch statistics for: ${batchId}`);

            const result = await emailSendService.getBatchSendStats(batchId);

            res.json({
                success: true,
                data: result,
                message: 'Batch statistics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get batch statistics:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get batch statistics',
                details: error.message
            });
        }
    }

    // Get available templates
    async getAvailableTemplates(req, res) {
        try {
            const {
                category,
                templateType,
                limit = 50,
                offset = 0
            } = req.query;

            console.log('📋 Retrieving available email templates');

            const templates = await emailTemplateService.getApprovedTemplates({
                category,
                templateType,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const totalCount = await emailTemplateService.getTemplateCount({
                status: 'APPROVED',
                category,
                templateType
            });

            res.json({
                success: true,
                data: {
                    templates: templates.map(template => template.toJSON()),
                    pagination: {
                        total: totalCount,
                        limit: parseInt(limit),
                        offset: parseInt(offset),
                        hasMore: (parseInt(offset) + templates.length) < totalCount
                    }
                },
                message: 'Templates retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get templates:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get templates',
                details: error.message
            });
        }
    }

    // Get template details
    async getTemplateDetails(req, res) {
        try {
            const { templateId } = req.params;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`📄 Retrieving template details for: ${templateId}`);

            const template = await emailTemplateService.getTemplateById(templateId);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            // Get template usage statistics
            const usageStats = await emailTemplateService.getTemplateUsageStats(templateId);

            res.json({
                success: true,
                data: {
                    template: template.toJSON(),
                    usageStats: usageStats
                },
                message: 'Template details retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get template details:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get template details',
                details: error.message
            });
        }
    }

    // Validate template variables
    async validateTemplateVariables(req, res) {
        try {
            const { templateId } = req.params;
            const { variables = {} } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`✅ Validating template variables for: ${templateId}`);

            const validation = await emailTemplateService.validateTemplateVariables(templateId, variables);

            res.json({
                success: validation.isValid,
                data: {
                    templateId: parseInt(templateId),
                    variables: variables,
                    validation: validation
                },
                message: validation.isValid ? 'Variables are valid' : 'Variable validation failed'
            });

        } catch (error) {
            console.error('❌ Template variable validation failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Template variable validation failed',
                details: error.message
            });
        }
    }

    // Get email delivery status
    async getEmailDeliveryStatus(req, res) {
        try {
            const { emailIds } = req.body;

            if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Email IDs array is required'
                });
            }

            console.log(`📧 Checking delivery status for ${emailIds.length} emails`);

            const emailRecordService = require('../../database/services/emailRecordService');
            const deliveryStatus = await emailRecordService.getDeliveryStatus(emailIds);

            res.json({
                success: true,
                data: {
                    emailIds: emailIds,
                    deliveryStatus: deliveryStatus
                },
                message: 'Email delivery status retrieved'
            });

        } catch (error) {
            console.error('❌ Failed to get email delivery status:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to get email delivery status',
                details: error.message
            });
        }
    }

    // Health check endpoint
    async healthCheck(req, res) {
        try {
            const serviceStatus = emailSendService.getStatus();
            const postmarkStatus = await postmarkService.testConnection();

            const isHealthy = serviceStatus.initialized &&
                serviceStatus.postmarkConnected &&
                postmarkStatus.connected;

            res.status(isHealthy ? 200 : 503).json({
                success: isHealthy,
                data: {
                    status: isHealthy ? 'healthy' : 'unhealthy',
                    services: {
                        emailService: serviceStatus,
                        postmark: postmarkStatus
                    },
                    timestamp: new Date().toISOString()
                },
                message: isHealthy ? 'Email service is healthy' : 'Email service has issues'
            });

        } catch (error) {
            console.error('❌ Email service health check failed:', error.message);
            res.status(503).json({
                success: false,
                error: 'Health check failed',
                details: error.message
            });
        }
    }
}

module.exports = new EmailController();