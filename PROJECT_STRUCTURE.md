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
- src/shared/
- src/shared/middleware/
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
- src/core/database/models/ReadingActivity.js
- src/core/database/models/Job.js
- src/core/database/models/EmailRecord.js
- src/core/database/services/customerService.js
- src/core/database/services/bookService.js
- src/core/database/services/activityService.js
- src/core/database/migrations/000_create_schema_migrations.sql
- src/core/database/migrations/001_create_customers.sql
- src/core/database/migrations/002_create_books.sql
- src/core/database/migrations/003_create_reading_activities.sql
- src/core/database/migrations/004_create_jobs.sql
- src/core/database/migrations/005_create_email_records.sql
- src/core/database/index.js
- src/modules/admin/controllers/authUIController.js
- src/modules/admin/controllers/dashboardController.js
- src/modules/admin/views/layouts/main.hbs
- src/modules/admin/views/login.hbs
- src/modules/admin/views/dashboard.hbs
- src/modules/admin/views/error.hbs
- src/modules/admin/routes/index.js
- src/modules/admin/index.js
- src/shared/middleware/errorHandler.js
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
- tests/integration/auth-flow.test.js
- tests/integration/database-operations.test.js
- tests/integration/admin-interface.test.js
- tests/integration/api-endpoints.test.js
- tests/fixtures/testData.js
- tests/fixtures/mockUsers.json
- tests/fixtures/sampleCustomers.json

### file_purposes:
- package.json: "Node.js project configuration with dependencies including PostgreSQL driver"
- .env.example: "Environment variables template including database configuration"
- src/app.js: "Express application entry point with database initialization and enhanced health check"
- src/config/index.js: "Environment variable validation including database configuration"
- src/core/auth/services/authService.js: "JWT operations, credential validation, token management (unchanged)"
- src/core/auth/controllers/authController.js: "Authentication API endpoints for login/logout/verify (unchanged)"
- src/core/auth/middleware/authMiddleware.js: "Route protection, session management, user context extraction (unchanged)"
- src/core/auth/index.js: "Authentication module exports aggregation (unchanged)"
- src/core/database/connection.js: "PostgreSQL connection management with SSL support and connection pooling"
- src/core/database/migrationRunner.js: "Database migration execution, tracking, and rollback functionality"
- src/core/database/models/Customer.js: "Customer data model with validation and business logic methods"
- src/core/database/models/Book.js: "Book catalog model with search and categorization methods"
- src/core/database/models/ReadingActivity.js: "Reading behavior tracking model with analytics methods"
- src/core/database/models/Job.js: "Scheduled job model with status management and retry logic"
- src/core/database/models/EmailRecord.js: "Email campaign tracking model with engagement analytics"
- src/core/database/services/customerService.js: "Customer CRUD operations and marketing-focused queries"
- src/core/database/services/bookService.js: "Book management operations and recommendation queries"
- src/core/database/services/activityService.js: "Reading activity tracking and behavioral analysis"
- src/core/database/migrations/000_create_schema_migrations.sql: "Migration tracking table creation"
- src/core/database/migrations/001_create_customers.sql: "Customer table creation with indexes and constraints"
- src/core/database/migrations/002_create_books.sql: "Books table creation with categorization support"
- src/core/database/migrations/003_create_reading_activities.sql: "Reading activity tracking table with referential integrity"
- src/core/database/migrations/004_create_jobs.sql: "Job scheduling table for email automation"
- src/core/database/migrations/005_create_email_records.sql: "Email campaign tracking table with Postmark integration"
- src/core/database/index.js: "Database module exports and initialization coordination"
- src/modules/admin/controllers/authUIController.js: "Login page rendering and UI logic (unchanged)"
- src/modules/admin/controllers/dashboardController.js: "Admin dashboard rendering and data preparation (unchanged)"
- src/modules/admin/views/layouts/main.hbs: "Base HTML template with navigation and common elements (unchanged)"
- src/modules/admin/views/login.hbs: "Login form with client-side validation and error handling (unchanged)"
- src/modules/admin/views/dashboard.hbs: "Admin dashboard with system status and feature overview (unchanged)"
- src/modules/admin/views/error.hbs: "Error page template for HTTP errors and exceptions (unchanged)"
- src/modules/admin/routes/index.js: "Admin interface URL routing and middleware application (unchanged)"
- src/modules/admin/index.js: "Admin module exports aggregation (unchanged)"
- src/shared/middleware/errorHandler.js: "Global error handling for API and web requests (unchanged)"
- public/css/admin.css: "Complete responsive styling for admin interface (unchanged)"
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
- current_modules: ["admin"]
- planned_modules: ["email_management", "integration", "analytics"]

