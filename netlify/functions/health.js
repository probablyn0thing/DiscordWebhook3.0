
exports.handler = async (event, context) => {
  const response = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Discord Webhook Bot',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    message: 'Bot service is running. Configure DISCORD_TOKEN and WEBHOOK_URL environment variables to start monitoring Discord messages.'
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(response),
  };
};
