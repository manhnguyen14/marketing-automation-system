# Marketing Automation System

A Node.js-based marketing automation platform designed for ebook platforms to integrate with external data sources, generate customer insights, and execute personalized email campaigns through code-based automation workflows.

## Current System Status

### ✅ Completed Features
- **Authentication System**: Admin login/logout with JWT-based security
- **Database Integration**: PostgreSQL with automated migrations and data models
- **Admin Interface**: Professional responsive dashboard with navigation
- **Customer Management**: Full CRUD operations for marketing targets
- **Book Catalog**: Complete book management system
- **Reading Analytics**: Customer behavior tracking and analysis
- **Migration System**: Automated database schema management
- **Development Tools**: Database seeding, status checking, and reset capabilities

### 📋 Architecture
- **Modular Design**: Clear separation between core infrastructure and business features
- **Database-Driven**: PostgreSQL with comprehensive data models and relationships
- **Scalable Foundation**: Ready for email campaigns, job scheduling, and AI integration

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with SSL support
- **Authentication**: JWT with environment variables
- **View Engine**: Handlebars (HBS)
- **Architecture**: Layered modular design with clear dependencies

## Quick Start

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 13+ installed and running
- npm or yarn package manager

### Setup Instructions

1. **Clone and install dependencies**:
   ```bash
   git clone <repository>
   cd marketing-automation-system
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file and update the credentials:
   ```bash
   # Authentication (required)
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_random_secret_key_at_least_32_characters

   # Database (required for full functionality)
   DATABASE_URL=postgresql://username:password@localhost:5432/marketing_automation

   # Server configuration (optional)
   PORT=3000
   NODE_ENV=development
   ```

3. **Set up database**:
   ```bash
   # Create PostgreSQL database
   createdb marketing_automation

   # Run migrations to create tables
   npm run db:migrate

   # Add sample data (optional)
   npm run db:seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the admin interface**:
   - Open browser to: `http://localhost:3000`
   - Login page: `http://localhost:3000/admin/login`
   - Use credentials from your `.env` file

## Database Management

### Available Commands

```bash
# Database operations
npm run db:migrate      # Run pending migrations
npm run db:status       # Check database and migration status
npm run db:reset        # Reset database (WARNING: deletes all data)
npm run db:seed         # Add sample data for development

# Application
npm start              # Production server
npm run dev           # Development server with auto-reload
```

### Database Schema

The system includes comprehensive data models:

- **Customers**: Marketing targets with interests information
- **Books**: Ebook catalog with topics and metadata
- **Jobs**: Scheduled task management (ready for email automation)
- **Email Records**: Campaign tracking and analytics (ready for integration)

## Project Structure

```
marketing-automation-system/
├── src/
│   ├── core/                     # Core system infrastructure
│   │   ├── auth/                 # Authentication system
│   │   └── database/             # Database integration
│   │       ├── models/           # Data models (Customer, Book, etc.)
│   │       ├── services/         # Database operations
│   │       ├── migrations/       # SQL schema files
│   │       └── migrationRunner.js # Migration management
│   ├── modules/
│   │   └── admin/                # Admin interface
│   │       ├── controllers/      # UI controllers
│   │       ├── views/            # Handlebars templates
│   │       └── routes/           # Route definitions
│   ├── shared/
│   │   └── middleware/           # Shared utilities
│   ├── config/                   # Configuration management
│   └── app.js                    # Main application
├── scripts/                      # Database management scripts
├── public/
│   └── css/                      # Admin interface styles
└── README.md
```

## API Endpoints

### System APIs
- `GET /api/health` - System health check with database status
- `POST /api/auth/login` - Admin authentication
- `GET /api/auth/logout` - Admin logout

### Admin Interface
- `GET /admin/login` - Login page
- `GET /admin/dashboard` - Admin dashboard (protected)
- `GET /` - Redirects to dashboard

## Testing the Implementation

1. **Start the server**: `npm run dev`
2. **Check database**: `npm run db:status`
3. **Navigate to**: `http://localhost:3000`
4. **Login with**: Credentials from your `.env` file
5. **Verify features**:
   - ✅ Authentication system works
   - ✅ Database connection is healthy
   - ✅ Admin dashboard loads
   - ✅ Sample data is visible (if seeded)

## Data Management

### Sample Data Commands

```bash
# Add sample customers, books, and reading activities
npm run db:seed

# Check what data exists
npm run db:status

# Reset everything and start fresh
npm run db:reset
npm run db:migrate
npm run db:seed
```

### Customer Data Structure

The system tracks marketing-relevant customer data:
- Email address (unique identifier)
- Name for personalization
- Topics of interest for content targeting
- Status (active, inactive, blacklisted)
- Reading behavior and engagement history

## Next Development Phases

The current foundation supports future implementation of:

- 📧 **Email Management**: Postmark integration for campaign delivery
- 🤖 **AI Content Generation**: Gemini AI for personalized email content
- ⏰ **Job Scheduling**: Automated campaign execution and timing
- 📊 **Analytics Dashboard**: Campaign performance and customer insights
- 🔗 **External Integrations**: CRM synchronization and data imports

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ADMIN_USERNAME` | Admin login username | Yes | - |
| `ADMIN_PASSWORD` | Admin login password | Yes | - |
| `JWT_SECRET` | JWT token signing key (32+ chars) | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Yes* | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |

*Required for full functionality. App runs in limited mode without database.

### Database Configuration

**Local Development**:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/marketing_automation
```

**Railway Production**:
```bash
DATABASE_URL=postgresql://user:pass@hostname.railway.app:5432/railway?sslmode=require
```

## Security Features

- JWT tokens with 24-hour expiration
- HTTP-only secure cookies in production
- SSL/TLS database connections
- Environment-based credential management
- Input validation and SQL injection prevention

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists: `createdb marketing_automation`

2. **Migrations fail**
   - Check database permissions
   - Verify connection string
   - Run `npm run db:status` to diagnose

3. **Can't login**
   - Verify credentials in `.env` file
   - Check browser console for errors
   - Ensure JWT_SECRET is at least 32 characters

4. **Sample data issues**
   - Run migrations first: `npm run db:migrate`
   - Check database status: `npm run db:status`
   - Reset if needed: `npm run db:reset`

### Database Debugging

```bash
# Check overall system status
npm run db:status

# View migration history
npm run db:migrate

# Reset and rebuild (destructive)
npm run db:reset
npm run db:migrate
npm run db:seed
```

## Development Guidelines

This project follows modular architecture principles:
- **Core modules**: Essential system infrastructure (auth, database)
- **Feature modules**: Business functionality (admin interface)
- **Shared services**: Common utilities and middleware
- **Clear dependencies**: Features depend on core, never vice versa

Ready for advanced marketing automation features including email campaigns, AI content generation, and comprehensive customer journey management.