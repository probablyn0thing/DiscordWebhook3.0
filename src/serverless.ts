// Serverless-compatible entry point
import { DiscordBot } from './bot';
import { BotConfig } from './types';
import { Logger } from './logger';
import { WebhookService } from './webhook';

let bot: DiscordBot | null = null;

// Initialize bot instance for serverless environments
export async function initializeBot(): Promise<boolean> {
  try {
    if (bot && bot.isReady()) {
      return true;
    }

    const discordToken = process.env.DISCORD_TOKEN;
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!discordToken || !webhookUrl) {
      Logger.error('Missing required environment variables: DISCORD_TOKEN or WEBHOOK_URL');
      return false;
    }

    if (!WebhookService.isValidWebhookUrl(webhookUrl)) {
      Logger.error('Invalid webhook URL format');
      return false;
    }

    const channelIds = process.env.CHANNEL_IDS ? 
      process.env.CHANNEL_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;
    
    const guildIds = process.env.GUILD_IDS ? 
      process.env.GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;

    const config: BotConfig = {
      discordToken,
      webhookUrl
    };
    
    if (channelIds) {
      config.channelIds = channelIds;
    }
    
    if (guildIds) {
      config.guildIds = guildIds;
    }

    bot = new DiscordBot(config);
    await bot.start();
    
    Logger.info('Discord bot initialized successfully for serverless environment');
    return true;
  } catch (error) {
    Logger.error('Failed to initialize bot in serverless environment', error);
    return false;
  }
}

// Health check for serverless deployment
export function getBotStatus() {
  return {
    ready: bot?.isReady() || false,
    uptime: bot?.getUptime() || null,
    timestamp: new Date().toISOString()
  };
}

// Graceful shutdown for serverless
export async function stopBot(): Promise<void> {
  if (bot) {
    await bot.stop();
    bot = null;
  }
}