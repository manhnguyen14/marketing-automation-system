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
- src/modules/data-import/controllers/
- src/modules/data-import/services/
- src/modules/data-import/validators/
- src/modules/data-import/routes/
- src/shared/
- src/shared/middleware/
- src/shared/utils/
- src/config/
- public/
- public/css/
- scripts/
- tests/
- tests/unit/
- tests/unit/core/
- tests/unit/core/auth/
- tests/unit/core/database/
- tests/unit/modules/
- tests/unit/modules/admin/
- tests/unit/modules/data-import/
- tests/integration/
- tests/fixtures/

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
- src/modules/admin/controllers/importUIController.js
- src/modules/admin/views/layouts/main.hbs
- src/modules/admin/views/login.hbs
- src/modules/admin/views/dashboard.hbs
- src/modules/admin/views/error.hbs
- src/modules/admin/routes/index.js
- src/modules/admin/index.js
- src/modules/data-import/controllers/importController.js
- src/modules/data-import/services/csvImportService.js
- src/modules/data-import/services/dataValidationService.js
- src/modules/data-import/validators/csvValidator.js
- src/modules/data-import/validators/dataValidator.js
- src/modules/data-import/routes/index.js
- src/modules/data-import/index.js
- src/shared/middleware/errorHandler.js
- src/shared/middleware/fileUpload.js
- src/shared/middleware/fileValidator.js
- public/css/admin.css
- scripts/migrate.js
- scripts/db-status.js
- scripts/db-reset.js
- scripts/seed-data.js
- tests/unit/core/auth/authService.test.js
- tests/unit/core/auth/authController.test.js
- tests/unit/core/auth/authMiddleware.test.js
- tests/unit/core/database/customerService.test.js
- tests/unit/core/database/models/Customer.test.js
- tests/unit/modules/admin/authUIController.test.js
- tests/unit/modules/admin/dashboardController.test.js
- tests/unit/modules/data-import/csvImportService.test.js
- tests/unit/modules/data-import/dataValidationService.test.js
- tests/unit/modules/data-import/csvValidator.test.js
- tests/integration/auth-flow.test.js
- tests/integration/database-operations.test.js
- tests/integration/admin-interface.test.js
- tests/integration/api-endpoints.test.js
- tests/integration/csv-import-flow.test.js
- tests/fixtures/testData.js
- tests/fixtures/mockUsers.json
- tests/fixtures/sampleCustomers.json

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
- src/modules/admin/controllers/importUIController.js: "Admin CSV import interface with file upload, template download, and session-based messaging"
- src/modules/admin/views/layouts/main.hbs: "Base HTML template with navigation including Data Import link"
- src/modules/admin/views/login.hbs: "Login form with client-side validation and error handling (unchanged)"
- src/modules/admin/views/dashboard.hbs: "Admin dashboard with system status and feature overview (unchanged)"
- src/modules/admin/views/error.hbs: "Error page template for HTTP errors and exceptions (unchanged)"
- src/modules/admin/routes/index.js: "Admin interface URL routing with CSV import routes and file upload middleware"
- src/modules/admin/index.js: "Admin module exports aggregation (unchanged)"
- src/modules/data-import/controllers/importController.js: "CSV import API endpoints with validation, template generation, and configuration"
- src/modules/data-import/services/csvImportService.js: "Core CSV import processing with batch operations and partial import support"
- src/modules/data-import/services/dataValidationService.js: "File validation, preview generation, and comprehensive data validation"
- src/modules/data-import/validators/csvValidator.js: "CSV file structure and header validation (Stages 1-2)"
- src/modules/data-import/validators/dataValidator.js: "Row-by-row data validation with business logic checking (Stage 3)"
- src/modules/data-import/routes/index.js: "Data import API routes with authentication and file upload middleware"
- src/modules/data-import/index.js: "Data import module aggregation with initialization and status management"
- src/shared/middleware/errorHandler.js: "Global error handling for API and web requests (unchanged)"
- src/shared/middleware/fileUpload.js: "Multer configuration for CSV file uploads with security validation"
- src/shared/middleware/fileValidator.js: "File validation middleware with MIME type and content checking"
- public/css/admin.css: "Complete responsive styling for admin interface with data import styles"
- scripts/migrate.js: "Migration execution script with status reporting"
- scripts/db-status.js: "Database connection and migration status checking script"
- scripts/db-reset.js: "Database reset script with confirmation prompts"
- scripts/seed-data.js: "Sample data generation script for development"

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

