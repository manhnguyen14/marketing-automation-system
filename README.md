# Marketing Automation System

A Node.js-based marketing automation platform designed for ebook platforms to integrate with external data sources, generate customer insights, and execute personalized email campaigns through code-based automation workflows.

## Current MVP Status

This initial version implements **basic authentication functionality only**:
- ✅ Admin login/logout system
- ✅ JWT-based authentication
- ✅ Protected admin dashboard
- ✅ Professional admin interface

## Technology Stack

- **Backend**: Node.js + Express.js
- **Authentication**: JWT with environment variables
- **View Engine**: Handlebars (HBS)
- **Architecture**: Modular design ready for future features

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Setup Instructions

1. **Clone or download the project files**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file and update the credentials:
   ```bash
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=your_random_secret_key_at_least_32_characters
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the admin interface**:
    - Open browser to: `http://localhost:3000`
    - Login page: `http://localhost:3000/admin/login`
    - Use credentials from your `.env` file

## Project Structure

```
marketing-automation-system/
├── src/
│   ├── core/
│   │   └── auth/                 # Authentication module
│   │       ├── controllers/      # API endpoints
│   │       ├── middleware/       # JWT validation
│   │       ├── services/         # Auth business logic
│   │       └── index.js          # Module exports
│   ├── modules/
│   │   └── admin/                # Admin interface module
│   │       ├── controllers/      # UI controllers
│   │       ├── views/            # Handlebars templates
│   │       ├── routes/           # Route definitions
│   │       └── index.js          # Module exports
│   ├── shared/
│   │   └── middleware/           # Shared middleware
│   ├── config/
│   │   └── index.js              # Configuration
│   └── app.js                    # Main application
├── public/
│   └── css/
│       └── admin.css             # Admin interface styles
└── README.md
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (not implemented yet)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/logout` - Admin logout
- `GET /api/health` - System health check

### Admin Interface
- `GET /admin/login` - Login page
- `GET /admin/dashboard` - Admin dashboard (protected)
- `GET /` - Redirects to dashboard

## Testing the Implementation

1. **Start the server**: `npm run dev`
2. **Navigate to**: `http://localhost:3000`
3. **Login with**: Credentials from your `.env` file
4. **Verify**:
    - ✅ Login form accepts correct credentials
    - ✅ Wrong credentials show error message
    - ✅ Successful login redirects to dashboard
    - ✅ Dashboard shows navigation with logout
    - ✅ Logout clears session and returns to login
    - ✅ Direct access to `/admin/dashboard` without login redirects to login page

## Next Development Phases

This MVP provides the foundation for:
- 📧 Email management system
- 🔄 Job scheduling and automation
- 🤖 AI content generation
- 📊 Campaign tracking and analytics
- 🔗 External service integrations

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ADMIN_USERNAME` | Admin login username | Yes | - |
| `ADMIN_PASSWORD` | Admin login password | Yes | - |
| `JWT_SECRET` | JWT token signing key | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |

### Security Notes

- JWT tokens expire after 24 hours
- Passwords are validated against environment variables only
- Cookies are httpOnly and secure in production
- No database required for authentication

## Troubleshooting

### Common Issues

1. **Server won't start**
    - Check that all required environment variables are set
    - Ensure PORT 3000 is not already in use

2. **Can't login**
    - Verify credentials in `.env` file match what you're typing
    - Check browser console for JavaScript errors

3. **Environment variables not loading**
    - Ensure `.env` file is in the root directory
    - Check file permissions and format

### Getting Help

1. Check the console output for error messages
2. Verify all files are in the correct directory structure
3. Ensure all npm dependencies are installed

## Development Guidelines

This project follows modular architecture principles:
- **Core modules**: Essential system infrastructure
- **Feature modules**: Business functionality
- **Shared services**: Common utilities
- **Clear dependencies**: Features can use core, but not vice versa

Ready for future development phases including database integration, email campaigns, and marketing automation features.