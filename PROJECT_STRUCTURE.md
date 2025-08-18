# Project Structure Documentation - AI Agent Optimized

## PROJECT_STRUCTURE

### directories:
- src/
- src/core/
- src/core/auth/
- src/core/auth/controllers/
- src/core/auth/middleware/
- src/core/auth/services/
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
- scripts/setup.js
- tests/unit/core/auth/authService.test.js
- tests/unit/core/auth/authController.test.js
- tests/unit/core/auth/authMiddleware.test.js
- tests/unit/modules/admin/authUIController.test.js
- tests/unit/modules/admin/dashboardController.test.js
- tests/integration/auth-flow.test.js
- tests/integration/admin-interface.test.js
- tests/integration/api-endpoints.test.js
- tests/fixtures/testData.js
- tests/fixtures/mockUsers.json

### file_purposes:
- package.json: "Node.js project configuration with dependencies and scripts"
- .env.example: "Environment variables template with secure defaults"
- src/app.js: "Express application entry point with middleware and route configuration"
- src/config/index.js: "Environment variable validation and configuration export"
- src/core/auth/services/authService.js: "JWT operations, credential validation, token management"
- src/core/auth/controllers/authController.js: "Authentication API endpoints for login/logout/verify"
- src/core/auth/middleware/authMiddleware.js: "Route protection, session management, user context extraction"
- src/core/auth/index.js: "Authentication module exports aggregation"
- src/modules/admin/controllers/authUIController.js: "Login page rendering and UI logic"
- src/modules/admin/controllers/dashboardController.js: "Admin dashboard rendering and data preparation"
- src/modules/admin/views/layouts/main.hbs: "Base HTML template with navigation and common elements"
- src/modules/admin/views/login.hbs: "Login form with client-side validation and error handling"
- src/modules/admin/views/dashboard.hbs: "Admin dashboard with system status and feature overview"
- src/modules/admin/views/error.hbs: "Error page template for HTTP errors and exceptions"
- src/modules/admin/routes/index.js: "Admin interface URL routing and middleware application"
- src/modules/admin/index.js: "Admin module exports aggregation"
- src/shared/middleware/errorHandler.js: "Global error handling for API and web requests"
- public/css/admin.css: "Complete responsive styling for admin interface"
- scripts/setup.js: "Automated project setup with secure default generation"

## MODULE_ARCHITECTURE

### core_modules:
- location: "src/core/"
- purpose: "Essential system infrastructure independent of business features"
- characteristics: ["no_dependencies_on_feature_modules", "provides_foundational_services", "reusable_across_features"]
- current_modules: ["auth"]
- planned_modules: ["database", "scheduler", "pipeline"]

### feature_modules:
- location: "src/modules/"
- purpose: "Business functionality and user interfaces"
- characteristics: ["can_depend_on_core_modules", "no_lateral_dependencies", "implements_business_logic"]
- current_modules: ["admin"]
- planned_modules: ["email", "integration", "analytics"]

### shared_services:
- location: "src/shared/"
- purpose: "Common utilities used across multiple modules"
- characteristics: ["pure_utility_functions", "no_business_logic", "no_module_specific_code"]
- current_services: ["middleware"]
- planned_services: ["validation", "logging", "formatting"]

## DEPENDENCY_RELATIONSHIPS

### dependency_flow:
- feature_modules_depend_on: ["core_modules", "shared_services"]
- core_modules_depend_on: ["config", "external_libraries"]
- shared_services_depend_on: ["external_libraries_only"]
- config_depends_on: ["environment_variables"]

### import_patterns:
- app_js_imports: ["config/index.js", "core/auth", "modules/admin", "shared/middleware/errorHandler"]
- core_auth_exports: ["authService", "authController", "authMiddleware"]
- modules_admin_exports: ["authUIController", "dashboardController", "routes"]

### module_communication:
- admin_module_uses: ["core/auth for authentication", "shared/middleware for error handling"]
- auth_module_provides: ["JWT token management", "route protection", "session handling"]
- shared_middleware_provides: ["error handling", "logging utilities"]

