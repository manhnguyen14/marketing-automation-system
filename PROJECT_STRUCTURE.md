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
- src/core/auth/controllers/authController.js
- src/core/auth/middleware/authMiddleware.js
- src/core/auth/services/authService.js
- src/core/auth/index.js
- src/core/database/connection.js
- src/core/database/migrationRunner.js
- src/core/database/models/Customer.js
- src/core/database/models/Book.js
- src/core/database/models/Job.js
- src/core/database/models/EmailRecord.js
- src/core/database/services/customerService.js
- src/core/database/services/bookService.js
- src/core/database/migrations/000_create_schema_migrations.sql
- src/core/database/migrations/001_create_customers.sql
- src/core/database/migrations/002_create_books.sql
- src/core/database/migrations/004_create_jobs.sql
- src/core/database/migrations/005_create_email_records.sql
- src/core/database/index.js
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
- package.json: "Node.js project configuration with dependencies including PostgreSQL driver, multer, csv-parser, express-session"
- .env.example: "Environment variables template including database and data import configuration"
- src/app.js: "Express application entry point with database initialization, data import module, session middleware, and enhanced health check"
- src/config/index.js: "Environment variable validation including database and data import configuration"
- src/core/auth/services/authService.js: "JWT operations, credential validation, token management (unchanged)"
- src/core/auth/controllers/authController.js: "Authentication API endpoints for login/logout/verify (unchanged)"
- src/core/auth/middleware/authMiddleware.js: "Route protection, session management, user context extraction (unchanged)"
- src/core/auth/index.js: "Authentication module exports aggregation (unchanged)"
- src/core/database/connection.js: "PostgreSQL connection management with SSL support and connection pooling"
- src/core/database/migrationRunner.js: "Database migration execution, tracking, and rollback functionality"
- src/core/database/models/Customer.js: "Customer data model with validation, business logic methods, and email update support"
- src/core/database/models/Book.js: "Book catalog model with search and categorization methods"
- src/core/database/models/Job.js: "Scheduled job model with status management and retry logic"
- src/core/database/models/EmailRecord.js: "Email campaign tracking model with engagement analytics"
- src/core/database/services/customerService.js: "Customer CRUD operations, marketing queries, and import-compatible methods"
- src/core/database/services/bookService.js: "Book management operations and recommendation queries"
- src/core/database/migrations/000_create_schema_migrations.sql: "Migration tracking table creation"
- src/core/database/migrations/001_create_customers.sql: "Customer table creation with indexes and constraints (no company field)"
- src/core/database/migrations/002_create_books.sql: "Books table creation with categorization support"
- src/core/database/migrations/004_create_jobs.sql: "Job scheduling table for email automation"
- src/core/database/migrations/005_create_email_records.sql: "Email campaign tracking table with Postmark integration"
- src/core/database/index.js: "Database module exports and initialization coordination"
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
- current_modules: ["auth", "database"]
- planned_modules: ["scheduler", "pipeline", "email"]

### feature_modules:
- location: "src/modules/"
- purpose: "Business functionality and user interfaces"
- characteristics: ["can_depend_on_core_modules", "no_lateral_dependencies", "implements_business_logic"]
- current_modules: ["admin", "data-import"]
- planned_modules: ["email_management", "analytics"]

### shared_services:
- location: "src/shared/"
- purpose: "Common utilities used across multiple modules"
- characteristics: ["pure_utility_functions", "no_business_logic", "no_module_specific_code"]
- current_services: ["middleware"]
- planned_services: ["validation", "logging", "formatting"]

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
- characteristics: ["connection_management", "migration_system", "data_models", "business_services"]

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

- src/core/database/models/Job.js:
  - primary_function: "Scheduled job management for automation"
  - key_responsibilities: ["status_tracking", "execution_timing", "retry_logic", "performance_metrics"]
  - dependencies: []
  - used_by: ["job_scheduler", "email_campaigns", "pipeline_automation"]

- src/core/database/models/EmailRecord.js:
  - primary_function: "Email campaign tracking and analytics"
  - key_responsibilities: ["delivery_tracking", "engagement_metrics", "postmark_integration", "campaign_analytics"]
  - dependencies: []
  - used_by: ["email_service", "campaign_reporting", "customer_engagement"]

### data_services:
- src/core/database/services/customerService.js:
  - primary_function: "Customer CRUD operations and marketing queries"
  - key_responsibilities: ["customer_management", "targeting_queries", "segmentation", "bulk_operations", "import_support"]
  - import_compatibility: ["email_update_support", "company_field_removed", "validation_updates"]
  - dependencies: ["connection", "Customer_model"]
  - used_by: ["marketing_campaigns", "admin_interface", "data_import"]

- src/core/database/services/bookService.js:
  - primary_function: "Book catalog management and recommendation queries"
  - key_responsibilities: ["catalog_management", "search_operations", "recommendation_logic", "genre_analytics"]
  - dependencies: ["connection", "Book_model"]
  - used_by: ["content_recommendations", "admin_interface", "activity_tracking"]

## DEPENDENCY_RELATIONSHIPS

### dependency_flow:
- feature_modules_depend_on: ["core_modules", "shared_services"]
- core_modules_depend_on: ["config", "external_libraries"]
- shared_services_depend_on: ["external_libraries_only"]
- config_depends_on: ["environment_variables"]
- database_depends_on: ["postgresql", "connection_pooling"]
- data_import_depends_on: ["core/database", "core/auth", "shared/middleware"]

