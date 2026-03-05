// netlify/functions/hello.js
exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'LDF Bootcamp API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.REACT_APP_ENVIRONMENT || 'development'
    }),
  };
};