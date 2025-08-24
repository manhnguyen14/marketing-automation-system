const pipelineOrchestrator = require('../../../core/pipeline/services/pipelineOrchestrator');
const templateGenerationService = require('../../../core/pipeline/services/templateGenerationService');
const PipelineRegistry = require('../../../core/pipeline/services/pipelineRegistry');

class PipelineUIController {
    /**
     * Show pipeline.js management dashboard
     * GET /admin/pipelines
     */
    async showPipelineDashboard(req, res) {
        try {
            console.log('🎨 Rendering pipeline.js dashboard');

            // Get dashboard data
            const dashboardData = await pipelineOrchestrator.getDashboardData();
            const generationStats = await templateGenerationService.getGenerationStats();

            // Prepare data for template
            const templateData = {
                layout: 'main',
                showNav: true,
                title: 'Pipeline Management',
                user: req.user,
                currentPage: 'pipelines',
                pipelines: dashboardData.pipelines,
                recentExecutions: dashboardData.recentExecutions,
                statistics: dashboardData.statistics,
                templateGeneration: generationStats,
                registryStats: dashboardData.registryStats
            };

            res.render('pipeline', templateData);

        } catch (error) {
            console.error('❌ Error rendering pipeline.js dashboard:', error.message);
            res.status(500).render('error', {
                layout: 'main',
                showNav: true,
                title: 'Error',
                user: req.user,
                error: {
                    status: 500,
                    message: 'Failed to load pipeline.js dashboard',
                    details: error.message
                }
            });
        }
    }

    /**
     * Execute pipeline.js via UI
     * POST /admin/pipelines/:pipelineName/execute
     */
    async executePipeline(req, res) {
        try {
            const { pipelineName } = req.params;

            console.log(`🚀 UI request to execute pipeline: ${pipelineName}`);

            // Validate pipeline.js execution
            const validation = pipelineOrchestrator.validatePipelineExecution(pipelineName);
            if (!validation.isValid) {
                req.session.error = `Pipeline validation failed: ${validation.errors.join(', ')}`;
                return res.redirect('/admin/pipelines');
            }

            // Execute pipeline.js
            const result = await pipelineOrchestrator.executePipeline(pipelineName);

            if (result.success) {
                req.session.success = `Pipeline "${result.displayName}" executed successfully. Created ${result.result.created || 0} queue items.`;
            } else {
                req.session.error = `Pipeline execution failed: ${result.error}`;
            }

        } catch (error) {
            console.error('❌ Pipeline execution failed:', error.message);
            req.session.error = `Pipeline execution failed: ${error.message}`;
        }

        res.redirect('/admin/pipelines');
    }

    /**
     * Show queue management interface
     * GET /admin/pipelines/queue
     */
    async showQueueManagement(req, res) {
        try {
            console.log('🎨 Rendering queue management');

            // Get queue statistics
            const queueStats = await templateGenerationService.getGenerationStats();

            // Get templates waiting for review
            const templatesForReview = await templateGenerationService.getTemplatesWaitingReview();

            const templateData = {
                layout: 'main',
                showNav: true,
                title: 'Queue Management',
                user: req.user,
                currentPage: 'pipelines',
                queueStats,
                templatesForReview,
                hasTemplatesForReview: templatesForReview.length > 0
            };

            res.render('queue-management', templateData);

        } catch (error) {
            console.error('❌ Error rendering queue management:', error.message);
            res.status(500).render('error', {
                layout: 'main',
                showNav: true,
                title: 'Error',
                user: req.user,
                error: {
                    status: 500,
                    message: 'Failed to load queue management',
                    details: error.message
                }
            });
        }
    }

    /**
     * Approve template via UI
     * POST /admin/pipelines/templates/:template/approve
     */
    async approveTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const { scheduledDate } = req.body;

            console.log(`✅ UI request to approve template: ${templateId}`);

            const scheduleDate = scheduledDate ? new Date(scheduledDate) : new Date();
            const result = await templateGenerationService.approveTemplate(parseInt(templateId), scheduleDate);

            req.session.success = `Template approved successfully. Scheduled ${result.approvedQueueItems} emails.`;

        } catch (error) {
            console.error('❌ Template approval failed:', error.message);
            req.session.error = `Template approval failed: ${error.message}`;
        }

        res.redirect('/admin/pipelines/queue');
    }

    /**
     * Reject template via UI
     * POST /admin/pipelines/templates/:templateId/reject
     */
    async rejectTemplate(req, res) {
        try {
            const { templateId } = req.params;
            const { reason = 'Content not approved' } = req.body;

            console.log(`❌ UI request to reject template: ${templateId}`);

            const result = await templateGenerationService.rejectTemplate(parseInt(templateId), reason);

            req.session.success = `Template rejected. ${result.rejectedQueueItems} queue items updated.`;

        } catch (error) {
            console.error('❌ Template rejection failed:', error.message);
            req.session.error = `Template rejection failed: ${error.message}`;
        }

        res.redirect('/admin/pipelines/queue');
    }

    /**
     * Trigger template generation via UI
     * POST /admin/pipelines/generate-templates
     */
    async triggerTemplateGeneration(req, res) {
        try {
            console.log('🤖 UI request to trigger template generation');

            if (templateGenerationService.isGenerationInProgress()) {
                req.session.warning = 'Template generation is already in progress';
                return res.redirect('/admin/pipelines/queue');
            }

            const result = await templateGenerationService.scanAndGenerateTemplates(20);

            if (result.skipped) {
                req.session.info = `Template generation skipped: ${result.reason}`;
            } else {
                req.session.success = `Template generation completed. Processed ${result.processed}, succeeded ${result.succeeded}, failed ${result.failed}.`;
            }

        } catch (error) {
            console.error('❌ Template generation failed:', error.message);
            req.session.error = `Template generation failed: ${error.message}`;
        }

        res.redirect('/admin/pipelines/queue');
    }
}

module.exports = new PipelineUIController();