### shared_services:
- location: "src/shared/"
- purpose: "Common utilities used across multiple modules"
- characteristics: ["pure_utility_functions", "no_business_logic", "no_module_specific_code"]
- current_services: ["middleware"]
- planned_services: ["validation", "logging", "formatting"]

## DATABASE_ARCHITECTURE

### database_core_module:
- location: "src/core/database/"
- purpose: "PostgreSQL integration and data management foundation"
- characteristics: ["connection_management", "migration_system", "data_models", "business_services"]

### data_models:
- src/core/database/models/Customer.js:
  - primary_function: "Customer data model for marketing automation"
  - key_responsibilities: ["email_validation", "status_management", "topic_interest_matching", "business_logic_methods"]
  - dependencies: []
  - used_by: ["customerService", "email_campaigns", "activity_tracking"]

- src/core/database/models/Book.js:
  - primary_function: "Book catalog model for ebook platform"
  - key_responsibilities: ["title_author_management", "genre_categorization", "topic_matching", "publication_status"]
  - dependencies: []
  - used_by: ["bookService", "reading_activities", "recommendation_engine"]

- src/core/database/models/ReadingActivity.js:
  - primary_function: "Customer reading behavior tracking"
  - key_responsibilities: ["progress_tracking", "activity_type_validation", "engagement_analytics", "completion_detection"]
  - dependencies: []
  - used_by: ["activityService", "marketing_automation", "customer_insights"]

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
  - key_responsibilities: ["customer_management", "targeting_queries", "segmentation", "bulk_operations"]
  - dependencies: ["connection", "Customer_model"]
  - used_by: ["marketing_campaigns", "admin_interface", "data_import"]

- src/core/database/services/bookService.js:
  - primary_function: "Book catalog management and recommendation queries"
  - key_responsibilities: ["catalog_management", "search_operations", "recommendation_logic", "genre_analytics"]
  - dependencies: ["connection", "Book_model"]
  - used_by: ["content_recommendations", "admin_interface", "activity_tracking"]

- src/core/database/services/activityService.js:
  - primary_function: "Reading activity tracking and behavioral analysis"
  - key_responsibilities: ["activity_logging", "progress_tracking", "engagement_analytics", "abandonment_detection"]
  - dependencies: ["connection", "ReadingActivity_model"]
  - used_by: ["marketing_automation", "customer_insights", "recommendation_engine"]

### migration_system:
- src/core/database/migrationRunner.js:
  - primary_function: "Database schema migration management"
  - key_responsibilities: ["migration_execution", "version_tracking", "rollback_support", "status_reporting"]
  - dependencies: ["connection", "filesystem"]
  - used_by: ["application_startup", "deployment_scripts", "development_tools"]

- migration_files:
  - purpose: "SQL schema definitions for database structure"
  - naming_convention: "Sequential numbering (001, 002, 003) with descriptive names"
  - execution_order: "Alphabetical sorting ensures proper dependency resolution"
  - characteristics: ["idempotent", "transactional", "documented", "reversible_tracking"]

## DEPENDENCY_RELATIONSHIPS

### dependency_flow:
- feature_modules_depend_on: ["core_modules", "shared_services"]
- core_modules_depend_on: ["config", "external_libraries"]
- shared_services_depend_on: ["external_libraries_only"]
- config_depends_on: ["environment_variables"]
- database_depends_on: ["postgresql", "connection_pooling"]

### import_patterns:
- app_js_imports: ["config/index.js", "core/auth", "core/database", "modules/admin", "shared/middleware/errorHandler"]
- core_auth_exports: ["authService", "authController", "authMiddleware"]
- core_database_exports: ["connection", "models", "services", "migrationRunner", "initialize"]
- modules_admin_exports: ["authUIController", "dashboardController", "routes"]

### module_communication:
- admin_module_uses: ["core/auth for authentication", "core/database for data access", "shared/middleware for error handling"]
- auth_module_provides: ["JWT token management", "route protection", "session handling"]
- database_module_provides: ["data persistence", "customer management", "analytics queries", "migration system"]
- shared_middleware_provides: ["error handling", "logging utilities"]

## ROUTE_ARCHITECTURE

### api_routes:
- base_path: "/api/"
- authentication_routes:
  - POST /api/auth/login: "Admin authentication endpoint with credential validation"
  - GET /api/auth/logout: "Session termination and cookie clearing"
  - GET /api/auth/verify: "Token validation and user context retrieval"
- system_routes:
  - GET /api/health: "System health check with database connectivity status"

