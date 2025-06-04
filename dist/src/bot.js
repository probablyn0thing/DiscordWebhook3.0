"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const webhook_1 = require("./webhook");
const logger_1 = require("./logger");
class DiscordBot {
    constructor(config) {
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.config = config;
        this.webhookService = new webhook_1.WebhookService(config.webhookUrl);
        // Initialize Discord client with necessary intents
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.MessageContent,
                discord_js_1.GatewayIntentBits.DirectMessages
            ]
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', () => {
            logger_1.Logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        });
        // Message create event
        this.client.on('messageCreate', async (message) => {
            await this.handleMessage(message);
        });
        // Message update event (for edited messages)
        this.client.on('messageUpdate', async (oldMessage, newMessage) => {
            if (newMessage.partial) {
                try {
                    await newMessage.fetch();
                }
                catch (error) {
                    logger_1.Logger.error('Failed to fetch partial message', error);
                    return;
                }
            }
            await this.handleMessage(newMessage, true);
        });
        // Error handling
        this.client.on('error', (error) => {
            logger_1.Logger.error('Discord client error', error);
        });
        // Disconnect handling
        this.client.on('disconnect', () => {
            logger_1.Logger.warn('Discord client disconnected');
            this.handleReconnect();
        });
        // Rate limit warnings
        this.client.on('rateLimit', (rateLimitData) => {
            logger_1.Logger.warn('Rate limit hit', rateLimitData);
        });
        // Debug events in development
        if (process.env.NODE_ENV === 'development') {
            this.client.on('debug', (info) => {
                logger_1.Logger.debug('Discord debug', info);
            });
        }
    }
    async handleMessage(message, isEdit = false) {
        try {
            // Skip bot messages unless configured otherwise
            if (message.author.bot && !process.env.INCLUDE_BOT_MESSAGES) {
                return;
            }
            // Filter by channel IDs if configured
            if (this.config.channelIds && this.config.channelIds.length > 0) {
                if (!this.config.channelIds.includes(message.channel.id)) {
                    return;
                }
            }
            // Filter by guild IDs if configured
            if (this.config.guildIds && this.config.guildIds.length > 0) {
                if (!message.guild || !this.config.guildIds.includes(message.guild.id)) {
                    return;
                }
            }
            logger_1.Logger.info(`Processing ${isEdit ? 'edited ' : ''}message`, {
                messageId: message.id,
                authorId: message.author.id,
                channelId: message.channel.id,
                guildId: message.guild?.id
            });
            const messageData = this.formatMessageData(message);
            const payload = {
                event: isEdit ? 'message_update' : 'message_create',
                timestamp: new Date().toISOString(),
                data: messageData
            };
            const success = await this.webhookService.sendWebhook(payload);
            if (!success) {
                logger_1.Logger.error('Failed to send webhook for message', null, { messageId: message.id });
            }
        }
        catch (error) {
            logger_1.Logger.error('Error handling message', error, { messageId: message.id });
        }
    }
    formatMessageData(message) {
        const channel = message.channel;
        return {
            id: message.id,
            content: message.content,
            author: {
                id: message.author.id,
                username: message.author.username,
                discriminator: message.author.discriminator,
                bot: message.author.bot,
                avatar: message.author.avatar
            },
            channel: {
                id: channel.id,
                name: channel.name || 'Unknown',
                type: channel.type
            },
            guild: message.guild ? {
                id: message.guild.id,
                name: message.guild.name
            } : null,
            timestamp: message.createdAt.toISOString(),
            editedTimestamp: message.editedAt?.toISOString() || null,
            mentions: {
                users: message.mentions.users.map(user => ({
                    id: user.id,
                    username: user.username
                })),
                roles: message.mentions.roles.map(role => ({
                    id: role.id,
                    name: role.name
                })),
                everyone: message.mentions.everyone
            },
            attachments: message.attachments.map(attachment => ({
                id: attachment.id,
                filename: attachment.name || 'unknown',
                url: attachment.url,
                size: attachment.size
            })),
            embeds: message.embeds.map(embed => embed.toJSON()),
            reactions: message.reactions.cache.map(reaction => ({
                emoji: reaction.emoji.name || reaction.emoji.toString(),
                count: reaction.count
            }))
        };
    }
    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger_1.Logger.error('Max reconnection attempts reached, giving up');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds
        logger_1.Logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(async () => {
            try {
                await this.start();
            }
            catch (error) {
                logger_1.Logger.error('Reconnection failed', error);
                this.handleReconnect();
            }
        }, delay);
    }
    async start() {
        try {
            logger_1.Logger.info('Starting Discord bot...');
            await this.client.login(this.config.discordToken);
        }
        catch (error) {
            logger_1.Logger.error('Failed to start Discord bot', error);
            throw error;
        }
    }
    async stop() {
        logger_1.Logger.info('Stopping Discord bot...');
        this.client.destroy();
    }
    isReady() {
        return this.client.isReady();
    }
    getUptime() {
        return this.client.uptime;
    }
}
exports.DiscordBot = DiscordBot;
//# sourceMappingURL=bot.js.map