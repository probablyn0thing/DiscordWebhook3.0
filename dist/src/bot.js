"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const webhook_1 = require("./webhook");
const logger_1 = require("./logger");
const channel_manager_1 = require("./channel-manager");
class DiscordBot {
    constructor(config) {
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.dynamicTicketChannels = new Set();
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
        this.channelManager = new channel_manager_1.ChannelManager(this.client);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        // Bot ready event
        this.client.once('ready', async () => {
            logger_1.Logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
            // Scan for existing ticket channels
            await this.scanExistingTicketChannels();
            // Log monitoring configuration
            this.channelManager.logMonitoringConfig(this.config.channelIds, this.config.guildIds, this.dynamicTicketChannels.size);
            // Validate configured channels if any
            if (this.config.channelIds && this.config.channelIds.length > 0) {
                const validation = await this.channelManager.validateChannelIds(this.config.channelIds);
                if (validation.invalid.length > 0) {
                    logger_1.Logger.warn('Some configured channels are invalid or inaccessible', {
                        invalid: validation.invalid,
                        valid: validation.valid
                    });
                }
            }
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
        // Channel create event (for new ticket channels)
        this.client.on('channelCreate', async (channel) => {
            await this.handleChannelCreate(channel);
        });
        // Channel delete event (cleanup ticket channels)
        this.client.on('channelDelete', async (channel) => {
            await this.handleChannelDelete(channel);
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
                logger_1.Logger.debug('Skipping bot message', { messageId: message.id, author: message.author.username });
                return;
            }
            // Check if message should be monitored
            if (!this.shouldMonitorChannel(message.channel.id, message.guild?.id)) {
                logger_1.Logger.debug('Message not in monitored channels', {
                    messageId: message.id,
                    channelId: message.channel.id,
                    channelName: message.channel.name,
                    monitoredChannels: this.config.channelIds,
                    isTicketChannel: this.dynamicTicketChannels.has(message.channel.id)
                });
                return;
            }
            // Filter by guild IDs if configured
            if (this.config.guildIds && this.config.guildIds.length > 0) {
                if (!message.guild || !this.config.guildIds.includes(message.guild.id)) {
                    logger_1.Logger.debug('Message not in monitored guilds', {
                        messageId: message.id,
                        guildId: message.guild?.id,
                        monitoredGuilds: this.config.guildIds
                    });
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
                type: channel.type,
                isTicketChannel: this.dynamicTicketChannels.has(channel.id)
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
    async scanExistingTicketChannels() {
        try {
            logger_1.Logger.info('Scanning for existing ticket channels...');
            let ticketChannelCount = 0;
            for (const guild of this.client.guilds.cache.values()) {
                // Skip if guild filtering is enabled and this guild is not in the list
                if (this.config.guildIds && this.config.guildIds.length > 0) {
                    if (!this.config.guildIds.includes(guild.id)) {
                        continue;
                    }
                }
                for (const channel of guild.channels.cache.values()) {
                    if (channel.isTextBased() && this.isTicketChannel(channel.name)) {
                        this.dynamicTicketChannels.add(channel.id);
                        ticketChannelCount++;
                        logger_1.Logger.debug('Found existing ticket channel', {
                            channelId: channel.id,
                            channelName: channel.name,
                            guildName: guild.name
                        });
                    }
                }
            }
            logger_1.Logger.info(`Found ${ticketChannelCount} existing ticket channels to monitor`);
        }
        catch (error) {
            logger_1.Logger.error('Error scanning existing ticket channels', error);
        }
    }
    async handleChannelCreate(channel) {
        try {
            if (!channel.isTextBased())
                return;
            if (this.isTicketChannel(channel.name)) {
                // Check guild filtering
                if (this.config.guildIds && this.config.guildIds.length > 0) {
                    if (!channel.guild || !this.config.guildIds.includes(channel.guild.id)) {
                        return;
                    }
                }
                this.dynamicTicketChannels.add(channel.id);
                logger_1.Logger.info('New ticket channel detected and added to monitoring', {
                    channelId: channel.id,
                    channelName: channel.name,
                    guildName: channel.guild?.name || 'Unknown'
                });
            }
        }
        catch (error) {
            logger_1.Logger.error('Error handling channel create event', error);
        }
    }
    async handleChannelDelete(channel) {
        try {
            if (this.dynamicTicketChannels.has(channel.id)) {
                this.dynamicTicketChannels.delete(channel.id);
                logger_1.Logger.info('Ticket channel removed from monitoring', {
                    channelId: channel.id,
                    channelName: channel.name || 'Unknown'
                });
            }
        }
        catch (error) {
            logger_1.Logger.error('Error handling channel delete event', error);
        }
    }
    isTicketChannel(channelName) {
        return channelName.toLowerCase().includes('ticket');
    }
    shouldMonitorChannel(channelId, guildId) {
        // Always monitor dynamic ticket channels
        if (this.dynamicTicketChannels.has(channelId)) {
            return true;
        }
        // Check static channel filter
        if (this.config.channelIds && this.config.channelIds.length > 0) {
            return this.config.channelIds.includes(channelId);
        }
        // Check guild filter if no specific channels configured
        if (this.config.guildIds && this.config.guildIds.length > 0) {
            return guildId ? this.config.guildIds.includes(guildId) : false;
        }
        // If no filters configured, monitor all channels
        return true;
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