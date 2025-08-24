# Deployment Guide

## Local Development Deployment

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Git (for version control)

### Quick Setup

1. **Extract/Clone the project files**
2. **Navigate to project directory**:
   ```bash
   cd marketing-automation-system
   ```

3. **Run setup script**:
   ```bash
   node scripts/setup.js
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Configure environment**:
   Edit `.env` file with your credentials:
   ```bash
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_password
   JWT_SECRET=auto_generated_secure_key
   ```

6. **Start development server**:
   ```bash
   npm run dev
   ```

7. **Access the application**:
    - URL: `http://localhost:3000`
    - Login: `http://localhost:3000/admin/login`

### Manual Setup (Alternative)

If the setup script doesn't work:

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit .env file manually**:
    - Set `ADMIN_USERNAME` to your desired admin username
    - Set `ADMIN_PASSWORD` to a secure password (8+ characters)
    - Generate a secure `JWT_SECRET` (32+ characters random string)

3. **Create public directories**:
   ```bash
   mkdir -p public/css public/js public/images
   ```

4. **Continue with steps 4-7 from Quick Setup**

## Production Deployment (Railway)

### Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed (optional)

### Railway Deployment Steps

1. **Prepare for deployment**:
   ```bash
   # Ensure all files are committed to git
   git add .
   git commit -m "Initial commit - marketing automation MVP"
   ```

2. **Deploy to Railway**:

   **Option A: Using Railway Dashboard**
    - Log in to Railway dashboard
    - Click "New Project"
    - Choose "Deploy from GitHub repo"
    - Connect your repository
    - Railway will auto-detect Node.js and deploy

   **Option B: Using Railway CLI**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   ```

3. **Configure Environment Variables**:
   In Railway dashboard, go to your project and set:
   ```
   NODE_ENV=production
   ADMIN_USERNAME=your_admin_username
   ADMIN_PASSWORD=your_secure_production_password
   JWT_SECRET=your_secure_jwt_secret_64_chars_long
   PORT=3000
   ```

4. **Verify Deployment**:
    - Railway will provide a public URL
    - Access `https://your-app.railway.app/admin/login`
    - Test login with your production credentials

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `ADMIN_USERNAME` | Admin login username | Yes | `admin` |
| `ADMIN_PASSWORD` | Admin login password | Yes | `SecurePass123!` |
| `JWT_SECRET` | JWT token secret key | Yes | `64charRandomString...` |
| `PORT` | Server port | No | `3000` |

## Docker Deployment (Optional)

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
USER nodejs

EXPOSE 3000

CMD ["npm", "start"]
```

### Docker Commands
```bash
# Build image
docker build -t marketing-automation .

# Run container
docker run -p 3000:3000 --env-file .env marketing-automation
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   ```bash
   # Check environment variables
   cat .env
   
   # Verify all required variables are set
   node -e "require('dotenv').config(); console.log(process.env.ADMIN_USERNAME)"
   ```

2. **Can't login**
    - Verify credentials in `.env` file
    - Check browser console for JavaScript errors
    - Ensure JWT_SECRET is at least 32 characters

3. **Environment variables not loading**
    - Ensure `.env` file is in project root
    - Check file permissions: `chmod 644 .env`
    - Verify no extra spaces in variable assignments

4. **Railway deployment fails**
    - Check build logs in Railway dashboard
    - Ensure all environment variables are set
    - Verify package.json has correct start script

### Health Checks

1. **Application health**:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Authentication test**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"your_password"}'
   ```

### Monitoring

1. **View application logs**:
   ```bash
   # Local development
   npm run dev
   
   # Railway
   railway logs
   ```

2. **Check system status**:
    - Access admin dashboard
    - Click "Check System Health" button
    - Verify all status indicators are green

## Security Considerations

### Production Security
- Use strong, unique passwords for admin account
- Ensure JWT_SECRET is cryptographically secure (64+ characters)
- Keep environment variables secure and never commit them
- Use HTTPS in production (Railway provides this automatically)

### Regular Maintenance
- Update dependencies regularly: `npm audit fix`
- Monitor application logs for errors
- Backup environment configuration securely
- Rotate JWT_SECRET periodically for enhanced security

## Next Steps

After successful deployment, you're ready to begin developing the next phases:

1. **Database Integration**: PostgreSQL setup for persistent data
2. **Email System**: Postmark integration for email sending
3. **AI Integration**: Gemini AI for content personalization
5. **Campaign Management**: Marketing automation workflows

The current MVP provides the authentication foundation for all future features.