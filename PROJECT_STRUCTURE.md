# Project Structure Documentation - AI Agent Optimized

## PROJECT_STRUCTURE

### directories:
- src/
- src/core/
- src/core/auth/
- src/core/auth/controllers/
- src/core/auth/middleware/
- src/core/auth/services/
- src/core/database/
- src/core/database/models/
- src/core/database/services/
- src/core/database/migrations/
- src/core/email/
- src/core/email/controllers/
- src/core/email/services/
- src/core/email/routes/
- src/modules/
- src/modules/admin/
- src/modules/admin/controllers/
- src/modules/admin/views/
- src/modules/admin/views/layouts/
- src/modules/admin/routes/
- src/modules/data-import/
- src/modules/data-import/config/
- src/modules/data-import/controllers/
- src/modules/data-import/services/
- src/modules/data-import/validators/
- src/modules/data-import/routes/
- src/modules/template-management/
- src/modules/template-management/controllers/
- src/modules/template-management/routes/
- src/shared/
- src/shared/middleware/
- src/config/
- public/
- public/css/
- public/images/
- public/js/
- scripts/

### files:
- package.json
- .env.example
- .gitignore
- README.md
- DEPLOYMENT.md
- PROJECT_STRUCTURE.md
- src/app.js
- src/config/index.js
- src/config/email.js
- src/core/auth/controllers/authController.js
- src/core/auth/middleware/authMiddleware.js
- src/core/auth/services/authService.js
- src/core/auth/index.js
- src/core/database/connection.js
- src/core/database/migrationRunner.js
- src/core/database/models/Customer.js
- src/core/database/models/Book.js
- src/core/database/models/EmailRecord.js
- src/core/database/models/EmailTemplate.js
- src/core/database/services/customerService.js
- src/core/database/services/bookService.js
- src/core/database/services/emailTemplateService.js
- src/core/database/services/emailRecordService.js
- src/core/database/migrations/000_create_schema_migrations.sql
- src/core/database/migrations/001_create_customers.sql
- src/core/database/migrations/002_create_books.sql
- src/core/database/migrations/005_create_email_records.sql
- src/core/database/migrations/006_create_email_templates.sql
- src/core/database/migrations/007_update_email_records.sql
- src/core/database/index.js
- src/core/email/controllers/emailController.js
- src/core/email/services/postmarkService.js
- src/core/email/services/emailSendService.js
- src/core/email/routes/index.js
- src/core/email/index.js
- src/modules/admin/controllers/authUIController.js
- src/modules/admin/controllers/dashboardController.js
- src/modules/admin/controllers/genericImportUIController.js
- src/modules/admin/views/layouts/main.hbs
- src/modules/admin/views/login.hbs
- src/modules/admin/views/dashboard.hbs
- src/modules/admin/views/error.hbs
- src/modules/admin/views/import-entity-selection.hbs
- src/modules/admin/views/import-error-report.hbs
- src/modules/admin/views/import-generic.hbs
- src/modules/admin/routes/index.js
- src/modules/admin/routes/genericImportRoutes.js
- src/modules/admin/index.js
- src/modules/data-import/config/importConfigs.js
- src/modules/data-import/controllers/genericImportController.js
- src/modules/data-import/services/dataValidationService.js
- src/modules/data-import/services/genericImportService.js
- src/modules/data-import/validators/csvValidator.js
- src/modules/data-import/validators/genericValidator.js
- src/modules/data-import/routes/index.js
- src/modules/data-import/routes/genericRoutes.js
- src/modules/data-import/index.js
- src/modules/template-management/controllers/templateController.js
- src/modules/template-management/routes/index.js
- src/modules/template-management/index.js
- src/shared/middleware/errorHandler.js
- src/shared/middleware/fileUpload.js
- src/shared/middleware/fileValidator.js
- public/css/admin.css
- scripts/migrate.js
- scripts/db-status.js
- scripts/db-reset.js
- scripts/seed-data.js
- scripts/setup.js

