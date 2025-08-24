# Marketing Automation System

A Node.js-based marketing automation platform with pipeline-driven email campaigns, AI content generation, and customer management.

## Features

- **Pipeline-Based Marketing Automation**: Code-based workflows for customer engagement
- **AI Content Generation**: Personalized email content using AI with admin approval
- **Customer Management**: Import and manage customer data with segmentation
- **Email Campaign Management**: Template-based email sending with tracking
- **Admin Interface**: Web-based dashboard for managing all system operations

## System Architecture

### Core Modules
- **Database**: PostgreSQL with migrations and data models
- **Authentication**: JWT-based admin authentication
- **Email Service**: Postmark integration for reliable email delivery
- **Pipeline System**: Marketing automation workflows with queue processing

### Feature Modules
- **Admin Interface**: Web dashboard for system management
- **Data Import**: CSV-based customer and book data import
- **Template Management**: Email template creation and approval workflow

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- Postmark account for email sending

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd marketing-automation-system
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/marketing_automation

# Admin Access
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_32_characters_minimum

# Email Service
POSTMARK_TOKEN=your_postmark_server_token
POSTMARK_FROM_EMAIL=noreply@yourdomain.com

# AI Service (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

5. Initialize database:
```bash
npm run db:migrate
```

6. Start the server:
```bash
npm start
```

7. Access the admin interface:
```
http://localhost:3000/admin/login
```

## Pipeline System

### Available Pipelines

**Daily Motivation Pipeline** (`DAILY_MOTIVATION`)
- **Type**: AI-generated templates
- **Target**: Engaged readers with recent activity
- **Process**: AI generates personalized motivation emails → Admin review → Scheduled sending

**New Book Release Pipeline** (`NEW_BOOK_RELEASE`)
- **Type**: Predefined templates
- **Target**: Customers interested in book topics/genres
- **Process**: Customer selection → Immediate email sending using approved template

### Pipeline Workflow

1. **Pipeline Execution**: Admin triggers pipeline or scheduled execution
2. **Customer Selection**: Pipeline selects target customers based on criteria
3. **Queue Item Creation**: Creates email queue items with status:
   - Predefined templates: `SCHEDULED` (ready to send)
   - AI templates: `WAIT_GENERATE_TEMPLATE`
4. **Template Generation** (AI only): Creates personalized content → `PENDING_REVIEW`
5. **Admin Review** (AI only): Approve/reject templates → `SCHEDULED`
6. **Email Sending**: Queue processor sends `SCHEDULED` emails → `SENT`

### Creating Custom Pipelines

1. Create pipeline class extending `PipelineInterface`:
```javascript
const PipelineInterface = require('../core/pipeline.js/pipelines/PipelineInterface');

class CustomPipeline extends PipelineInterface {
    constructor() {
        super();
        this.pipelineName = 'CUSTOM_PIPELINE';
        this.templateType = 'predefined'; // or 'ai_generated'
        this.defaultTemplateId = 123; // for predefined templates
    }

    async runPipeline() {
        return await this.createQueueItems();
    }

    async createQueueItems() {
        // Select target customers
        const customers = await this.selectTargetCustomers();
        
        // Create queue items
        const queueItems = customers.map(customer => 
            this.createQueueItemData(customer, {
                variables: { /* template variables */ },
                tag: 'custom_tag'
            })
        );
        
        return await this.bulkCreateQueueItems(queueItems);
    }

    async selectTargetCustomers() {
        // Implement customer selection logic
        const customerService = this.getCustomerService();
        return await customerService.getActiveCustomers({ limit: 100 });
    }
}
```

2. Register in pipeline registry (`src/core/pipeline/services/pipelineRegistry.js`)

## API Endpoints

### Pipeline Management
- `GET /api/pipeline/pipelines` - List available pipelines
- `POST /api/pipeline/pipelines/{name}/execute` - Execute pipeline
- `GET /api/pipeline/dashboard` - Pipeline dashboard data
- `GET /api/pipeline/queue` - View email queue
- `GET /api/pipeline/queue/review` - Templates awaiting review

### Email Operations
- `POST /api/email/send` - Send single email
- `POST /api/email/send-batch` - Send batch emails
- `POST /api/email/process-queue` - Process email queue
- `POST /api/email/preview` - Preview template

### Template Management
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/{id}` - Update template

### Data Import
- `POST /api/data-import/customers/upload` - Import customer data
- `GET /api/data-import/customers/template` - Download CSV template

## Database Schema

### Core Tables
- `customers` - Customer information and preferences
- `books` - Book catalog for ebook platform
- `email_templates` - Email templates (predefined and AI-generated)
- `email_records` - Email delivery tracking
- `email_queue_items` - Pipeline email queue
- `pipeline_execution_log` - Pipeline run history

## Development

### Running in Development
```bash
npm run dev          # Start with nodemon
npm run db:migrate   # Run database migrations  
npm run db:reset     # Reset database (development only)
npm run db:seed      # Add sample data
```

### Environment Variables

**Required:**
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD` - Admin login password
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `DATABASE_URL` - PostgreSQL connection string

**Email Service:**
- `POSTMARK_TOKEN` - Postmark server token
- `POSTMARK_FROM_EMAIL` - Default sender email

**Pipeline System:**
- `MAX_TEMPLATE_RETRIES=3` - AI generation retry limit
- `QUEUE_SCAN_INTERVAL_SECONDS=60` - Background queue processing
- `GEMINI_API_KEY` - Google Gemini AI API key

**Development:**
- `PIPELINE_DEBUG=true` - Enable debug logging
- `MOCK_AI_GENERATION=true` - Use mock AI content

## Deployment

### Railway Platform
1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Setup
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...` (Railway PostgreSQL)
- Configure all required environment variables

## Project Structure

```
src/
├── core/                    # Core system modules
│   ├── auth/               # Authentication
│   ├── database/           # Database models and services
│   ├── email/              # Email service integration
│   └── pipeline/           # Pipeline automation system
├── modules/                # Feature modules
│   ├── admin/              # Admin web interface
│   ├── data-import/        # CSV data import
│   └── template-management/ # Template management
├── shared/                 # Shared utilities
├── config/                 # Configuration management
└── app.js                  # Application entry point
```

## Contributing

1. Follow existing code patterns and conventions
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure database migrations are reversible

## License

This project is proprietary software. All rights reserved.