### import_patterns:
- app_js_imports: ["config/index.js", "core/auth", "core/database", "modules/admin", "modules/data-import", "shared/middleware/errorHandler"]
- core_auth_exports: ["authService", "authController", "authMiddleware"]
- core_database_exports: ["connection", "models", "services", "migrationRunner", "initialize"]
- modules_admin_exports: ["authUIController", "dashboardController", "genericImportUIController", "routes"]
- modules_data_import_exports: ["genericImportController", "genericImportService", "dataValidationService", "validators", "config", "routes"]

### module_communication:
- admin_module_uses: ["core/auth for authentication", "core/database for data access", "shared/middleware for error handling", "data-import for import functionality"]
- data_import_module_uses: ["core/auth for route protection", "core/database for entity operations", "shared/middleware for file handling"]
- auth_module_provides: ["JWT token management", "route protection", "session handling"]
- database_module_provides: ["data persistence", "entity management", "analytics queries", "migration system"]
- shared_middleware_provides: ["error handling", "file upload processing", "validation utilities"]

## ROUTE_ARCHITECTURE

### api_routes:
- base_path: "/api/"
- authentication_routes:
  - POST /api/auth/login: "Admin authentication endpoint with credential validation"
  - GET /api/auth/logout: "Session termination and cookie clearing"
  - GET /api/auth/verify: "Token validation and user context retrieval"
- data_import_routes:
  - POST /api/data-import/:entity/upload: "CSV file upload and import processing for any entity"
  - POST /api/data-import/:entity/validate: "CSV validation and preview without importing"
  - GET /api/data-import/:entity/config: "Import configuration and limits for specific entity"
  - GET /api/data-import/:entity/template: "Download CSV templates for specific entity"
  - GET /api/data-import/entities: "Get list of available importable entities"
  - GET /api/data-import/health: "Data import module health check"
- system_routes:
  - GET /api/health: "System health check with database connectivity status"

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
- public_routes: ["/api/auth/login", "/api/health", "/api/data-import/health"]
- redirect_routes: ["/admin/login uses redirectIfAuthenticated"]
- protected_routes: ["all /admin/* routes except login use requireAuth", "all /api/data-import/* routes use requireAuth"]
- file_upload_routes: ["/admin/import-data/:entity/upload uses multer", "/api/data-import/:entity/upload uses fileUpload middleware"]
- file_validation: ["all file upload routes use fileValidator for security and format validation"]
- error_handling: ["global errorHandler for all routes", "multer error handling for file uploads"]

## DATA_FLOW_SEQUENCES

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

### data_validation_stages:
1. file_validation: "fileValidator.validateCSVFile() checks format and security"
2. csv_structure: "csvValidator.validateCSVStructure() verifies headers and structure against entity configuration"
3. data_processing: "genericValidator.validateRowData() with automatic whitespace trimming and type conversion"
4. business_logic: "Entity-specific validation rules from importConfigs.js"
5. database_operations: "Batch processing with 100 records per batch using appropriate service methods"
6. error_collection: "Failed records collected in original CSV format with error column and detailed messages"

### authentication_flow:
1. user_request: "GET /admin/dashboard"
2. middleware_check: "authMiddleware.requireAuth validates token"
3. token_validation: "authService.verifyToken checks JWT"
4. route_access: "dashboardController.showDashboard renders page"
5. template_render: "dashboard.hbs with user context and navigation including Data Import link"

## FUTURE_INTEGRATION_POINTS

### email_campaign_module:
- target_location: "src/modules/email/"
- database_dependencies: ["customers for targeting", "email_records for tracking", "jobs for scheduling"]
- core_dependencies: ["auth for protection", "database for persistence"]
- data_import_integration: ["entity data from generic import system", "email_list_management"]
- new_tables: ["ai_content_review", "email_templates", "campaign_batches"]

### job_scheduler_core:
- target_location: "src/core/scheduler/"
- database_dependencies: ["jobs table for persistence", "email_records for tracking"]
- integration_points: ["email module for execution", "pipeline module for triggers", "data-import for batch operations"]
- cron_functionality: ["minute-based execution", "retry mechanisms", "status tracking"]

### external_integrations:
- postmark_integration: "email sending and tracking via API"
- gemini_ai_integration: "content generation with customer personalization"
- crm_synchronization: "customer data import and synchronization via API"
- analytics_reporting: "performance metrics and customer insights including import statistics"

## SECURITY_CONSIDERATIONS

### file_upload_security:
- file_type_validation: "CSV-only uploads with MIME type checking"
- file_size_limits: "2MB maximum file size enforcement"
- content_scanning: "Malicious pattern detection in CSV content"
- filename_validation: "Path traversal and dangerous character prevention"
- memory_storage: "Direct processing without temporary file storage"

### data_validation_security:
- input_sanitization: "Automatic whitespace trimming and data cleaning"
- sql_injection_prevention: "Parameterized queries in all database operations"
- field_validation: "Entity-specific validation rules from importConfigs.js"
- duplicate_prevention: "Uniqueness validation at database level based on entity configuration"
- error_information_leakage: "Sanitized error messages without sensitive data exposure"

### authentication_integration:
- route_protection: "All import endpoints require valid JWT authentication"
- session_management: "Express-session for flash message security"
- admin_only_access: "Import functionality restricted to admin role only"
- csrf_protection: "Session-based form submission validation"