### file_purposes:
- package.json: "Node.js project configuration with dependencies including PostgreSQL driver, multer, csv-parser, express-session, and postmark"
- .env.example: "Environment variables template including database, data import, and email service configuration"
- src/app.js: "Express application entry point with database initialization, email module, template management, data import module, session middleware, and enhanced health check"
- src/config/index.js: "Environment variable validation including database, data import, and email service configuration with validation"
- src/config/email.js: "Email service configuration module for Postmark API settings, batch processing, and template caching"
- src/core/auth/services/authService.js: "JWT operations, credential validation, token management (unchanged)"
- src/core/auth/controllers/authController.js: "Authentication API endpoints for login/logout/verify with JWT token in response"
- src/core/auth/middleware/authMiddleware.js: "Route protection, session management, user context extraction (unchanged)"
- src/core/auth/index.js: "Authentication module exports aggregation (unchanged)"
- src/core/database/connection.js: "PostgreSQL connection management with SSL support and connection pooling"
- src/core/database/migrationRunner.js: "Database migration execution, tracking, and rollback functionality"
- src/core/database/models/Customer.js: "Customer data model with validation, business logic methods, and email update support"
- src/core/database/models/Book.js: "Book catalog model with search and categorization methods"
- src/core/database/models/EmailRecord.js: "Extended email campaign tracking model with Postmark integration fields and comprehensive analytics"
- src/core/database/models/EmailTemplate.js: "Email template data model with variable extraction, template processing, validation, and approval workflow"
- src/core/database/services/customerService.js: "Customer CRUD operations, marketing queries, and import-compatible methods"
- src/core/database/services/bookService.js: "Book management operations and recommendation queries"
- src/core/database/services/emailTemplateService.js: "Email template CRUD operations, template rendering, approval workflow, and analytics"
- src/core/database/services/emailRecordService.js: "Email record operations, bulk operations, Postmark tracking, delivery status updates, and metrics"
- src/core/database/migrations/000_create_schema_migrations.sql: "Migration tracking table creation"
- src/core/database/migrations/001_create_customers.sql: "Customer table creation with indexes and constraints (no company field)"
- src/core/database/migrations/002_create_books.sql: "Books table creation with categorization support"
- src/core/database/migrations/005_create_email_records.sql: "Email campaign tracking table with Postmark integration"
- src/core/database/migrations/006_create_email_templates.sql: "Email templates table creation with approval workflow and A/B testing support"
- src/core/database/migrations/007_update_email_records.sql: "Email records table extension with Postmark integration fields and batch tracking"
- src/core/database/index.js: "Database module exports and initialization coordination with email services"
- src/core/email/controllers/emailController.js: "Email API controller for batch sending, template preview, service monitoring, and delivery tracking"
- src/core/email/services/postmarkService.js: "Postmark API integration service for email sending, tracking, rate limiting, and error handling"
- src/core/email/services/emailSendService.js: "Email orchestration service coordinating template processing, validation, database records, and Postmark delivery"
- src/core/email/routes/index.js: "Email API routes configuration with authentication middleware for /api/email endpoints"
- src/core/email/index.js: "Core email module orchestrator with initialization, status monitoring, and service coordination"
- src/modules/admin/controllers/authUIController.js: "Login page rendering and UI logic (unchanged)"
- src/modules/admin/controllers/dashboardController.js: "Admin dashboard rendering and data preparation (unchanged)"
- src/modules/admin/controllers/genericImportUIController.js: "Generic import UI controller for handling entity selection and import forms"
- src/modules/admin/views/layouts/main.hbs: "Base HTML template with navigation including Data Import link"
- src/modules/admin/views/login.hbs: "Login form with client-side validation and error handling (unchanged)"
- src/modules/admin/views/dashboard.hbs: "Admin dashboard with system status and feature overview (unchanged)"
- src/modules/admin/views/error.hbs: "Error page template for HTTP errors and exceptions (unchanged)"
- src/modules/admin/views/import-entity-selection.hbs: "Entity selection page for data import with grid of importable entities"
- src/modules/admin/views/import-error-report.hbs: "Error report template for displaying import validation errors"
- src/modules/admin/views/import-generic.hbs: "Generic import form for uploading and processing CSV files"
- src/modules/admin/routes/index.js: "Admin interface URL routing with CSV import routes and file upload middleware"
- src/modules/admin/routes/genericImportRoutes.js: "Routes for generic entity import functionality"
- src/modules/admin/index.js: "Admin module exports aggregation (unchanged)"
- src/modules/data-import/config/importConfigs.js: "Configuration for different entity import types and validation rules"
- src/modules/data-import/controllers/genericImportController.js: "API controller for generic entity import operations"
- src/modules/data-import/services/dataValidationService.js: "File validation, preview generation, and comprehensive data validation"
- src/modules/data-import/services/genericImportService.js: "Service for processing and importing generic entity data"
- src/modules/data-import/validators/csvValidator.js: "CSV file structure and header validation (Stages 1-2)"
- src/modules/data-import/validators/genericValidator.js: "Generic entity data validation with configurable rules"
- src/modules/data-import/routes/index.js: "Data import API routes with authentication and file upload middleware"
- src/modules/data-import/routes/genericRoutes.js: "API routes for generic entity import operations"
- src/modules/data-import/index.js: "Data import module aggregation with initialization and status management"
- src/modules/template-management/controllers/templateController.js: "Template management controller with CRUD operations, status management, search, preview, and analytics"
- src/modules/template-management/routes/index.js: "Template management routes configuration with authentication for /api/templates endpoints"
- src/modules/template-management/index.js: "Template management module orchestrator with initialization and lifecycle management"
- src/shared/middleware/errorHandler.js: "Global error handling for API and web requests (unchanged)"
- src/shared/middleware/fileUpload.js: "Multer configuration for CSV file uploads with security validation"
- src/shared/middleware/fileValidator.js: "File validation middleware with MIME type and content checking"
- public/css/admin.css: "Complete responsive styling for admin interface with data import styles"
- scripts/migrate.js: "Migration execution script with status reporting"
- scripts/db-status.js: "Database connection and migration status checking script"
- scripts/db-reset.js: "Database reset script with confirmation prompts"
- scripts/seed-data.js: "Sample data generation script for development"
- scripts/setup.js: "Project setup script for initial configuration and dependencies"

