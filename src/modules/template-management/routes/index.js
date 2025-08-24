const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { requireAuth } = require('../../../core/auth/middleware/authMiddleware');

// Apply authentication middleware to all template routes
router.use(requireAuth);

// Template CRUD operations
router.get('/', templateController.getAllTemplates);
router.post('/', templateController.createTemplate);
router.get('/by-code/:templateCode', templateController.getTemplateByCode);
router.get('/:templateId', templateController.getTemplateById);
router.put('/:templateId', templateController.updateTemplate);
router.delete('/:templateId', templateController.deleteTemplate);

// Template status management
router.put('/:templateId/status', templateController.updateTemplateStatus);
router.get('/review/pending', templateController.getTemplatesWaitingReview);

// Template preview and testing
router.post('/:templateId/preview', templateController.previewTemplate);
router.post('/by-code/:templateCode/preview', templateController.previewTemplateByCode);

// Template search and discovery
router.get('/search/query', templateController.searchTemplates);
router.get('/categories/list', templateController.getTemplateCategories);

// Template analytics
router.get('/stats/overview', templateController.getTemplateStats);

module.exports = router;