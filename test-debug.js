console.log('=== Testing Individual Auth Files ===');

try {
    console.log('1. Testing authService...');
    const authService = require('./src/core/auth/services/authService');
    console.log('✅ authService loaded successfully');
    console.log('authService methods:', Object.getOwnPropertyNames(authService));
} catch (error) {
    console.log('❌ authService failed:', error.message);
}

try {
    console.log('\n2. Testing authController...');
    const authController = require('./src/core/auth/controllers/authController');
    console.log('✅ authController loaded successfully');
    console.log('authController methods:', Object.keys(authController));
} catch (error) {
    console.log('❌ authController failed:', error.message);
}

try {
    console.log('\n3. Testing authMiddleware...');
    const authMiddleware = require('./src/core/auth/middleware/authMiddleware');
    console.log('✅ authMiddleware loaded successfully');
    console.log('authMiddleware methods:', Object.keys(authMiddleware));
} catch (error) {
    console.log('❌ authMiddleware failed:', error.message);
}

try {
    console.log('\n4. Testing auth index...');
    const authIndex = require('./src/core/auth/index');
    console.log('✅ auth index loaded successfully');
    console.log('auth index exports:', Object.keys(authIndex));
} catch (error) {
    console.log('❌ auth index failed:', error.message);
}

try {
    console.log('\n5. Testing config...');
    const config = require('./src/config/index');
    console.log('✅ config loaded successfully');
} catch (error) {
    console.log('❌ config failed:', error.message);
}

console.log('\n=== Test Complete ===');