## MODULE_ARCHITECTURE

### core_modules:
- location: "src/core/"
- purpose: "Essential system infrastructure independent of business features"
- characteristics: ["no_dependencies_on_feature_modules", "provides_foundational_services", "reusable_across_features"]
- current_modules: ["auth", "database", "email"]
- planned_modules: ["scheduler", "pipeline"]

### feature_modules:
- location: "src/modules/"
- purpose: "Business functionality and user interfaces"
- characteristics: ["can_depend_on_core_modules", "no_lateral_dependencies", "implements_business_logic"]
- current_modules: ["admin", "data-import", "template-management"]

### shared_services:
- location: "src/shared/"
- purpose: "Common utilities used across multiple modules"
- characteristics: ["pure_utility_functions", "no_business_logic", "no_module_specific_code"]
- current_services: ["middleware"]
- planned_services: ["validation", "logging", "formatting"]

## EMAIL_SYSTEM_ARCHITECTURE

### core_email_module:
- location: "src/core/email/"
- purpose: "Email infrastructure and Postmark API integration"
- characteristics: ["postmark_integration", "batch_processing", "rate_limiting", "comprehensive_tracking"]

- src/core/email/controllers/emailController.js:
  - primary_function: "Email API endpoints for batch sending and template preview"
  - key_responsibilities: ["batch_email_sending", "template_preview", "service_status", "delivery_tracking", "email_testing"]
  - dependencies: ["emailSendService", "emailTemplateService", "postmarkService"]
  - used_by: ["API_clients", "Postman_testing", "external_integrations"]

- src/core/email/services/postmarkService.js:
  - primary_function: "Direct Postmark API integration for email delivery"
  - key_responsibilities: ["single_email_sending", "batch_email_sending", "rate_limiting", "delivery_tracking", "error_handling"]
  - dependencies: ["postmark_npm_package", "email_configuration"]
  - used_by: ["emailSendService"]

- src/core/email/services/emailSendService.js:
  - primary_function: "Email orchestration and workflow coordination"
  - key_responsibilities: ["template_processing", "recipient_validation", "database_record_creation", "postmark_coordination", "batch_management"]
  - dependencies: ["postmarkService", "emailTemplateService", "emailRecordService", "customerService"]
  - used_by: ["emailController", "future_automation_pipelines"]

