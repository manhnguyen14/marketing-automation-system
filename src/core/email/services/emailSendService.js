const postmarkService = require('./postmarkService');
const emailTemplateService = require('../../database/services/emailTemplateService');
const emailRecordService = require('../../database/services/emailRecordService');
const customerService = require('../../database/services/customerService');
const config = require('../../../config');

class EmailSendService {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        try {
            postmarkService.initialize();
            this.isInitialized = true;
            console.log('✅ Email send service initialized');
        } catch (error) {
            console.error('❌ Email send service initialization failed:', error.message);
            throw error;
        }
    }

    // Send batch emails using template and recipient data
    async sendBatchEmailsWithTemplate(batchData) {
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
            } = batchData;

            // Validate template
            const template = await emailTemplateService.getTemplateById(templateId);
            if (!template) {
                throw new Error(`Template with ID ${templateId} not found`);
            }

            if (!template.canBeUsedForSending()) {
                throw new Error(`Template ${template.name} is not approved for sending`);
            }

            // Generate batch ID for tracking
            const batchId = this.generateBatchId(campaignId);

            // Process recipients and prepare emails
            const emailsToSend = [];
            const emailRecordsToCreate = [];

            for (const recipient of recipients) {
                try {
                    // Validate recipient data
                    if (!recipient.customerEmail) {
                        throw new Error('Customer email is required');
                    }

                    // Get customer information
                    const customer = await customerService.getCustomerByEmail(recipient.customerEmail);
                    if (!customer) {
                        throw new Error(`Customer not found: ${recipient.customerEmail}`);
                    }

                    // Validate template variables
                    const variableValidation = template.validateVariableValues(recipient.variables || {});
                    if (!variableValidation.isValid) {
                        throw new Error(`Variable validation failed: ${variableValidation.errors.join(', ')}`);
                    }

                    // Render template with variables
                    const renderedContent = template.renderComplete(recipient.variables || {});

                    // Prepare email for Postmark
                    const emailData = {
                        to: recipient.customerEmail,
                        subject: renderedContent.subject,
                        htmlBody: renderedContent.html,
                        textBody: renderedContent.text,
                        tag: tagString,
                        metadata: {
                            ...metadata,
                            customerId: customer.customerId,
                            templateId: templateId,
                            campaignId: campaignId,
                            batchId: batchId
                        },
                        cc: ccEmails,
                        bcc: bccEmails,
                        replyTo: replyTo
                    };

                    emailsToSend.push(emailData);

                    // Prepare email record for database
                    const emailRecord = {
                        recipient_id: customer.customerId,
                        email_address: recipient.customerEmail,
                        subject: renderedContent.subject,
                        content_type: template.templateType,
                        template_id: templateId,
                        campaign_id: campaignId,
                        processed_html_content: renderedContent.html,
                        processed_text_content: renderedContent.text,
                        variables_used: recipient.variables || {},
                        cc_emails: ccEmails.length > 0 ? ccEmails : null,
                        bcc_emails: bccEmails.length > 0 ? bccEmails : null,
                        reply_to: replyTo,
                        tag_string: tagString,
                        metadata: metadata,
                        batch_id: batchId,
                        pipeline_id: campaignId || 'email_send_service'
                    };

                    emailRecordsToCreate.push(emailRecord);

                } catch (error) {
                    console.error(`❌ Failed to process recipient ${recipient.customerEmail}:`, error.message);
                    // Continue with other recipients, collect errors at the end
                }
            }

            if (emailsToSend.length === 0) {
                throw new Error('No valid emails to send after processing recipients');
            }

            // Create email records in database first
            console.log(`📝 Creating ${emailRecordsToCreate.length} email records in database`);
            const recordsResult = await emailRecordService.bulkCreateEmailRecords(emailRecordsToCreate);

            if (recordsResult.failed > 0) {
                console.warn(`⚠️ Failed to create ${recordsResult.failed} email records`);
            }

            // Send emails via Postmark
            console.log(`📧 Sending ${emailsToSend.length} emails via Postmark`);
            const sendResult = await postmarkService.sendBatchEmails(emailsToSend);

            // Update email records with Postmark responses
            if (sendResult.success && sendResult.responses) {
                await this.updateEmailRecordsWithPostmarkResponses(
                    recordsResult.emailIds,
                    sendResult.responses
                );
            }

            return {
                success: true,
                batchId: batchId,
                templateId: templateId,
                campaignId: campaignId,
                totalEmails: recipients.length,
                processedEmails: emailsToSend.length,
                successCount: sendResult.success ? sendResult.responses.filter(r => r.success).length : 0,
                failureCount: sendResult.success ? sendResult.responses.filter(r => !r.success).length : emailsToSend.length,
                databaseRecords: {
                    created: recordsResult.created,
                    failed: recordsResult.failed
                },
                postmarkResult: sendResult,
                emails: recordsResult.emailIds.map((emailId, index) => {
                    const response = sendResult.responses?.[index];
                    return {
                        emailId: emailId,
                        customerEmail: emailsToSend[index]?.to,
                        postmarkMessageId: response?.messageId,
                        status: response?.success ? 'Sent' : 'Failed',
                        submittedAt: response?.submittedAt
                    };
                })
            };

        } catch (error) {
            console.error('❌ Batch email sending failed:', error.message);
            throw error;
        }
    }

    // Send single email using template
    async sendSingleEmailWithTemplate(emailData) {
        const batchData = {
            ...emailData,
            recipients: [emailData.recipient]
        };

        const result = await this.sendBatchEmailsWithTemplate(batchData);

        return {
            ...result,
            email: result.emails?.[0] || null
        };
    }

    // Preview template rendering without sending
    async previewEmailTemplate(templateId, variables = {}) {
        try {
            const template = await emailTemplateService.getTemplateById(templateId);
            if (!template) {
                throw new Error(`Template with ID ${templateId} not found`);
            }

            // Validate variables
            const variableValidation = template.validateVariableValues(variables);
            if (!variableValidation.isValid) {
                return {
                    success: false,
                    errors: variableValidation.errors,
                    template: template.toJSON()
                };
            }

            // Render template
            const renderedContent = template.renderComplete(variables);

            return {
                success: true,
                templateId: templateId,
                templateName: template.name,
                variables: variables,
                renderedContent: renderedContent,
                template: template.toJSON()
            };

        } catch (error) {
            console.error('❌ Template preview failed:', error.message);
            throw error;
        }
    }

    // Update email records with Postmark API responses
    async updateEmailRecordsWithPostmarkResponses(emailIds, postmarkResponses) {
        try {
            for (let i = 0; i < emailIds.length && i < postmarkResponses.length; i++) {
                const emailId = emailIds[i];
                const response = postmarkResponses[i];

                if (emailId && response) {
                    await emailRecordService.updatePostmarkResponse(emailId, response.fullResponse);
                }
            }
            console.log(`✅ Updated ${Math.min(emailIds.length, postmarkResponses.length)} email records with Postmark responses`);
        } catch (error) {
            console.error('❌ Failed to update email records with Postmark responses:', error.message);
            // Don't throw error here as emails were already sent
        }
    }

    // Validate batch email data
    validateBatchEmailData(batchData) {
        const errors = [];

        if (!batchData.templateId) {
            errors.push('Template ID is required');
        }

        if (!batchData.recipients || !Array.isArray(batchData.recipients) || batchData.recipients.length === 0) {
            errors.push('Recipients array is required and must not be empty');
        }

        if (batchData.recipients && batchData.recipients.length > (config.email?.batch?.maxRecipients || 500)) {
            errors.push(`Too many recipients. Maximum allowed: ${config.email?.batch?.maxRecipients || 500}`);
        }

        // Validate each recipient
        if (batchData.recipients) {
            batchData.recipients.forEach((recipient, index) => {
                if (!recipient.customerEmail) {
                    errors.push(`Recipient ${index + 1}: customerEmail is required`);
                }

                if (recipient.customerEmail && !this.isValidEmail(recipient.customerEmail)) {
                    errors.push(`Recipient ${index + 1}: invalid email format`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Email format validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Generate unique batch ID
    generateBatchId(campaignId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `batch_${campaignId || 'default'}_${timestamp}_${random}`;
    }

    // Get batch send statistics
    async getBatchSendStats(batchId) {
        try {
            const metrics = await emailRecordService.getBatchMetrics(batchId);
            const emails = await emailRecordService.getEmailsByBatch(batchId);

            return {
                success: true,
                batchId: batchId,
                metrics: metrics,
                emails: emails.map(email => ({
                    emailId: email.emailId,
                    customerEmail: email.emailAddress,
                    status: email.deliveryStatus,
                    postmarkMessageId: email.postmarkMessageId,
                    sentAt: email.sentAt,
                    openedAt: email.openedAt,
                    clickedAt: email.clickedAt
                }))
            };
        } catch (error) {
            console.error(`❌ Failed to get batch stats for ${batchId}:`, error.message);
            throw error;
        }
    }

    // Test email sending capability
    async testEmailSending(testEmail) {
        try {
            const testData = {
                to: testEmail,
                subject: 'Email Service Test',
                htmlBody: '<h1>Test Email</h1><p>This is a test email from the Marketing Automation System.</p>',
                textBody: 'Test Email\n\nThis is a test email from the Marketing Automation System.',
                tag: 'system_test'
            };

            const result = await postmarkService.sendEmail(testData);

            return {
                success: result.success,
                messageId: result.messageId,
                message: result.message,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ Email sending test failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Get service status
    getStatus() {
        return {
            initialized: this.isInitialized,
            postmarkConnected: postmarkService.isInitialized,
            timestamp: new Date().toISOString()
        };
    }

    // Utility method to check if service is ready
    isReady() {
        return this.isInitialized && postmarkService.isInitialized;
    }
}

module.exports = new EmailSendService();