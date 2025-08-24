const pipelineController = require('./controllers/pipelineController');
const queueController = require('./controllers/queueController');
const pipelineOrchestrator = require('./services/pipelineOrchestrator');
const templateGenerationService = require('./services/templateGenerationService');
const PipelineRegistry = require('./services/pipelineRegistry');
const pipelineRoutes = require('./routes');
const pipelineConfig = require('../../config/pipeline');

class PipelineModule {
    constructor() {
        this.isInitialized = false;
        this.scanInterval = null;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing core pipeline.js module...');

            // Validate pipeline.js configurations
            console.log('📋 Validating pipeline.js registry...');
            PipelineRegistry.validateAllConfigs();

            // Initialize database services (dependencies should already be initialized)
            console.log('💾 Checking database services...');
            const database = require('../database');
            if (!database.isReady()) {
                throw new Error('Database not available for pipeline.js module');
            }

            // Start template generation scanning if enabled
            if (pipelineConfig.queueProcessing.scanIntervalSeconds > 0) {
                this.startTemplateGenerationScanning();
            }

            this.isInitialized = true;
            console.log('✅ Core pipeline.js module initialized successfully');
            console.log(`   - Available pipelines: ${PipelineRegistry.getAvailablePipelines().length}`);
            console.log(`   - Template generation: ${pipelineConfig.templateGeneration.maxRetries} max retries`);
            console.log(`   - Queue scanning: ${pipelineConfig.queueProcessing.scanIntervalSeconds}s interval`);

            return true;

        } catch (error) {
            console.error('❌ Core pipeline.js module initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Start background template generation scanning
     */
    startTemplateGenerationScanning() {
        const intervalMs = pipelineConfig.queueProcessing.scanIntervalSeconds * 1000;

        console.log(`🔄 Starting template generation scanning (${pipelineConfig.queueProcessing.scanIntervalSeconds}s interval)`);

        this.scanInterval = setInterval(async () => {
            try {
                if (!templateGenerationService.isGenerationInProgress()) {
                    const result = await templateGenerationService.scanAndGenerateTemplates(
                        pipelineConfig.templateGeneration.batchSize
                    );

                    if (result.processed > 0) {
                        console.log(`📧 Generated ${result.succeeded} templates, ${result.failed} failed`);
                    }
                }
            } catch (error) {
                console.error('❌ Background template generation failed:', error.message);
            }
        }, intervalMs);
    }

    /**
     * Stop background scanning
     */
    stopTemplateGenerationScanning() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
            console.log('🛑 Stopped template generation scanning');
        }
    }

    getStatus() {
        return {
            initialized: this.isInitialized,
            services: {
                orchestrator: 'ready',
                templateGeneration: templateGenerationService.isGenerationInProgress() ? 'processing' : 'ready',
                registry: 'ready'
            },
            configuration: {
                maxRetries: pipelineConfig.templateGeneration.maxRetries,
                scanInterval: pipelineConfig.queueProcessing.scanIntervalSeconds,
                batchSize: pipelineConfig.templateGeneration.batchSize
            },
            pipelines: PipelineRegistry.getRegistryStats(),
            backgroundScanning: this.scanInterval !== null,
            timestamp: new Date().toISOString()
        };
    }

    isReady() {
        return this.isInitialized;
    }

    getRoutes() {
        return pipelineRoutes;
    }

    getControllers() {
        return {
            pipelineController,
            queueController
        };
    }

    getServices() {
        return {
            orchestrator: pipelineOrchestrator,
            templateGeneration: templateGenerationService,
            registry: PipelineRegistry
        };
    }

    async shutdown() {
        try {
            console.log('🛑 Shutting down core pipeline.js module...');

            // Stop background scanning
            this.stopTemplateGenerationScanning();

            // Wait for any running pipelines to complete (with timeout)
            const maxWaitTime = 30000; // 30 seconds
            const startTime = Date.now();

            while (pipelineOrchestrator.hasRunningPipelines() && (Date.now() - startTime) < maxWaitTime) {
                console.log('⏳ Waiting for running pipelines to complete...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            if (pipelineOrchestrator.hasRunningPipelines()) {
                console.warn('⚠️ Some pipelines still running during shutdown');
            }

            this.isInitialized = false;
            console.log('✅ Core pipeline.js module shutdown complete');
        } catch (error) {
            console.error('❌ Core pipeline.js module shutdown failed:', error.message);
        }
    }

    async testConnection() {
        try {
            if (!this.isReady()) {
                return {
                    success: false,
                    error: 'Pipeline module not ready'
                };
            }

            // Test pipeline.js registry
            const pipelines = PipelineRegistry.getAvailablePipelines();

            // Test template generation service
            const generationStats = await templateGenerationService.getGenerationStats();

            return {
                success: true,
                pipelines: {
                    available: pipelines.length,
                    names: pipelines
                },
                templateGeneration: {
                    processing: templateGenerationService.isGenerationInProgress(),
                    stats: generationStats
                },
                module: this.getStatus()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get pipeline.js execution capabilities
     */
    getCapabilities() {
        return {
            pipelineExecution: {
                available: PipelineRegistry.getAvailablePipelines(),
                concurrent: pipelineConfig.performance.maxConcurrentPipelines,
                timeout: pipelineConfig.performance.executionTimeoutSeconds
            },
            templateGeneration: {
                maxRetries: pipelineConfig.templateGeneration.maxRetries,
                batchSize: pipelineConfig.templateGeneration.batchSize,
                backgroundScanning: this.scanInterval !== null
            },
            queueManagement: {
                maxBatchSize: pipelineConfig.queueProcessing.batchSize,
                scanInterval: pipelineConfig.queueProcessing.scanIntervalSeconds
            }
        };
    }
}

// Create and export module instance
const pipelineModule = new PipelineModule();

module.exports = pipelineModule;

// Also export individual components for direct access
module.exports.controllers = {
    pipelineController,
    queueController
};

module.exports.services = {
    orchestrator: pipelineOrchestrator,
    templateGeneration: templateGenerationService,
    registry: PipelineRegistry
};

module.exports.routes = pipelineRoutes;
module.exports.config = pipelineConfig;