### template_management_module:
- location: "src/modules/template-management/"
- purpose: "Email template CRUD operations and approval workflow"
- characteristics: ["template_lifecycle_management", "approval_workflow", "variable_validation", "analytics"]

- src/modules/template-management/controllers/templateController.js:
  - primary_function: "Template management API endpoints"
  - key_responsibilities: ["template_crud", "status_management", "template_search", "preview_generation", "analytics"]
  - dependencies: ["emailTemplateService"]
  - used_by: ["API_clients", "admin_interface", "template_management_tools"]

### email_database_integration:
- email_templates_table: "Stores template definitions with approval workflow and A/B testing support"
- email_records_table: "Extended with Postmark integration fields for comprehensive tracking"
- emailTemplateService: "Complete template lifecycle management with variable validation"
- emailRecordService: "Email execution tracking with Postmark response correlation"

## DATA_IMPORT_ARCHITECTURE

### data_import_feature_module:
- location: "src/modules/data-import/"
- purpose: "CSV-based customer data import with comprehensive validation and partial import support"
- characteristics: ["stage_based_validation", "partial_import_capability", "security_focused", "admin_integration"]

- src/modules/data-import/config/importConfigs.js:
  - primary_function: "Entity import configuration and validation rules"
  - key_responsibilities: ["entity_definition", "field_validation_rules", "import_mode_configuration", "error_message_templates"]
  - dependencies: []
  - used_by: ["genericImportController", "genericValidator", "genericImportService"]

- src/modules/data-import/services/dataValidationService.js:
  - primary_function: "File validation and data preview generation"
  - key_responsibilities: ["file_format_validation", "preview_generation", "error_formatting", "configuration_validation"]
  - dependencies: ["csvValidator", "genericValidator"]
  - used_by: ["genericImportController", "genericImportService"]

- src/modules/data-import/services/genericImportService.js:
  - primary_function: "Generic entity import processing"
  - key_responsibilities: ["data_transformation", "batch_processing", "error_handling", "import_reporting"]
  - dependencies: ["dataValidationService", "csvValidator", "genericValidator", "importConfigs"]
  - used_by: ["genericImportController"]

- src/modules/data-import/validators/csvValidator.js:
  - primary_function: "CSV structure and header validation (Stages 1-2 - fatal errors)"
  - key_responsibilities: ["file_format_checking", "header_validation", "csv_structure_parsing", "encoding_validation"]
  - dependencies: ["csv-parser"]
  - used_by: ["dataValidationService", "genericImportService"]

- src/modules/data-import/validators/genericValidator.js:
  - primary_function: "Generic entity data validation (Stage 3 - row-level validation)"
  - key_responsibilities: ["field_validation", "business_rule_checking", "data_type_conversion", "error_collection"]
  - dependencies: ["importConfigs"]
  - used_by: ["genericImportService", "dataValidationService"]

- src/modules/data-import/controllers/genericImportController.js:
  - primary_function: "API endpoints for generic entity import"
  - key_responsibilities: ["request_handling", "file_processing", "response_formatting", "error_handling"]
  - dependencies: ["genericImportService", "dataValidationService", "fileUpload", "fileValidator"]
  - used_by: ["genericRoutes"]

### validation_stages:
- stage_1_file_upload: "File format, size (2MB), and basic accessibility validation"
- stage_2_csv_structure: "CSV headers, structure, and required column validation"
- stage_3_data_validation: "Row-by-row data validation with partial import support"

### import_modes:
- add_new_records: "Create new customer records with email uniqueness validation"
- update_existing_records: "Update existing customers using customer_id as identifier"

### supported_fields:
- required_fields_add: ["email"]
- required_fields_update: ["customer_id"]
- optional_fields: ["name", "status", "topics_of_interest"]
- editable_fields: ["email", "name", "status", "topics_of_interest"]
- system_managed: ["customer_id", "created_at", "updated_at"]

## DATABASE_ARCHITECTURE