### data_import_components:
- src/modules/data-import/controllers/importController.js:
  - primary_function: "CSV import API endpoints and template generation"
  - key_responsibilities: ["file_upload_handling", "validation_orchestration", "template_generation", "configuration_endpoints"]
  - dependencies: ["csvImportService", "dataValidationService"]
  - used_by: ["API_clients", "admin_interface"]

- src/modules/data-import/services/csvImportService.js:
  - primary_function: "Core CSV processing with partial import support"
  - key_responsibilities: ["csv_parsing", "batch_processing", "database_operations", "error_collection"]
  - dependencies: ["dataValidator", "csvValidator", "core/database"]
  - used_by: ["importController", "importUIController"]

- src/modules/data-import/services/dataValidationService.js:
  - primary_function: "File validation and data preview generation"
  - key_responsibilities: ["file_format_validation", "preview_generation", "error_formatting", "configuration_validation"]
  - dependencies: ["csvValidator", "dataValidator"]
  - used_by: ["importController", "csvImportService"]

- src/modules/data-import/validators/csvValidator.js:
  - primary_function: "CSV structure and header validation (Stages 1-2 - fatal errors)"
  - key_responsibilities: ["file_format_checking", "header_validation", "csv_structure_parsing", "encoding_validation"]
  - dependencies: ["csv-parser"]
  - used_by: ["dataValidationService"]

- src/modules/data-import/validators/dataValidator.js:
  - primary_function: "Row-by-row data validation (Stage 3 - partial import)"
  - key_responsibilities: ["email_validation", "duplicate_detection", "field_validation", "error_report_generation"]
  - dependencies: ["core/database"]
  - used_by: ["csvImportService"]

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
- modules_admin_exports: ["authUIController", "dashboardController", "importUIController", "routes"]
- modules_data_import_exports: ["importController", "csvImportService", "dataValidationService", "validators", "routes"]

### module_communication:
- admin_module_uses: ["core/auth for authentication", "core/database for data access", "shared/middleware for error handling", "data-import for import functionality"]
- data_import_module_uses: ["core/auth for route protection", "core/database for customer operations", "shared/middleware for file handling"]
- auth_module_provides: ["JWT token management", "route protection", "session handling"]
- database_module_provides: ["data persistence", "customer management", "analytics queries", "migration system"]
- shared_middleware_provides: ["error handling", "file upload processing", "validation utilities"]

## ROUTE_ARCHITECTURE

### api_routes:
- base_path: "/api/"
- authentication_routes:
  - POST /api/auth/login: "Admin authentication endpoint with credential validation"
  - GET /api/auth/logout: "Session termination and cookie clearing"
  - GET /api/auth/verify: "Token validation and user context retrieval"
- data_import_routes:
  - POST /api/data-import/customers/upload: "CSV file upload and import processing"
  - POST /api/data-import/customers/validate: "CSV validation and preview without importing"
  - GET /api/data-import/customers/config: "Import configuration and limits"
  - GET /api/data-import/customers/template: "Download CSV templates"
  - GET /api/data-import/health: "Data import module health check"
- system_routes:
  - GET /api/health: "System health check with database connectivity status"

### admin_interface_routes:
- base_path: "/admin/"
- public_routes:
  - GET /admin/login: "Login page rendering (redirects if authenticated)"
- protected_routes:
  - GET /admin/dashboard: "Main admin dashboard (requires authentication)"
  - GET /admin/import/customers: "CSV import interface"
  - POST /admin/import/customers/upload: "Handle CSV file upload from admin interface"
  - GET /admin/import/customers/template: "Download CSV template files"
  - GET /admin/: "Redirects to dashboard"
- root_routes:
  - GET /: "Redirects to admin dashboard"

### middleware_application:
- public_routes: ["/api/auth/login", "/api/health", "/api/data-import/health"]
- redirect_routes: ["/admin/login uses redirectIfAuthenticated"]
- protected_routes: ["all /admin/* routes except login use requireAuth", "all /api/data-import/* routes use requireAuth"]
- file_upload_routes: ["/admin/import/customers/upload uses multer", "/api/data-import/customers/upload uses fileUpload middleware"]
- error_handling: ["global errorHandler for all routes", "multer error handling for file uploads"]

