const emailSendService = require('../services/emailSendService');
const { authMiddleware } = require('../../auth');

class EmailController {
    /**
     * Send batch emails using template
     * POST /api/email/send-batch
     */
    async sendBatchEmails(req, res) {
        try {
            const batchData = req.body;

            // Validate batch data
            const validation = emailSendService.validateBatchEmailData(batchData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    error: 'Batch email validation failed',
                    details: validation.errors
                });
            }

            console.log(`📧 Sending batch of ${batchData.recipients.length} emails`);

            const result = await emailSendService.sendBatchEmailsWithTemplate(batchData);

            res.json({
                success: true,
                data: result,
                message: 'Batch emails sent successfully'
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

    /**
     * Send single email using template
     * POST /api/email/send
     */
    async sendSingleEmail(req, res) {
        try {
            const emailData = req.body;

            if (!emailData.templateId || !emailData.recipient) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID and recipient are required'
                });
            }

            console.log(`📧 Sending single email to ${emailData.recipient.customerEmail}`);

            const result = await emailSendService.sendSingleEmailWithTemplate(emailData);

            res.json({
                success: true,
                data: result,
                message: 'Email sent successfully'
            });

        } catch (error) {
            console.error('❌ Single email sending failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to send email',
                details: error.message
            });
        }
    }

    /**
     * Preview email template
     * POST /api/email/preview
     */
    async previewTemplate(req, res) {
        try {
            const { templateId, variables = {} } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`🔍 Previewing template ${templateId}`);

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
                error: 'Failed to preview template',
                details: error.message
            });
        }
    }

    /**
     * ✅ ADD: Process email queue
     * POST /api/email/process-queue
     */
    async processQueue(req, res) {
        try {
            const { batchSize = 50 } = req.body;

            console.log(`🔄 Processing email queue (batch size: ${batchSize})`);

            if (emailSendService.isQueueProcessing()) {
                return res.status(409).json({
                    success: false,
                    error: 'Queue processing is already in progress'
                });
            }

            const result = await emailSendService.processEmailQueue(parseInt(batchSize));

            res.json({
                success: true,
                data: result,
                message: 'Queue processing completed'
            });

        } catch (error) {
            console.error('❌ Queue processing failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Queue processing failed',
                details: error.message
            });
        }
    }

    /**
     * ✅ ADD: Get queue processing status
     * GET /api/email/queue-status
     */
    async getQueueStatus(req, res) {
        try {
            const isProcessing = emailSendService.isQueueProcessing();
            const serviceStatus = emailSendService.getStatus();

            res.json({
                success: true,
                data: {
                    queueProcessing: isProcessing,
                    serviceStatus: serviceStatus,
                    timestamp: new Date().toISOString()
                },
                message: 'Queue status retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get queue status:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve queue status',
                details: error.message
            });
        }
    }

    /**
     * Get batch send statistics
     * GET /api/email/batch/:batchId/stats
     */
    async getBatchStats(req, res) {
        try {
            const { batchId } = req.params;

            if (!batchId) {
                return res.status(400).json({
                    success: false,
                    error: 'Batch ID is required'
                });
            }

            console.log(`📊 Getting batch stats for ${batchId}`);

            const result = await emailSendService.getBatchSendStats(batchId);

            res.json({
                success: true,
                data: result,
                message: 'Batch statistics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get batch stats:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve batch statistics',
                details: error.message
            });
        }
    }

    /**
     * Test email sending capability
     * POST /api/email/test
     */
    async testEmailSending(req, res) {
        try {
            const { testEmail } = req.body;

            if (!testEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Test email address is required'
                });
            }

            console.log(`🧪 Testing email sending to ${testEmail}`);

            const result = await emailSendService.testEmailSending(testEmail);

            if (result.success) {
                res.json({
                    success: true,
                    data: result,
                    message: 'Test email sent successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Test email failed',
                    details: result
                });
            }

        } catch (error) {
            console.error('❌ Email test failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Email test failed',
                details: error.message
            });
        }
    }

    /**
     * Get email service status
     * GET /api/email/health
     */
    async getServiceHealth(req, res) {
        try {
            const status = emailSendService.getStatus();
            const isReady = emailSendService.isReady();

            res.json({
                success: true,
                data: {
                    ...status,
                    ready: isReady,
                    capabilities: {
                        batchSending: 'available',
                        templateRendering: 'available',
                        queueProcessing: 'available',
                        postmarkIntegration: status.postmarkConnected ? 'connected' : 'disconnected'
                    }
                },
                message: 'Email service health retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get service health:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve service health',
                details: error.message
            });
        }
    }
}

module.exports = new EmailController();