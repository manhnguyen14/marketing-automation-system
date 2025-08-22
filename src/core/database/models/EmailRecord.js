class EmailRecord {
    constructor(data = {}) {
        this.emailId = data.email_id || null;
        this.jobId = data.job_id || null;
        this.pipelineId = data.pipeline_id || '';
        this.recipientId = data.recipient_id || null;
        this.emailAddress = data.email_address || '';
        this.subject = data.subject || '';
        this.contentType = data.content_type || 'predefined';
        this.templateId = data.template_id || null; // ✅ UPDATE: Changed from string to null

        // ✅ ADD: New fields for Postmark integration
        this.campaignId = data.campaign_id || null;
        this.processedHtmlContent = data.processed_html_content || null;
        this.processedTextContent = data.processed_text_content || null;
        this.variablesUsed = data.variables_used || null;
        this.ccEmails = data.cc_emails || null;
        this.bccEmails = data.bcc_emails || null;
        this.replyTo = data.reply_to || null;
        this.tagString = data.tag_string || null;
        this.metadata = data.metadata || null;
        this.batchId = data.batch_id || null;

        // ✅ ADD: Postmark response fields
        this.errorCode = data.error_code || null;
        this.errorMessage = data.error_message || null;
        this.postmarkResponseData = data.postmark_response_data || null;
        this.submittedAt = data.submitted_at || null;

        // Existing fields
        this.postmarkMessageId = data.postmark_message_id || '';
        this.sentAt = data.sent_at || null;
        this.deliveryStatus = data.delivery_status || '';
        this.openedAt = data.opened_at || null;
        this.clickedAt = data.clicked_at || null;
        this.bouncedAt = data.bounced_at || null;
        this.createdAt = data.created_at || null;
    }

    // Status checking methods
    isSent() {
        return this.sentAt !== null;
    }

    isDelivered() {
        return this.deliveryStatus === 'delivered';
    }

    isOpened() {
        return this.openedAt !== null;
    }

    isClicked() {
        return this.clickedAt !== null;
    }

    isBounced() {
        return this.bouncedAt !== null;
    }

    hasFailed() {
        return this.deliveryStatus === 'failed' || this.isBounced();
    }

    // ✅ ADD: New status checking methods
    isSubmitted() {
        return this.submittedAt !== null;
    }

    hasPostmarkError() {
        return this.errorCode !== null && this.errorCode !== 0;
    }

    // Content type methods
    isPredefinedTemplate() {
        return this.contentType === 'predefined';
    }

    isAIGenerated() {
        return this.contentType === 'ai_generated';
    }

    // ✅ ADD: Template-related methods
    hasTemplate() {
        return this.templateId !== null;
    }

    isProcessedContent() {
        return this.processedHtmlContent !== null;
    }

    // Engagement methods
    hasEngagement() {
        return this.isOpened() || this.isClicked();
    }

    getEngagementLevel() {
        if (this.isClicked()) return 'clicked';
        if (this.isOpened()) return 'opened';
        if (this.isDelivered()) return 'delivered';
        if (this.isSent()) return 'sent';
        if (this.isSubmitted()) return 'submitted';
        return 'pending';
    }

    // Time calculations
    getTimeToOpen() {
        if (!this.sentAt || !this.openedAt) return null;

        const sent = new Date(this.sentAt);
        const opened = new Date(this.openedAt);

        return opened.getTime() - sent.getTime();
    }

    getTimeToClick() {
        if (!this.sentAt || !this.clickedAt) return null;

        const sent = new Date(this.sentAt);
        const clicked = new Date(this.clickedAt);

        return clicked.getTime() - sent.getTime();
    }

    getTimeToOpenHours() {
        const timeToOpen = this.getTimeToOpen();
        return timeToOpen ? Math.round(timeToOpen / (1000 * 60 * 60 * 100)) / 100 : null;
    }

    // ✅ ADD: New time calculation methods
    getTimeToSubmit() {
        if (!this.createdAt || !this.submittedAt) return null;

        const created = new Date(this.createdAt);
        const submitted = new Date(this.submittedAt);

        return submitted.getTime() - created.getTime();
    }

    getTimeToDeliver() {
        if (!this.submittedAt || !this.sentAt) return null;

        const submitted = new Date(this.submittedAt);
        const delivered = new Date(this.sentAt);

        return delivered.getTime() - submitted.getTime();
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.pipelineId || this.pipelineId.trim().length === 0) {
            errors.push('Pipeline ID is required');
        }

        if (!this.recipientId) {
            errors.push('Recipient ID is required');
        }

        if (!this.emailAddress || this.emailAddress.trim().length === 0) {
            errors.push('Email address is required');
        } else if (!this.validateEmail()) {
            errors.push('Invalid email address format');
        }

        if (!['predefined', 'ai_generated'].includes(this.contentType)) {
            errors.push('Content type must be predefined or ai_generated');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(this.emailAddress);
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            email_id: this.emailId,
            job_id: this.jobId,
            pipeline_id: this.pipelineId,
            recipient_id: this.recipientId,
            email_address: this.emailAddress,
            subject: this.subject,
            content_type: this.contentType,
            template_id: this.templateId,
            campaign_id: this.campaignId, // ✅ ADD
            processed_html_content: this.processedHtmlContent, // ✅ ADD
            processed_text_content: this.processedTextContent, // ✅ ADD
            variables_used: this.variablesUsed, // ✅ ADD
            cc_emails: this.ccEmails, // ✅ ADD
            bcc_emails: this.bccEmails, // ✅ ADD
            reply_to: this.replyTo, // ✅ ADD
            tag_string: this.tagString, // ✅ ADD
            metadata: this.metadata, // ✅ ADD
            batch_id: this.batchId, // ✅ ADD
            error_code: this.errorCode, // ✅ ADD
            error_message: this.errorMessage, // ✅ ADD
            postmark_response_data: this.postmarkResponseData, // ✅ ADD
            submitted_at: this.submittedAt, // ✅ ADD
            postmark_message_id: this.postmarkMessageId,
            sent_at: this.sentAt,
            delivery_status: this.deliveryStatus,
            opened_at: this.openedAt,
            clicked_at: this.clickedAt,
            bounced_at: this.bouncedAt,
            created_at: this.createdAt
        };
    }

    toJSON() {
        return {
            emailId: this.emailId,
            jobId: this.jobId,
            pipelineId: this.pipelineId,
            recipientId: this.recipientId,
            emailAddress: this.emailAddress,
            subject: this.subject,
            contentType: this.contentType,
            templateId: this.templateId,
            campaignId: this.campaignId, // ✅ ADD
            processedHtmlContent: this.processedHtmlContent, // ✅ ADD
            processedTextContent: this.processedTextContent, // ✅ ADD
            variablesUsed: this.variablesUsed, // ✅ ADD
            ccEmails: this.ccEmails, // ✅ ADD
            bccEmails: this.bccEmails, // ✅ ADD
            replyTo: this.replyTo, // ✅ ADD
            tagString: this.tagString, // ✅ ADD
            metadata: this.metadata, // ✅ ADD
            batchId: this.batchId, // ✅ ADD
            errorCode: this.errorCode, // ✅ ADD
            errorMessage: this.errorMessage, // ✅ ADD
            postmarkResponseData: this.postmarkResponseData, // ✅ ADD
            submittedAt: this.submittedAt, // ✅ ADD
            postmarkMessageId: this.postmarkMessageId,
            sentAt: this.sentAt,
            deliveryStatus: this.deliveryStatus,
            openedAt: this.openedAt,
            clickedAt: this.clickedAt,
            bouncedAt: this.bouncedAt,
            createdAt: this.createdAt,
            isSent: this.isSent(),
            isDelivered: this.isDelivered(),
            isOpened: this.isOpened(),
            isClicked: this.isClicked(),
            isBounced: this.isBounced(),
            isSubmitted: this.isSubmitted(), // ✅ ADD
            hasPostmarkError: this.hasPostmarkError(), // ✅ ADD
            hasTemplate: this.hasTemplate(), // ✅ ADD
            engagementLevel: this.getEngagementLevel(),
            timeToOpenHours: this.getTimeToOpenHours()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new EmailRecord(row);
    }

    static create(emailData) {
        const email = new EmailRecord(emailData);
        const validation = email.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return email;
    }

    // Update methods
    updateDeliveryStatus(status, timestamp = new Date()) {
        this.deliveryStatus = status;

        if (status === 'delivered' && !this.sentAt) {
            this.sentAt = timestamp;
        }
    }

    markAsOpened(timestamp = new Date()) {
        this.openedAt = timestamp;
        if (!this.isDelivered()) {
            this.deliveryStatus = 'delivered';
        }
    }

    markAsClicked(timestamp = new Date()) {
        this.clickedAt = timestamp;
        if (!this.isOpened()) {
            this.openedAt = timestamp;
        }
        if (!this.isDelivered()) {
            this.deliveryStatus = 'delivered';
        }
    }

    markAsBounced(timestamp = new Date()) {
        this.bouncedAt = timestamp;
        this.deliveryStatus = 'bounced';
    }

    setPostmarkMessageId(messageId) {
        this.postmarkMessageId = messageId;
    }

    // ✅ ADD: New update methods for Postmark integration
    updatePostmarkResponse(response) {
        this.postmarkMessageId = response.MessageID || this.postmarkMessageId;
        this.errorCode = response.ErrorCode || 0;
        this.errorMessage = response.Message || null;
        this.postmarkResponseData = response;
        this.submittedAt = new Date();

        if (response.ErrorCode === 0) {
            this.deliveryStatus = 'sent';
            this.sentAt = new Date();
        } else {
            this.deliveryStatus = 'failed';
        }
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Static helper methods for reporting
    static getEngagementStages() {
        return ['submitted', 'sent', 'delivered', 'opened', 'clicked'];
    }

    static calculateEngagementRate(emails, stage) {
        const total = emails.length;
        if (total === 0) return 0;

        let count = 0;
        emails.forEach(email => {
            switch (stage) {
                case 'submitted':
                    if (email.isSubmitted()) count++;
                    break;
                case 'delivered':
                    if (email.isDelivered()) count++;
                    break;
                case 'opened':
                    if (email.isOpened()) count++;
                    break;
                case 'clicked':
                    if (email.isClicked()) count++;
                    break;
                default:
                    if (email.isSent()) count++;
            }
        });

        return (count / total) * 100;
    }

    // ✅ ADD: New helper methods
    static getDeliveryStatuses() {
        return ['pending', 'submitted', 'sent', 'delivered', 'failed', 'bounced'];
    }

    static getContentTypes() {
        return ['predefined', 'ai_generated'];
    }
}

module.exports = EmailRecord;