### database_core_module:
- location: "src/core/database/"
- purpose: "PostgreSQL integration and data management foundation"
- characteristics: ["connection_management", "migration_system", "data_models", "business_services", "email_integration"]

### data_models:
- src/core/database/models/Customer.js:
  - primary_function: "Customer data model for marketing automation"
  - key_responsibilities: ["email_validation", "status_management", "topic_interest_matching", "business_logic_methods"]
  - import_compatibility: ["email_updates_allowed", "name_optional_validation", "company_field_removed"]
  - dependencies: []
  - used_by: ["customerService", "data_import", "email_campaigns"]

- src/core/database/models/Book.js:
  - primary_function: "Book catalog model for ebook platform"
  - key_responsibilities: ["title_author_management", "genre_categorization", "topic_matching", "publication_status"]
  - dependencies: []
  - used_by: ["bookService", "recommendation_engine"]

- src/core/database/models/EmailRecord.js:
  - primary_function: "Extended email campaign tracking and analytics with Postmark integration"
  - key_responsibilities: ["delivery_tracking", "engagement_metrics", "postmark_integration", "campaign_analytics", "batch_tracking", "variable_storage"]
  - email_integration: ["postmark_response_correlation", "comprehensive_tracking", "template_linkage"]
  - dependencies: []
  - used_by: ["email_service", "campaign_reporting", "customer_engagement"]

- src/core/database/models/EmailTemplate.js:
  - primary_function: "Email template data model with variable processing and approval workflow"
  - key_responsibilities: ["template_validation", "variable_extraction", "template_processing", "approval_workflow", "a_b_testing_support"]
  - email_integration: ["variable_replacement", "approval_states", "ai_generated_support"]
  - dependencies: []
  - used_by: ["emailTemplateService", "email_campaigns", "template_management"]

### data_services:
- src/core/database/services/customerService.js:
  - primary_function: "Customer CRUD operations and marketing queries"
  - key_responsibilities: ["customer_management", "targeting_queries", "segmentation", "bulk_operations", "import_support"]
  - import_compatibility: ["email_update_support", "company_field_removed", "validation_updates"]
  - dependencies: ["connection", "Customer_model"]
  - used_by: ["marketing_campaigns", "admin_interface", "data_import", "email_campaigns"]

- src/core/database/services/bookService.js:
  - primary_function: "Book catalog management and recommendation queries"
  - key_responsibilities: ["catalog_management", "search_operations", "recommendation_logic", "genre_analytics"]
  - dependencies: ["connection", "Book_model"]
  - used_by: ["content_recommendations", "admin_interface", "activity_tracking"]

- src/core/database/services/emailTemplateService.js:
  - primary_function: "Email template CRUD operations, rendering, and approval workflow management"
  - key_responsibilities: ["template_crud", "template_rendering", "approval_workflow", "variable_validation", "analytics", "search"]
  - email_integration: ["variable_processing", "approval_states", "usage_tracking"]
  - dependencies: ["connection", "EmailTemplate_model"]
  - used_by: ["email_service", "template_management", "campaign_creation"]

- src/core/database/services/emailRecordService.js:
  - primary_function: "Email record operations, Postmark tracking, and comprehensive analytics"
  - key_responsibilities: ["email_record_crud", "bulk_operations", "postmark_response_tracking", "delivery_status_updates", "metrics_analytics", "search"]
  - email_integration: ["postmark_correlation", "batch_tracking", "engagement_analytics"]
  - dependencies: ["connection", "EmailRecord_model"]
  - used_by: ["email_service", "campaign_reporting", "delivery_tracking"]

## DEPENDENCY_RELATIONSHIPS

### dependency_flow:
- feature_modules_depend_on: ["core_modules", "shared_services"]
- core_modules_depend_on: ["config", "external_libraries"]
- shared_services_depend_on: ["external_libraries_only"]
- config_depends_on: ["environment_variables"]
- database_depends_on: ["postgresql", "connection_pooling"]
- data_import_depends_on: ["core/database", "core/auth", "shared/middleware"]
- email_depends_on: ["core/database", "core/auth", "postmark_api"]
- template_management_depends_on: ["core/database", "core/auth"]