## FILE_RESPONSIBILITIES

### configuration_files:
- src/config/index.js:
    - primary_function: "Environment variable validation and configuration export"
    - key_responsibilities: ["validate_required_env_vars", "export_config_object", "handle_startup_errors"]
    - dependencies: ["dotenv"]
    - used_by: ["all_modules_requiring_configuration"]

- .env.example:
    - primary_function: "Environment variable template and documentation"
    - key_responsibilities: ["document_required_variables", "provide_secure_defaults", "serve_as_deployment_template"]
    - dependencies: []
    - used_by: ["setup_scripts", "deployment_processes"]

### authentication_core_module:
- src/core/auth/services/authService.js:
    - primary_function: "Authentication business logic and JWT operations"
    - key_responsibilities: ["validate_credentials", "generate_jwt_tokens", "verify_tokens", "check_expiration"]
    - dependencies: ["jsonwebtoken", "config"]
    - used_by: ["authController", "authMiddleware"]

- src/core/auth/controllers/authController.js:
    - primary_function: "Authentication API endpoints"
    - key_responsibilities: ["handle_login_requests", "process_logout", "provide_token_verification", "set_secure_cookies"]
    - dependencies: ["authService"]
    - used_by: ["express_router", "admin_interface"]

- src/core/auth/middleware/authMiddleware.js:
    - primary_function: "Route protection and session management"
    - key_responsibilities: ["protect_routes", "redirect_authenticated_users", "extract_user_context", "handle_token_validation"]
    - dependencies: ["authService"]
    - used_by: ["express_routes", "admin_module"]

### admin_interface_module:
- src/modules/admin/controllers/authUIController.js:
    - primary_function: "Authentication user interface rendering"
    - key_responsibilities: ["render_login_page", "handle_login_ui_logic", "provide_template_context"]
    - dependencies: []
    - used_by: ["admin_routes"]

- src/modules/admin/controllers/dashboardController.js:
    - primary_function: "Admin dashboard rendering"
    - key_responsibilities: ["render_dashboard", "provide_system_status", "handle_user_context"]
    - dependencies: []
    - used_by: ["admin_routes"]

- src/modules/admin/views/layouts/main.hbs:
    - primary_function: "Base template layout for admin interface"
    - key_responsibilities: ["provide_html_structure", "include_navigation", "handle_conditional_content", "link_resources"]
    - dependencies: ["admin.css"]
    - used_by: ["all_admin_view_templates"]

- src/modules/admin/routes/index.js:
    - primary_function: "Admin interface URL routing"
    - key_responsibilities: ["define_routes", "apply_middleware", "map_urls_to_controllers", "handle_redirects"]
    - dependencies: ["authMiddleware", "UI_controllers"]
    - used_by: ["app.js"]

## ROUTE_ARCHITECTURE

### api_routes:
- base_path: "/api/"
- authentication_routes:
    - POST /api/auth/login: "Admin authentication endpoint with credential validation"
    - GET /api/auth/logout: "Session termination and cookie clearing"
    - GET /api/auth/verify: "Token validation and user context retrieval"
- system_routes:
    - GET /api/health: "System health check and status information"

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

### login_process:
1. form_submission: "POST /api/auth/login with credentials"
2. credential_validation: "authService.validateCredentials against env vars"
3. token_generation: "authService.generateToken creates JWT"
4. cookie_setting: "HTTP-only secure cookie with token"
5. client_redirect: "JavaScript redirect to dashboard"

### session_management:
1. cookie_extraction: "authMiddleware reads auth_token cookie"
2. token_verification: "authService.verifyToken validates JWT"
3. expiration_check: "authService.isTokenExpired checks validity"
4. user_context: "req.user populated with token data"
5. route_continuation: "next() or redirect to login"

## EXTENSION_PATTERNS

### adding_new_feature_module:
1. create_directory: "src/modules/new-feature/"
2. implement_structure: ["controllers/", "services/", "routes/", "views/"]
3. add_exports: "index.js with module aggregation"
4. register_routes: "app.js route registration"
5. add_dependencies: "import from core/ modules as needed"

