// src/netlify-config.js
export const netlifyConfig = {
  siteUrl: process.env.REACT_APP_NETLIFY_SITE_URL || window.location.origin,
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Firebase quota management for free tier
  firebaseQuotas: {
    maxDailyWrites: 20000, // Free tier limit
    maxDailyReads: 50000,  // Free tier limit
    maxStorage: 1 * 1024 * 1024 * 1024, // 1GB
    maxFileSize: 5 * 1024 * 1024 // 5MB per file
  },
  
  // Optimizations for free tier
  optimizations: {
    cacheDocuments: true,
    batchWrites: true,
    compressImages: true,
    limitFileUploads: true
  }
};

// Log deployment info
console.log(`🚀 LDF Bootcamp System`);
console.log(`🌐 Environment: ${netlifyConfig.environment}`);
console.log(`📡 Site URL: ${netlifyConfig.siteUrl}`);
console.log(`⚡ Production: ${netlifyConfig.isProduction}`);

if (netlifyConfig.isProduction) {
  console.log('📊 Firebase Free Tier Limits:');
  console.log(`   • Daily Writes: ${netlifyConfig.firebaseQuotas.maxDailyWrites}`);
  console.log(`   • Daily Reads: ${netlifyConfig.firebaseQuotas.maxDailyReads}`);
  console.log(`   • Storage: ${netlifyConfig.firebaseQuotas.maxStorage / (1024*1024)}MB`);
}