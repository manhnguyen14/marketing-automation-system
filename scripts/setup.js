#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Marketing Automation System Setup');
console.log('='.repeat(50));

async function setupProject() {
    try {
        // Check if .env exists
        const envPath = path.join(process.cwd(), '.env');
        const envExamplePath = path.join(process.cwd(), '.env.example');

        if (!fs.existsSync(envPath)) {
            if (fs.existsSync(envExamplePath)) {
                console.log('📋 Creating .env file from template...');

                // Read the example file
                let envContent = fs.readFileSync(envExamplePath, 'utf8');

                // Generate a secure JWT secret
                const jwtSecret = crypto.randomBytes(64).toString('hex');
                envContent = envContent.replace(
                    'your_super_secure_jwt_secret_key_change_this_in_production',
                    jwtSecret
                );

                // Write the .env file
                fs.writeFileSync(envPath, envContent);
                console.log('✅ .env file created with secure JWT secret');
                console.log('💡 Please update the ADMIN_USERNAME and ADMIN_PASSWORD in .env file');
            } else {
                console.log('❌ .env.example file not found');
                return;
            }
        } else {
            console.log('✅ .env file already exists');
        }

        // Create public directories if they don't exist
        const publicDirs = [
            'public',
            'public/css',
            'public/js',
            'public/images'
        ];

        publicDirs.forEach(dir => {
            const dirPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        });

        // Check for required environment variables
        require('dotenv').config();

        const requiredVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET'];
        const missing = requiredVars.filter(varName => !process.env[varName]);

        if (missing.length > 0) {
            console.log('⚠️  Please configure these environment variables in .env:');
            missing.forEach(varName => console.log(`   - ${varName}`));
        } else {
            console.log('✅ All required environment variables are configured');
        }

        // Validate JWT secret length
        if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            console.log('⚠️  JWT_SECRET should be at least 32 characters long');
        }

        console.log('');
        console.log('🎉 Setup completed!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Review and update credentials in .env file');
        console.log('2. Run: npm install');
        console.log('3. Run: npm run dev');
        console.log('4. Open: http://localhost:3000/admin/login');
        console.log('');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup if this script is executed directly
if (require.main === module) {
    setupProject();
}

module.exports = setupProject;