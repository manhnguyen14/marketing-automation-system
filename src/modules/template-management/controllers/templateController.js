const emailTemplateService = require('../../../core/database/services/emailTemplateService');

class TemplateController {
    // Get all templates with filtering
    async getAllTemplates(req, res) {
        try {
            const {
                status,
                templateType,
                category,
                limit = 50,
                offset = 0
            } = req.query;

            console.log('📋 Retrieving email templates with filters');

            const templates = await emailTemplateService.getAllTemplates({
                status,
                templateType,
                category,
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            const totalCount = await emailTemplateService.getTemplateCount({
                status,
                templateType,
                category
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
                    },
                    filters: {
                        status,
                        templateType,
                        category
                    }
                },
                message: 'Templates retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get templates:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve templates',
                details: error.message
            });
        }
    }

    // Create new template
    async createTemplate(req, res) {
        try {
            const {
                name,
                subjectTemplate,
                htmlTemplate,
                textTemplate,
                templateType = 'predefined',
                status = 'APPROVED',
                variation,
                prompt,
                requiredVariables = [],
                category
            } = req.body;

            // Validate required fields
            if (!name || !subjectTemplate || !htmlTemplate) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, subject template, and HTML template are required'
                });
            }

            console.log(`📝 Creating new email template: ${name}`);

            const templateData = {
                name,
                subject_template: subjectTemplate,
                html_template: htmlTemplate,
                text_template: textTemplate,
                template_type: templateType,
                status,
                variation,
                prompt,
                required_variables: requiredVariables,
                category
            };

            const template = await emailTemplateService.createTemplate(templateData);

            res.status(201).json({
                success: true,
                data: template.toJSON(),
                message: 'Template created successfully'
            });

        } catch (error) {
            console.error('❌ Template creation failed:', error.message);

            if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    error: 'Template name already exists',
                    details: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create template',
                    details: error.message
                });
            }
        }
    }

    // Get template by ID
    async getTemplateById(req, res) {
        try {
            const { templateId } = req.params;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`📄 Retrieving template: ${templateId}`);

            const template = await emailTemplateService.getTemplateById(templateId);

            if (!template) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            // Get usage statistics
            const usageStats = await emailTemplateService.getTemplateUsageStats(templateId);

            res.json({
                success: true,
                data: {
                    template: template.toJSON(),
                    usageStats: usageStats
                },
                message: 'Template retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get template:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve template',
                details: error.message
            });
        }
    }

    // Update template
    async updateTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const updateData = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`✏️  Updating template: ${templateId}`);

            // Convert camelCase to snake_case for database
            const dbUpdateData = {};
            const fieldMapping = {
                name: 'name',
                subjectTemplate: 'subject_template',
                htmlTemplate: 'html_template',
                textTemplate: 'text_template',
                status: 'status',
                variation: 'variation',
                prompt: 'prompt',
                requiredVariables: 'required_variables',
                category: 'category'
            };

            Object.keys(updateData).forEach(key => {
                if (fieldMapping[key]) {
                    dbUpdateData[fieldMapping[key]] = updateData[key];
                }
            });

            const updatedTemplate = await emailTemplateService.updateTemplate(templateId, dbUpdateData);

            res.json({
                success: true,
                data: updatedTemplate.toJSON(),
                message: 'Template updated successfully'
            });

        } catch (error) {
            console.error('❌ Template update failed:', error.message);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            } else if (error.message.includes('already exists')) {
                res.status(409).json({
                    success: false,
                    error: 'Template name already exists',
                    details: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update template',
                    details: error.message
                });
            }
        }
    }

    // Delete template
    async deleteTemplate(req, res) {
        try {
            const { templateId } = req.params;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`🗑️  Deleting template: ${templateId}`);

            const deletedTemplate = await emailTemplateService.deleteTemplate(templateId);

            res.json({
                success: true,
                data: deletedTemplate.toJSON(),
                message: 'Template deleted successfully'
            });

        } catch (error) {
            console.error('❌ Template deletion failed:', error.message);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            } else if (error.message.includes('used in email campaigns')) {
                res.status(409).json({
                    success: false,
                    error: 'Cannot delete template that has been used in campaigns',
                    details: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to delete template',
                    details: error.message
                });
            }
        }
    }

    // Update template status (approve/reject)
    async updateTemplateStatus(req, res) {
        try {
            const { templateId } = req.params;
            const { status } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            if (!status) {
                return res.status(400).json({
                    success: false,
                    error: 'Status is required'
                });
            }

            const validStatuses = ['APPROVED', 'WAIT_REVIEW', 'INACTIVE'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                });
            }

            console.log(`📝 Updating template status: ${templateId} -> ${status}`);

            const updatedTemplate = await emailTemplateService.updateTemplateStatus(templateId, status);

            res.json({
                success: true,
                data: updatedTemplate.toJSON(),
                message: `Template status updated to ${status}`
            });

        } catch (error) {
            console.error('❌ Template status update failed:', error.message);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to update template status',
                    details: error.message
                });
            }
        }
    }

    // Get templates waiting for review
    async getTemplatesWaitingReview(req, res) {
        try {
            console.log('📋 Retrieving templates waiting for review');

            const templates = await emailTemplateService.getTemplatesWaitingReview();

            res.json({
                success: true,
                data: {
                    templates: templates.map(template => template.toJSON()),
                    count: templates.length
                },
                message: 'Templates waiting for review retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get templates waiting for review:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve templates waiting for review',
                details: error.message
            });
        }
    }

    // Preview template with variables
    async previewTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const { variables = {} } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    error: 'Template ID is required'
                });
            }

            console.log(`🔍 Generating template preview: ${templateId}`);

            const preview = await emailTemplateService.previewTemplate(templateId, variables);

            res.json({
                success: true,
                data: preview,
                message: 'Template preview generated successfully'
            });

        } catch (error) {
            console.error('❌ Template preview failed:', error.message);

            if (error.message.includes('not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Failed to generate template preview',
                    details: error.message
                });
            }
        }
    }

    // Search templates
    async searchTemplates(req, res) {
        try {
            const { q: searchTerm, status, templateType, category, limit = 50 } = req.query;

            if (!searchTerm) {
                return res.status(400).json({
                    success: false,
                    error: 'Search term (q) is required'
                });
            }

            console.log(`🔍 Searching templates for: ${searchTerm}`);

            const templates = await emailTemplateService.searchTemplates(searchTerm, {
                status,
                templateType,
                category,
                limit: parseInt(limit)
            });

            res.json({
                success: true,
                data: {
                    templates: templates.map(template => template.toJSON()),
                    searchTerm,
                    count: templates.length,
                    filters: {
                        status,
                        templateType,
                        category
                    }
                },
                message: 'Template search completed successfully'
            });

        } catch (error) {
            console.error('❌ Template search failed:', error.message);
            res.status(500).json({
                success: false,
                error: 'Template search failed',
                details: error.message
            });
        }
    }

    // Get template categories
    async getTemplateCategories(req, res) {
        try {
            console.log('📂 Retrieving template categories');

            const categories = await emailTemplateService.getTemplateCategories();

            res.json({
                success: true,
                data: {
                    categories: categories
                },
                message: 'Template categories retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get template categories:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve template categories',
                details: error.message
            });
        }
    }

    // Get template statistics
    async getTemplateStats(req, res) {
        try {
            console.log('📊 Retrieving template statistics');

            const stats = await emailTemplateService.getTemplateStats();

            res.json({
                success: true,
                data: {
                    statistics: stats
                },
                message: 'Template statistics retrieved successfully'
            });

        } catch (error) {
            console.error('❌ Failed to get template statistics:', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve template statistics',
                details: error.message
            });
        }
    }
}

module.exports = new TemplateController();