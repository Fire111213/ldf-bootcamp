// scripts/check-env.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...');

const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.log('💡 Make sure to set these in Netlify dashboard or .env file');
  
  // Check for .env file
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('📄 Creating .env.example file...');
    
    const exampleEnv = `# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here

# App Configuration
REACT_APP_SITE_NAME=LDF Bootcamp System
REACT_APP_ENVIRONMENT=production
`;
    
    fs.writeFileSync(path.join(__dirname, '..', '.env.example'), exampleEnv);
    console.log('✅ Created .env.example file');
  }
  
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  } else {
    console.log('⚠️  Development mode - continuing with fallback config');
  }
} else {
  console.log('✅ All environment variables are set');
}