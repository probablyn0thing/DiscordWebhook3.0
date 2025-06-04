"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeBot = initializeBot;
exports.getBotStatus = getBotStatus;
exports.stopBot = stopBot;
// Serverless-compatible entry point
const bot_1 = require("./bot");
const logger_1 = require("./logger");
const webhook_1 = require("./webhook");
let bot = null;
// Initialize bot instance for serverless environments
async function initializeBot() {
    try {
        if (bot && bot.isReady()) {
            return true;
        }
        const discordToken = process.env.DISCORD_TOKEN;
        const webhookUrl = process.env.WEBHOOK_URL;
        if (!discordToken || !webhookUrl) {
            logger_1.Logger.error('Missing required environment variables: DISCORD_TOKEN or WEBHOOK_URL');
            return false;
        }
        if (!webhook_1.WebhookService.isValidWebhookUrl(webhookUrl)) {
            logger_1.Logger.error('Invalid webhook URL format');
            return false;
        }
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
        bot = new bot_1.DiscordBot(config);
        await bot.start();
        logger_1.Logger.info('Discord bot initialized successfully for serverless environment');
        return true;
    }
    catch (error) {
        logger_1.Logger.error('Failed to initialize bot in serverless environment', error);
        return false;
    }
}
// Health check for serverless deployment
function getBotStatus() {
    return {
        ready: bot?.isReady() || false,
        uptime: bot?.getUptime() || null,
        timestamp: new Date().toISOString()
    };
}
// Graceful shutdown for serverless
async function stopBot() {
    if (bot) {
        await bot.stop();
        bot = null;
    }
}
//# sourceMappingURL=serverless.js.map