### admin_interface_routes:
- base_path: "/admin/"
- public_routes:
  - GET /admin/login: "Login page rendering (redirects if authenticated)"
- protected_routes:
  - GET /admin/dashboard: "Main admin dashboard (requires authentication)"
  - GET /admin/: "Redirects to dashboard"
- root_routes:
  - GET /: "Redirects to admin dashboard"

### middleware_application:
- public_routes: ["/api/auth/login", "/api/health"]
- redirect_routes: ["/admin/login uses redirectIfAuthenticated"]
- protected_routes: ["/admin/dashboard uses requireAuth"]
- error_handling: ["global errorHandler for all routes"]

## DATA_FLOW_SEQUENCES

### authentication_flow:
1. user_request: "GET /admin/dashboard"
2. middleware_check: "authMiddleware.requireAuth validates token"
3. token_validation: "authService.verifyToken checks JWT"
4. route_access: "dashboardController.showDashboard renders page"
5. template_render: "dashboard.hbs with user context"

### database_initialization_flow:
1. application_startup: "app.js calls database.initialize()"
2. connection_setup: "connection.js establishes PostgreSQL pool"
3. service_initialization: "customerService, bookService, activityService initialize"
4. migration_execution: "migrationRunner.runMigrations() applies schema updates"
5. status_verification: "database.isReady() confirms operational state"

### customer_data_flow:
1. data_request: "customerService.getCustomersForTargeting(criteria)"
2. query_execution: "PostgreSQL query with filtering and pagination"
3. model_creation: "Customer.fromDatabaseRow() for each result"
4. business_logic: "customer.canReceiveEmails() validation"
5. response_formatting: "customer.toJSON() for API response"

## SCRIPT_UTILITIES

### database_management_scripts:
- scripts/migrate.js:
  - primary_function: "Execute pending database migrations"
  - usage: "npm run db:migrate"
  - output: "Migration status and completion confirmation"

- scripts/db-status.js:
  - primary_function: "Display comprehensive database status"
  - usage: "npm run db:status"
  - output: "Connection status, migrations, data statistics"

- scripts/db-reset.js:
  - primary_function: "Reset database with confirmation prompts"
  - usage: "npm run db:reset"
  - output: "Complete database reset and fresh migration execution"

- scripts/seed-data.js:
  - primary_function: "Generate sample data for development"
  - usage: "npm run db:seed"
  - output: "Sample customers, books, and reading activities"

## EXTENSION_PATTERNS

### adding_new_database_model:
1. create_model_file: "src/core/database/models/NewModel.js"
2. implement_validation: "business logic methods and data validation"
3. create_migration: "src/core/database/migrations/006_create_new_table.sql"
4. create_service: "src/core/database/services/newModelService.js"
5. update_exports: "src/core/database/index.js includes new service"
6. run_migration: "npm run db:migrate to apply schema changes"

### adding_new_feature_module:
1. create_directory: "src/modules/new-feature/"
2. implement_structure: ["controllers/", "services/", "routes/", "views/"]
3. database_dependencies: "import database services from core/database"
4. auth_dependencies: "import auth middleware from core/auth"
5. register_routes: "app.js route registration"
6. update_navigation: "admin interface menu updates"

### adding_database_migration:
1. create_migration_file: "src/core/database/migrations/XXX_descriptive_name.sql"
2. write_idempotent_sql: "CREATE TABLE IF NOT EXISTS, ALTER TABLE IF conditions"
3. add_indexes: "CREATE INDEX IF NOT EXISTS for performance"
4. add_comments: "COMMENT ON TABLE/COLUMN for documentation"
5. test_migration: "npm run db:migrate in development"
6. verify_rollback: "ensure migration tracking supports rollback"

## FUTURE_INTEGRATION_POINTS

### email_campaign_module:
- target_location: "src/modules/email/"
- database_dependencies: ["customers for targeting", "email_records for tracking", "jobs for scheduling"]
- core_dependencies: ["auth for protection", "database for persistence"]
- new_tables: ["ai_content_review", "email_templates", "campaign_batches"]

### job_scheduler_core:
- target_location: "src/core/scheduler/"
- database_dependencies: ["jobs table for persistence", "email_records for tracking"]
- integration_points: ["email module for execution", "pipeline module for triggers"]
- cron_functionality: ["minute-based execution", "retry mechanisms", "status tracking"]

### external_integrations:
- postmark_integration: "email sending and tracking via API"
- gemini_ai_integration: "content generation with customer personalization"
- crm_synchronization: "customer data import and synchronization"
- analytics_reporting: "performance metrics and customer insights"

## TESTING_STRUCTURE

### directories:
- tests/unit/core/database