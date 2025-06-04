import dotenv from 'dotenv';
import { DiscordBot } from './src/bot';
import { BotConfig } from './src/types';
import { Logger } from './src/logger';
import { WebhookService } from './src/webhook';

// Load environment variables
dotenv.config();

// Validate required environment variables
function validateEnvironment(): BotConfig {
  const requiredVars = ['DISCORD_TOKEN', 'WEBHOOK_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const discordToken = process.env.DISCORD_TOKEN!;
  const webhookUrl = process.env.WEBHOOK_URL!;

  // Validate webhook URL format
  if (!WebhookService.isValidWebhookUrl(webhookUrl)) {
    throw new Error('Invalid webhook URL format');
  }

  // Parse optional channel and guild filters
  const channelIds = process.env.CHANNEL_IDS ? 
    process.env.CHANNEL_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;
  
  const guildIds = process.env.GUILD_IDS ? 
    process.env.GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;

  return {
    discordToken,
    webhookUrl,
    channelIds,
    guildIds
  };
}

// Main application function
async function main(): Promise<void> {
  try {
    Logger.info('Starting Discord bot application...');

    // Validate environment
    const config = validateEnvironment();
    
    Logger.info('Configuration loaded', {
      channelFilter: config.channelIds?.length || 0,
      guildFilter: config.guildIds?.length || 0
    });

    // Create and start bot
    const bot = new DiscordBot(config);
    
    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      Logger.info(`Received ${signal}, shutting down gracefully...`);
      await bot.stop();
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught exception', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled rejection', new Error(String(reason)), { promise });
      process.exit(1);
    });

    // Start the bot
    await bot.start();
    
    Logger.info('Discord bot started successfully');

    // Keep the process alive
    const keepAlive = () => {
      if (bot.isReady()) {
        const uptime = bot.getUptime();
        Logger.debug(`Bot is alive, uptime: ${uptime ? Math.floor(uptime / 1000) : 0}s`);
      }
      setTimeout(keepAlive, 30000); // Check every 30 seconds
    };
    
    keepAlive();

  } catch (error) {
    Logger.error('Failed to start application', error);
    process.exit(1);
  }
}

// Export for serverless environments
export { main };

// Run if this is the main module
if (require.main === module) {
  main().catch((error) => {
    Logger.error('Application crashed', error);
    process.exit(1);
  });
}
