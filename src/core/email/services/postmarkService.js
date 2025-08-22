const postmark = require('postmark');
const config = require('../../../config');

class PostmarkService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
    }

    initialize() {
        if (!config.external.postmarkToken) {
            throw new Error('Postmark token not configured');
        }

        this.client = new postmark.ServerClient(config.external.postmarkToken);
        this.isInitialized = true;
        console.log('✅ Postmark service initialized');
    }

    getClient() {
        if (!this.isInitialized) {
            this.initialize();
        }
        return this.client;
    }

    // Test connection to Postmark API
    async testConnection() {
        try {
            const client = this.getClient();
            await client.getServer();
            return {
                connected: true,
                service: 'Postmark',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                service: 'Postmark',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Send single email
    async sendEmail(emailData) {
        try {
            const client = this.getClient();

            const message = {
                From: emailData.from || config.email?.postmark?.fromEmail || 'noreply@company.com',
                To: emailData.to,
                Subject: emailData.subject,
                HtmlBody: emailData.htmlBody,
                TextBody: emailData.textBody || null,
                Tag: emailData.tag || null,
                Metadata: emailData.metadata || null
            };

            // Add optional fields if provided
            if (emailData.cc && emailData.cc.length > 0) {
                message.Cc = emailData.cc.join(',');
            }

            if (emailData.bcc && emailData.bcc.length > 0) {
                message.Bcc = emailData.bcc.join(',');
            }

            if (emailData.replyTo) {
                message.ReplyTo = emailData.replyTo;
            }

            console.log(`📧 Sending email to: ${emailData.to}`);
            const response = await client.sendEmail(message);
            console.log(`✅ Email sent successfully - Message ID: ${response.MessageID}`);

            return {
                success: true,
                messageId: response.MessageID,
                to: response.To,
                submittedAt: response.SubmittedAt,
                errorCode: response.ErrorCode || 0,
                message: response.Message || 'Email sent successfully',
                fullResponse: response
            };
        } catch (error) {
            console.error(`❌ Email sending failed:`, error.message);

            return {
                success: false,
                messageId: null,
                errorCode: error.code || 'UNKNOWN_ERROR',
                message: error.message || 'Unknown error occurred',
                fullResponse: error
            };
        }
    }

    // Send batch emails with single API call
    async sendBatchEmails(emails) {
        try {
            const client = this.getClient();

            const messages = emails.map(emailData => {
                const message = {
                    From: emailData.from || config.email?.postmark?.fromEmail || 'noreply@company.com',
                    To: emailData.to,
                    Subject: emailData.subject,
                    HtmlBody: emailData.htmlBody,
                    TextBody: emailData.textBody || null,
                    Tag: emailData.tag || null,
                    Metadata: emailData.metadata || null
                };

                // Add optional fields if provided
                if (emailData.cc && emailData.cc.length > 0) {
                    message.Cc = emailData.cc.join(',');
                }

                if (emailData.bcc && emailData.bcc.length > 0) {
                    message.Bcc = emailData.bcc.join(',');
                }

                if (emailData.replyTo) {
                    message.ReplyTo = emailData.replyTo;
                }

                return message;
            });

            console.log(`📧 Sending batch of ${emails.length} emails`);
            const responses = await client.sendEmailBatch(messages);
            console.log(`✅ Batch email completed - Responses: ${responses.length}`);

            return {
                success: true,
                totalEmails: emails.length,
                responses: responses.map((response, index) => ({
                    success: response.ErrorCode === 0,
                    messageId: response.MessageID,
                    to: response.To,
                    submittedAt: response.SubmittedAt,
                    errorCode: response.ErrorCode || 0,
                    message: response.Message || 'Email sent successfully',
                    originalIndex: index,
                    fullResponse: response
                }))
            };
        } catch (error) {
            console.error(`❌ Batch email sending failed:`, error.message);

            return {
                success: false,
                totalEmails: emails.length,
                error: error.message,
                fullResponse: error
            };
        }
    }

    // Send emails with rate limiting and retry logic
    async sendEmailsWithRateLimit(emails, batchSize = null) {
        const actualBatchSize = batchSize || config.scheduler?.emailBatchSize || 50;
        const results = {
            totalEmails: emails.length,
            successCount: 0,
            failureCount: 0,
            batches: [],
            errors: []
        };

        // Split emails into batches
        const batches = [];
        for (let i = 0; i < emails.length; i += actualBatchSize) {
            batches.push(emails.slice(i, i + actualBatchSize));
        }

        console.log(`📧 Processing ${emails.length} emails in ${batches.length} batches`);

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

            try {
                const batchResult = await this.sendBatchEmails(batch);

                if (batchResult.success) {
                    results.successCount += batchResult.responses.filter(r => r.success).length;
                    results.failureCount += batchResult.responses.filter(r => !r.success).length;
                } else {
                    results.failureCount += batch.length;
                    results.errors.push({
                        batch: batchIndex + 1,
                        error: batchResult.error || 'Batch processing failed'
                    });
                }

                results.batches.push({
                    batchIndex: batchIndex + 1,
                    emailCount: batch.length,
                    result: batchResult
                });

                // Rate limiting delay between batches (avoid hitting API limits)
                if (batchIndex < batches.length - 1) {
                    await this.delay(1000); // 1 second delay between batches
                }

            } catch (error) {
                console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
                results.failureCount += batch.length;
                results.errors.push({
                    batch: batchIndex + 1,
                    error: error.message
                });
            }
        }

        console.log(`✅ Batch processing completed - Success: ${results.successCount}, Failed: ${results.failureCount}`);
        return results;
    }

    // Get email delivery statistics from Postmark
    async getDeliveryStats(messageId) {
        try {
            const client = this.getClient();
            const stats = await client.getOutboundMessageDetails(messageId);

            return {
                success: true,
                messageId: messageId,
                status: stats.Status,
                tag: stats.Tag,
                submittedAt: stats.SubmittedAt,
                to: stats.Recipients || [],
                details: stats
            };
        } catch (error) {
            console.error(`❌ Failed to get delivery stats for ${messageId}:`, error.message);
            return {
                success: false,
                messageId: messageId,
                error: error.message
            };
        }
    }

    // Get email tracking events (opens, clicks, bounces)
    async getEmailEvents(messageId) {
        try {
            const client = this.getClient();

            // Get various types of events for the message
            const [opens, clicks, bounces] = await Promise.all([
                this.getOpens(messageId),
                this.getClicks(messageId),
                this.getBounces(messageId)
            ]);

            return {
                success: true,
                messageId: messageId,
                events: {
                    opens: opens.success ? opens.data : [],
                    clicks: clicks.success ? clicks.data : [],
                    bounces: bounces.success ? bounces.data : []
                }
            };
        } catch (error) {
            console.error(`❌ Failed to get email events for ${messageId}:`, error.message);
            return {
                success: false,
                messageId: messageId,
                error: error.message
            };
        }
    }

    // Get email opens
    async getOpens(messageId) {
        try {
            const client = this.getClient();
            const opens = await client.getOutboundOpens({
                messageId: messageId,
                count: 50
            });

            return {
                success: true,
                data: opens.Opens || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get email clicks
    async getClicks(messageId) {
        try {
            const client = this.getClient();
            const clicks = await client.getOutboundClicks({
                messageId: messageId,
                count: 50
            });

            return {
                success: true,
                data: clicks.Clicks || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get email bounces
    async getBounces(messageId) {
        try {
            const client = this.getClient();
            const bounces = await client.getBounces({
                messageId: messageId,
                count: 50
            });

            return {
                success: true,
                data: bounces.Bounces || []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Validate email addresses using Postmark
    async validateEmailAddress(email) {
        try {
            // Basic email format validation first
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return {
                    valid: false,
                    email: email,
                    error: 'Invalid email format'
                };
            }

            // For now, return basic validation
            // Postmark doesn't have a direct email validation API
            return {
                valid: true,
                email: email,
                message: 'Email format is valid'
            };
        } catch (error) {
            return {
                valid: false,
                email: email,
                error: error.message
            };
        }
    }

    // Get server information
    async getServerInfo() {
        try {
            const client = this.getClient();
            const serverInfo = await client.getServer();

            return {
                success: true,
                serverInfo: {
                    id: serverInfo.ID,
                    name: serverInfo.Name,
                    color: serverInfo.Color,
                    smtpApiActivated: serverInfo.SmtpApiActivated,
                    rawEmailEnabled: serverInfo.RawEmailEnabled,
                    inboundAddress: serverInfo.InboundAddress,
                    bounceHookUrl: serverInfo.BounceHookUrl,
                    openHookUrl: serverInfo.OpenHookUrl,
                    clickHookUrl: serverInfo.ClickHookUrl
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Format email data for Postmark API
    formatEmailForPostmark(emailData) {
        return {
            from: emailData.from || config.email?.postmark?.fromEmail || 'noreply@company.com',
            to: emailData.to,
            subject: emailData.subject,
            htmlBody: emailData.htmlBody || emailData.html,
            textBody: emailData.textBody || emailData.text,
            tag: emailData.tag,
            metadata: emailData.metadata,
            cc: emailData.cc,
            bcc: emailData.bcc,
            replyTo: emailData.replyTo
        };
    }

    // Generate tracking data summary
    generateTrackingDataSummary(postmarkResponse) {
        return {
            messageId: postmarkResponse.MessageID,
            to: postmarkResponse.To,
            submittedAt: postmarkResponse.SubmittedAt,
            errorCode: postmarkResponse.ErrorCode || 0,
            message: postmarkResponse.Message || 'Email processed',
            success: (postmarkResponse.ErrorCode || 0) === 0
        };
    }
}

module.exports = new PostmarkService();