### import_patterns:
- app_js_imports: ["config/index.js", "core/auth", "core/database", "core/email", "modules/admin", "modules/data-import", "modules/template-management", "shared/middleware/errorHandler"]
- core_auth_exports: ["authService", "authController", "authMiddleware"]
- core_database_exports: ["connection", "models", "services", "migrationRunner", "initialize"]
- core_email_exports: ["emailController", "postmarkService", "emailSendService", "routes"]
- modules_admin_exports: ["authUIController", "dashboardController", "genericImportUIController", "routes"]
- modules_data_import_exports: ["genericImportController", "genericImportService", "dataValidationService", "validators", "config", "routes"]
- modules_template_management_exports: ["templateController", "routes"]

### module_communication:
- admin_module_uses: ["core/auth for authentication", "core/database for data access", "shared/middleware for error handling", "data-import for import functionality"]
- data_import_module_uses: ["core/auth for route protection", "core/database for entity operations", "shared/middleware for file handling"]
- email_module_uses: ["core/auth for route protection", "core/database for data operations", "postmark for email delivery"]
- template_management_uses: ["core/auth for route protection", "core/database for template operations"]
- auth_module_provides: ["JWT token management", "route protection", "session handling"]
- database_module_provides: ["data persistence", "entity management", "analytics queries", "migration system", "email data management"]
- email_module_provides: ["email sending infrastructure", "template processing", "delivery tracking", "batch processing"]
- shared_middleware_provides: ["error handling", "file upload processing", "validation utilities"]

## ROUTE_ARCHITECTURE

### api_routes:
- base_path: "/api/"
- authentication_routes:
  - POST /api/auth/login: "Admin authentication endpoint with credential validation and JWT token in response"
  - GET /api/auth/logout: "Session termination and cookie clearing"
  - GET /api/auth/verify: "Token validation and user context retrieval"
- email_api_routes:
  - POST /api/email/send-batch: "Send batch emails with template processing via Postmark"
  - POST /api/email/preview-template: "Preview template with variables without sending"
  - POST /api/email/test-send: "Send test email for debugging"
  - GET /api/email/templates: "Get available approved templates"
  - GET /api/email/templates/:id: "Get specific template details with usage stats"
  - POST /api/email/templates/:id/validate-variables: "Validate template variables"
  - GET /api/email/batch/:batchId/stats: "Get batch sending statistics"
  - POST /api/email/delivery-status: "Check email delivery status by email IDs"
  - GET /api/email/status: "Get email service status"
  - GET /api/email/health: "Email service health check"
- template_management_routes:
  - GET /api/templates: "List all templates with filtering"
  - POST /api/templates: "Create new template"
  - GET /api/templates/:id: "Get template by ID with usage statistics"
  - PUT /api/templates/:id: "Update template"
  - DELETE /api/templates/:id: "Delete template"
  - PUT /api/templates/:id/status: "Update template status (approve/reject)"
  - GET /api/templates/review/pending: "Get templates waiting for review"
  - POST /api/templates/:id/preview: "Preview template with variables"
  - GET /api/templates/search/query: "Search templates"
  - GET /api/templates/categories/list: "Get template categories"
  - GET /api/templates/stats/overview: "Get template statistics"
- data_import_routes:
  - POST /api/data-import/:entity/upload: "CSV file upload and import processing for any entity"
  - POST /api/data-import/:entity/validate: "CSV validation and preview without importing"
  - GET /api/data-import/:entity/config: "Import configuration and limits for specific entity"
  - GET /api/data-import/:entity/template: "Download CSV templates for specific entity"
  - GET /api/data-import/entities: "Get list of available importable entities"
  - GET /api/data-import/health: "Data import module health check"
- system_routes:
  - GET /api/health: "System health check with database, email, and module connectivity status"

### admin_interface_routes:
- base_path: "/admin/"
- public_routes:
  - GET /admin/login: "Login page rendering (redirects if authenticated)"
- protected_routes:
  - GET /admin/dashboard: "Main admin dashboard (requires authentication)"
  - GET /admin/import-data: "Entity selection page for data import"
  - GET /admin/import-data/:entity: "Generic import interface for specific entity"
  - POST /admin/import-data/:entity/upload: "Handle CSV file upload from admin interface"
  - GET /admin/import-data/:entity/template: "Download CSV template files"
  - GET /admin/import-data/:entity/error-report: "View error report for failed imports"
  - GET /admin/: "Redirects to dashboard"
