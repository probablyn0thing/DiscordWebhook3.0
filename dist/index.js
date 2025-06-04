"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const dotenv_1 = __importDefault(require("dotenv"));
const bot_1 = require("./src/bot");
const logger_1 = require("./src/logger");
const webhook_1 = require("./src/webhook");
// Load environment variables
dotenv_1.default.config();
// Validate required environment variables
function validateEnvironment() {
    const requiredVars = ['DISCORD_TOKEN', 'WEBHOOK_URL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    const discordToken = process.env.DISCORD_TOKEN;
    const webhookUrl = process.env.WEBHOOK_URL;
    // Validate webhook URL format
    if (!webhook_1.WebhookService.isValidWebhookUrl(webhookUrl)) {
        throw new Error('Invalid webhook URL format');
    }
    // Parse optional channel and guild filters
    const channelIds = process.env.CHANNEL_IDS ?
        process.env.CHANNEL_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;
    const guildIds = process.env.GUILD_IDS ?
        process.env.GUILD_IDS.split(',').map(id => id.trim()).filter(Boolean) : undefined;
    const config = {
        discordToken,
        webhookUrl
    };
    if (channelIds) {
        config.channelIds = channelIds;
    }
    if (guildIds) {
        config.guildIds = guildIds;
    }
    return config;
}
// Main application function
async function main() {
    try {
        logger_1.Logger.info('Starting Discord bot application...');
        // Validate environment
        const config = validateEnvironment();
        logger_1.Logger.info('Configuration loaded', {
            channelFilter: config.channelIds?.length || 0,
            guildFilter: config.guildIds?.length || 0
        });
        // Create and start bot
        const bot = new bot_1.DiscordBot(config);
        // Graceful shutdown handling
        const shutdown = async (signal) => {
            logger_1.Logger.info(`Received ${signal}, shutting down gracefully...`);
            await bot.stop();
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger_1.Logger.error('Uncaught exception', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.Logger.error('Unhandled rejection', new Error(String(reason)), { promise });
            process.exit(1);
        });
        // Start the bot
        await bot.start();
        logger_1.Logger.info('Discord bot started successfully');
        // Keep the process alive
        const keepAlive = () => {
            if (bot.isReady()) {
                const uptime = bot.getUptime();
                logger_1.Logger.debug(`Bot is alive, uptime: ${uptime ? Math.floor(uptime / 1000) : 0}s`);
            }
            setTimeout(keepAlive, 30000); // Check every 30 seconds
        };
        keepAlive();
    }
    catch (error) {
        logger_1.Logger.error('Failed to start application', error);
        process.exit(1);
    }
}
// Run if this is the main module
if (require.main === module) {
    main().catch((error) => {
        logger_1.Logger.error('Application crashed', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map