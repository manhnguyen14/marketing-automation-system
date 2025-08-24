class EmailTemplate {
    constructor(data = {}) {
        this.templateId = data.template_id || null;
        this.templateCode = data.template_code || '';
        this.name = data.name || '';
        this.subjectTemplate = data.subject_template || '';
        this.htmlTemplate = data.html_template || '';
        this.textTemplate = data.text_template || '';
        this.templateType = data.template_type || 'predefined';
        this.status = data.status || 'APPROVED';
        this.variation = data.variation || '';
        this.prompt = data.prompt || '';
        this.requiredVariables = data.required_variables || [];
        this.category = data.category || '';
        this.createdAt = data.created_at || null;
        this.updatedAt = data.updated_at || null;
    }

    // Status checking methods
    isApproved() {
        return this.status === 'APPROVED';
    }

    isWaitingReview() {
        return this.status === 'WAIT_REVIEW';
    }

    isInactive() {
        return this.status === 'INACTIVE';
    }

    isReadyToUse() {
        return this.isApproved();
    }

    // Template type methods
    isPredefined() {
        return this.templateType === 'predefined';
    }

    isAIGenerated() {
        return this.templateType === 'ai_generated';
    }

    // Variable extraction and validation
    extractVariablesFromTemplate() {
        const variablePattern = /\{\{([^}]+)\}\}/g;
        const variables = new Set();

        // Extract from subject template
        let match;
        while ((match = variablePattern.exec(this.subjectTemplate)) !== null) {
            variables.add(match[1].trim());
        }

        // Extract from HTML template
        variablePattern.lastIndex = 0;
        while ((match = variablePattern.exec(this.htmlTemplate)) !== null) {
            variables.add(match[1].trim());
        }

        // Extract from text template if exists
        if (this.textTemplate) {
            variablePattern.lastIndex = 0;
            while ((match = variablePattern.exec(this.textTemplate)) !== null) {
                variables.add(match[1].trim());
            }
        }

        return Array.from(variables);
    }

    validateRequiredVariables() {
        const templateVariables = this.extractVariablesFromTemplate();
        const requiredVars = this.requiredVariables || [];

        // Check if all required variables are present in templates
        const missingFromTemplate = requiredVars.filter(
            reqVar => !templateVariables.includes(reqVar)
        );

        // Check if template has variables not marked as required
        const notMarkedRequired = templateVariables.filter(
            templateVar => !requiredVars.includes(templateVar)
        );

        return {
            isValid: missingFromTemplate.length === 0,
            missingFromTemplate,
            notMarkedRequired,
            allTemplateVariables: templateVariables
        };
    }

    // Template processing methods
    processTemplate(templateContent, variables = {}) {
        const variablePattern = /\{\{([^}]+)\}\}/g;

        return templateContent.replace(variablePattern, (match, variableName) => {
            const trimmedName = variableName.trim();
            return variables[trimmedName] !== undefined ? variables[trimmedName] : match;
        });
    }

    renderSubject(variables = {}) {
        return this.processTemplate(this.subjectTemplate, variables);
    }

    renderHtml(variables = {}) {
        return this.processTemplate(this.htmlTemplate, variables);
    }

    renderText(variables = {}) {
        if (!this.textTemplate) return '';
        return this.processTemplate(this.textTemplate, variables);
    }

    renderComplete(variables = {}) {
        return {
            subject: this.renderSubject(variables),
            html: this.renderHtml(variables),
            text: this.renderText(variables),
            variablesUsed: variables
        };
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.name || this.name.trim().length === 0) {
            errors.push('Template name is required');
        }

        if (!this.templateCode || this.templateCode.trim().length === 0) {
            errors.push('Template code is required');
        }

        if (this.templateCode && this.templateCode.length > 100) {
            errors.push('Template code must be less than 100 characters');
        }

        if (this.templateCode && !/^[a-zA-Z0-9_-]+$/.test(this.templateCode)) {
            errors.push('Template code can only contain letters, numbers, underscores, and hyphens');
        }

        if (!this.subjectTemplate || this.subjectTemplate.trim().length === 0) {
            errors.push('Subject template is required');
        }

        if (!this.htmlTemplate || this.htmlTemplate.trim().length === 0) {
            errors.push('HTML template is required');
        }

        if (!['predefined', 'ai_generated'].includes(this.templateType)) {
            errors.push('Template type must be predefined or ai_generated');
        }

        if (!['APPROVED', 'WAIT_REVIEW', 'INACTIVE'].includes(this.status)) {
            errors.push('Status must be APPROVED, WAIT_REVIEW, or INACTIVE');
        }

        if (this.subjectTemplate.length > 255) {
            errors.push('Subject template must be less than 255 characters');
        }

        if (this.htmlTemplate.length > 1000000) {
            errors.push('HTML template must be less than 1MB');
        }

        // Validate variable consistency
        const variableValidation = this.validateRequiredVariables();
        if (!variableValidation.isValid) {
            errors.push(`Missing required variables in template: ${variableValidation.missingFromTemplate.join(', ')}`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    validateVariableValues(variables = {}) {
        const errors = [];
        const requiredVars = this.requiredVariables || [];

        // Check if all required variables are provided
        for (const reqVar of requiredVars) {
            if (variables[reqVar] === undefined || variables[reqVar] === null || variables[reqVar] === '') {
                errors.push(`Required variable '${reqVar}' is missing or empty`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            template_id: this.templateId,
            template_code: this.templateCode,
            name: this.name,
            subject_template: this.subjectTemplate,
            html_template: this.htmlTemplate,
            text_template: this.textTemplate,
            template_type: this.templateType,
            status: this.status,
            variation: this.variation,
            prompt: this.prompt,
            required_variables: this.requiredVariables,
            category: this.category,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    toJSON() {
        return {
            templateId: this.templateId,
            templateCode: this.templateCode,
            name: this.name,
            subjectTemplate: this.subjectTemplate,
            htmlTemplate: this.htmlTemplate,
            textTemplate: this.textTemplate,
            templateType: this.templateType,
            status: this.status,
            variation: this.variation,
            prompt: this.prompt,
            requiredVariables: this.requiredVariables,
            category: this.category,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            isApproved: this.isApproved(),
            isReadyToUse: this.isReadyToUse(),
            isPredefined: this.isPredefined(),
            isAIGenerated: this.isAIGenerated(),
            templateVariables: this.extractVariablesFromTemplate()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new EmailTemplate(row);
    }

    static create(templateData) {
        const template = new EmailTemplate(templateData);
        const validation = template.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return template;
    }

    // Update methods
    update(updateData) {
        const allowedFields = [
            'name', 'subject_template', 'html_template', 'text_template',
            'status', 'variation', 'prompt', 'required_variables', 'category'
        ];
        // Note: template_code is NOT in allowedFields - it cannot be updated after creation

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key === 'required_variables') {
                    this.requiredVariables = updateData[key] || [];
                } else {
                    this[this._camelCase(key)] = updateData[key];
                }
            }
        });

        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
    }

    // Business logic methods
    canBeUsedForSending() {
        return this.isApproved() && this.htmlTemplate.trim().length > 0;
    }

    getTemplateInfo() {
        return {
            id: this.templateId,
            code: this.templateCode,
            name: this.name,
            type: this.templateType,
            status: this.status,
            category: this.category,
            variableCount: this.extractVariablesFromTemplate().length,
            hasTextVersion: !!this.textTemplate,
            canUse: this.canBeUsedForSending()
        };
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Static helper methods
    static getValidStatuses() {
        return ['APPROVED', 'WAIT_REVIEW', 'INACTIVE'];
    }

    static getValidTypes() {
        return ['predefined', 'ai_generated'];
    }

    static createPredefinedTemplate(templateData) {
        const data = {
            ...templateData,
            template_type: 'predefined',
            status: 'APPROVED'
        };
        return EmailTemplate.create(data);
    }

    static createAITemplate(templateData) {
        const data = {
            ...templateData,
            template_type: 'ai_generated',
            status: 'WAIT_REVIEW'
        };
        return EmailTemplate.create(data);
    }
}

module.exports = EmailTemplate;