### adding_new_core_module:
1. create_directory: "src/core/new-core/"
2. implement_structure: ["services/", "controllers/", "middleware/"]
3. ensure_independence: "no dependencies on feature modules"
4. add_exports: "index.js with module aggregation"
5. update_imports: "feature modules import as needed"

### adding_shared_service:
1. create_directory: "src/shared/new-service/"
2. implement_utilities: "pure utility functions only"
3. no_business_logic: "avoid module-specific code"
4. export_functions: "clear function exports"
5. import_usage: "import where needed with clear dependencies"

## FUTURE_INTEGRATION_POINTS

### database_integration:
- target_location: "src/core/database/"
- required_components: ["connection.js", "models/", "services/", "migrations/"]
- integration_points: ["update authService to use database", "user model for authentication"]
- dependency_changes: ["core auth depends on core database"]

### email_campaign_module:
- target_location: "src/modules/email/"
- required_components: ["controllers/", "services/", "templates/", "routes/"]
- integration_points: ["depends on core auth for protection", "uses core database for data"]
- new_routes: ["/admin/campaigns", "/api/email/send", "/api/email/templates"]

### job_scheduler_core:
- target_location: "src/core/scheduler/"
- required_components: ["services/", "models/", "cron/", "queue/"]
- integration_points: ["used by email module for automation", "depends on database for persistence"]
- background_services: ["cron jobs", "task processing", "retry mechanisms"]

## TESTING_STRUCTURE

### directories:
- tests/
- tests/unit/
- tests/unit/core/
- tests/unit/core/auth/
- tests/unit/modules/
- tests/unit/modules/admin/
- tests/integration/
- tests/fixtures/

### test_files:
- tests/unit/core/auth/authService.test.js: "Test JWT operations and credential validation"
- tests/unit/core/auth/authController.test.js: "Test API endpoints with mock requests"
- tests/unit/core/auth/authMiddleware.test.js: "Test route protection and session handling"
- tests/unit/modules/admin/authUIController.test.js: "Test login page rendering"
- tests/unit/modules/admin/dashboardController.test.js: "Test dashboard rendering with user context"
- tests/integration/auth-flow.test.js: "Test complete login/logout user journey"
- tests/integration/admin-interface.test.js: "Test admin interface navigation and protection"
- tests/integration/api-endpoints.test.js: "Test API endpoints with real HTTP requests"
- tests/fixtures/testData.js: "Mock data for testing scenarios"
- tests/fixtures/mockUsers.json: "Test user data for authentication tests"

### testing_patterns:
- unit_testing: ["test individual components in isolation", "mock external dependencies", "focus on business logic"]
- integration_testing: ["test component interactions", "use test database", "verify complete workflows"]
- mock_strategy: ["mock JWT operations", "mock environment variables", "mock external APIs"]
- coverage_targets: ["80% for core modules", "70% for feature modules", "90% for critical paths"]

## DEVELOPMENT_GUIDELINES

### code_organization_principles:
- single_responsibility: "Each file handles one major concern"
- consistent_structure: "All modules follow same organization pattern"
- clear_naming: "File names describe specific purpose"
- minimal_dependencies: "Reduce coupling between modules"

### module_creation_checklist:
1. determine_module_type: "core infrastructure or business functionality"
2. create_structure: "appropriate directory structure following patterns"
3. implement_components: "controllers, services, routes as needed"
4. update_exports: "module index.js with clean interface"
5. register_integration: "routes in app.js, dependencies in imports"

### dependency_management_rules:
- upward_dependencies_only: "feature modules can depend on core modules"
- no_lateral_dependencies: "feature modules cannot depend on other feature modules"
- shared_service_extraction: "common functionality goes to shared services"
- clear_import_paths: "explicit imports showing module relationships"

This structure provides comprehensive guidance for AI agents to understand, extend, and maintain the project while following established architectural patterns.