
const { initializeBot, getBotStatus } = require('../../dist/src/serverless');

exports.handler = async (event, context) => {
  try {
    const success = await initializeBot();
    const status = getBotStatus();

    if (success) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Discord bot started successfully',
          status: 'running',
          botStatus: status,
          timestamp: new Date().toISOString()
        }),
      };
    } else {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Failed to start Discord bot. Check environment variables.',
          status: 'error',
          botStatus: status,
          timestamp: new Date().toISOString()
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
