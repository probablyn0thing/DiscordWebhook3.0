
exports.handler = async (event, context) => {
  try {
    // Basic validation of environment variables
    const discordToken = process.env.DISCORD_TOKEN;
    const webhookUrl = process.env.WEBHOOK_URL;
    
    if (!discordToken || !webhookUrl) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Missing required environment variables: DISCORD_TOKEN and WEBHOOK_URL',
          status: 'error',
          timestamp: new Date().toISOString()
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Discord bot configuration validated. Note: Netlify functions are stateless - use Replit for persistent bot hosting.',
        status: 'configured',
        environment: {
          hasToken: !!discordToken,
          hasWebhook: !!webhookUrl,
          nodeVersion: process.version
        },
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
