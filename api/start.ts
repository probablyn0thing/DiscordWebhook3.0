// Serverless endpoint to start the Discord bot
import { initializeBot, getBotStatus } from '../src/serverless';

export default async function handler(req: any, res: any) {
  try {
    const success = await initializeBot();
    const status = getBotStatus();
    
    if (success) {
      res.status(200).json({
        message: 'Discord bot started successfully',
        status: 'running',
        botStatus: status,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        message: 'Failed to start Discord bot. Check environment variables.',
        status: 'error',
        botStatus: status,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}