- root_routes:
  - GET /: "Redirects to admin dashboard"

### middleware_application:
- public_routes: ["/api/auth/login", "/api/health", "/api/data-import/health", "/api/email/health"]
- redirect_routes: ["/admin/login uses redirectIfAuthenticated"]
- protected_routes: ["all /admin/* routes except login use requireAuth", "all /api/data-import/* routes use requireAuth", "all /api/email/* routes use requireAuth", "all /api/templates/* routes use requireAuth"]
- file_upload_routes: ["/admin/import-data/:entity/upload uses multer", "/api/data-import/:entity/upload uses fileUpload middleware"]
- file_validation: ["all file upload routes use fileValidator for security and format validation"]
- error_handling: ["global errorHandler for all routes", "multer error handling for file uploads"]

## DATA_FLOW_SEQUENCES

### email_sending_flow:
1. user_request: "POST /api/email/send-batch with template ID and recipients"
2. authentication: "requireAuth middleware validates JWT token"
3. controller_processing: "emailController.sendBatchEmails validates request and calls emailSendService"
4. template_validation: "emailTemplateService validates template exists and is approved"
5. recipient_processing: "customerService validates customer existence for each recipient"
6. template_rendering: "EmailTemplate.renderComplete processes variables for each recipient"
7. database_records: "emailRecordService.bulkCreateEmailRecords creates tracking records"
8. postmark_sending: "postmarkService.sendBatchEmails sends via Postmark API with rate limiting"
9. response_tracking: "emailRecordService updates records with Postmark responses"
10. result_delivery: "Comprehensive response with batch ID, success/failure counts, and email IDs"

### csv_import_flow:
1. user_request: "POST /admin/import-data/:entity/upload with CSV file"
2. middleware_processing: "authMiddleware.requireAuth → multer file upload → fileValidator validation"
3. controller_handling: "genericImportUIController processes the request and calls appropriate services"
4. stage_1_validation: "File format, size (2MB), and basic accessibility checking"
5. stage_2_validation: "CSV structure, headers, and required columns validation based on entity configuration"
6. stage_3_processing: "Row-by-row data validation with partial import support using entity-specific rules"
7. database_operations: "Entity-specific service methods for creating or updating records"
8. result_generation: "Success summary + error report in original CSV format"
9. response_delivery: "Session flash messages + redirect to import page or error report"

### template_management_flow:
1. user_request: "POST /api/templates with template data"
2. authentication: "requireAuth middleware validates JWT token"
3. controller_processing: "templateController.createTemplate validates request data"
4. model_validation: "EmailTemplate.create validates template structure and variables"
5. variable_extraction: "EmailTemplate.extractVariablesFromTemplate analyzes template content"
6. database_storage: "emailTemplateService.createTemplate stores template with metadata"
7. approval_workflow: "Template status set based on type (predefined=APPROVED, ai_generated=WAIT_REVIEW)"
8. response_delivery: "Template JSON with ID and validation status"

### data_validation_stages:
1. file_validation: "fileValidator.validateCSVFile() checks format and security"
2. csv_structure: "csvValidator.validateCSVStructure() verifies headers and structure against entity configuration"
3. data_processing: "genericValidator.validateRowData() with automatic whitespace trimming and type conversion"
4. business_logic: "Entity-specific validation rules from importConfigs.js"
5. database_operations: "Batch processing with 100 records per batch using appropriate service methods"
6. error_collection: "Failed records collected in original CSV format with error column and detailed messages"

### authentication_flow:
1. user_request: "POST /api/auth/login with username and password"
2. credential_validation: "authService.validateCredentials checks against environment variables"
3. token_generation: "authService.generateToken creates JWT with 24-hour expiration"
4. cookie_setting: "Set httpOnly cookie for web interface authentication"
5. response_delivery: "JSON response with token, user info, success status, and redirect URL"
6. api_usage: "Client uses token in Authorization: Bearer header for protected endpoints"