## DATA_FLOW_SEQUENCES

### csv_import_flow:
1. user_request: "POST /admin/import/customers/upload with CSV file"
2. middleware_processing: "authMiddleware.requireAuth → multer file upload → fileValidator validation"
3. stage_1_validation: "File format, size (2MB), and basic accessibility checking"
4. stage_2_validation: "CSV structure, headers, and required columns validation"
5. stage_3_processing: "Row-by-row data validation with partial import support"
6. database_operations: "customerService.createCustomer() or updateCustomer() for valid records"
7. result_generation: "Success summary + error report in original CSV format"
8. response_delivery: "Session flash messages + redirect to import page"

### data_validation_stages:
1. file_validation: "fileValidator.validateCSVFile() checks format and security"
2. csv_structure: "csvValidator.validateCSVStructure() verifies headers and structure"
3. data_processing: "dataValidator.validateRowData() with automatic whitespace trimming"
4. business_logic: "Email uniqueness validation (only business logic rule)"
5. database_operations: "Batch processing with 100 records per batch"
6. error_collection: "Failed records collected in original CSV format with error column"

### authentication_flow:
1. user_request: "GET /admin/dashboard"
2. middleware_check: "authMiddleware.requireAuth validates token"
3. token_validation: "authService.verifyToken checks JWT"
4. route_access: "dashboardController.showDashboard renders page"
5. template_render: "dashboard.hbs with user context and navigation including Data Import link"

## TESTING_STRUCTURE

### directories:
- tests/unit/core/database: "Database model and service unit tests"
- tests/unit/modules/admin: "Admin interface controller tests"
- tests/unit/modules/data-import: "CSV import functionality unit tests"
- tests/integration: "End-to-end workflow tests"
- tests/fixtures: "Test data and mock objects"

### test_coverage_areas:
- csv_import_validation: "Stage 1-3 validation testing with various file types"
- partial_import_scenarios: "Mixed valid/invalid data processing"
- security_validation: "File upload security and malicious content detection"
- database_operations: "Customer CRUD operations with import compatibility"
- error_handling: "Comprehensive error scenario testing"
- session_management: "Flash message and redirect testing"

## EXTENSION_PATTERNS

### adding_new_import_type:
1. create_validator: "src/modules/data-import/validators/newTypeValidator.js"
2. extend_service: "Add new import type support to csvImportService.js"
3. update_controller: "Add new endpoints to importController.js"
4. add_templates: "Create CSV templates for new data type"
5. update_routes: "Register new import endpoints"
6. add_admin_interface: "Create admin UI for new import type"

### adding_new_validation_rule:
1. update_dataValidator: "Add new validation method to dataValidator.js"
2. integrate_validation: "Call validation in validateRowData() method"
3. update_error_reporting: "Include new validation errors in CSV error report"
4. add_configuration: "Add validation configuration to config/index.js"
5. update_documentation: "Document new validation rule requirements"

### adding_new_database_model:
1. create_model_file: "src/core/database/models/NewModel.js"
2. implement_validation: "business logic methods and data validation"
3. create_migration: "src/core/database/migrations/006_create_new_table.sql"
4. create_service: "src/core/database/services/newModelService.js"
5. update_exports: "src/core/database/index.js includes new service"
6. run_migration: "npm run db:migrate to apply schema changes"
7. add_import_support: "Extend data-import module for new model if needed"

## FUTURE_INTEGRATION_POINTS

### email_campaign_module:
- target_location: "src/modules/email/"
- database_dependencies: ["customers for targeting", "email_records for tracking", "jobs for scheduling"]
- core_dependencies: ["auth for protection", "database for persistence"]
- data_import_integration: ["customer_data from CSV imports", "email_list_management"]
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
- email_validation: "RFC 5322 compliant email format checking"
- duplicate_prevention: "Email uniqueness validation at database level"
- error_information_leakage: "Sanitized error messages without sensitive data exposure"

### authentication_integration:
- route_protection: "All import endpoints require valid JWT authentication"
- session_management: "Express-session for flash message security"
- admin_only_access: "Import functionality restricted to admin role only"
- csrf_protection: "Session-based form submission validation"