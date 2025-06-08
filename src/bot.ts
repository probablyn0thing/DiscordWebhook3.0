import { Client, GatewayIntentBits, Message, PartialMessage, TextChannel } from 'discord.js';
import { DiscordMessageData, WebhookPayload, BotConfig } from './types';
import { WebhookService } from './webhook';
import { Logger } from './logger';
import { ChannelManager } from './channel-manager';

export class DiscordBot {
  private client: Client;
  private webhookService: WebhookService;
  private config: BotConfig;
  private channelManager: ChannelManager;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private dynamicTicketChannels: Set<string> = new Set();

  constructor(config: BotConfig) {
    this.config = config;
    this.webhookService = new WebhookService(config.webhookUrl);
    
    // Initialize Discord client with necessary intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.channelManager = new ChannelManager(this.client);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Bot ready event
    this.client.once('ready', async () => {
      Logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Scan for existing ticket channels
      await this.scanExistingTicketChannels();
      
      // Log monitoring configuration
      this.channelManager.logMonitoringConfig(this.config.channelIds, this.config.guildIds, this.dynamicTicketChannels.size);
      
      // Validate configured channels if any
      if (this.config.channelIds && this.config.channelIds.length > 0) {
        const validation = await this.channelManager.validateChannelIds(this.config.channelIds);
        if (validation.invalid.length > 0) {
          Logger.warn('Some configured channels are invalid or inaccessible', {
            invalid: validation.invalid,
            valid: validation.valid
          });
        }
      }
    });

    // Message create event
    this.client.on('messageCreate', async (message: Message) => {
      await this.handleMessage(message);
    });

    // Message update event (for edited messages)
    this.client.on('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      if (newMessage.partial) {
        try {
          await newMessage.fetch();
        } catch (error) {
          Logger.error('Failed to fetch partial message', error);
          return;
        }
      }
      await this.handleMessage(newMessage as Message, true);
    });

    // Error handling
    this.client.on('error', (error) => {
      Logger.error('Discord client error', error);
    });

    // Disconnect handling
    this.client.on('disconnect', () => {
      Logger.warn('Discord client disconnected');
      this.handleReconnect();
    });

    // Rate limit warnings
    this.client.on('rateLimit', (rateLimitData) => {
      Logger.warn('Rate limit hit', rateLimitData);
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
        Logger.debug('Discord debug', info);
      });
    }
  }

  private async handleMessage(message: Message, isEdit: boolean = false): Promise<void> {
    try {
      // Skip bot messages unless configured otherwise
      if (message.author.bot && !process.env.INCLUDE_BOT_MESSAGES) {
        Logger.debug('Skipping bot message', { messageId: message.id, author: message.author.username });
        return;
      }

      // Check if message should be monitored
      if (!this.shouldMonitorChannel(message.channel.id, message.guild?.id)) {
        Logger.debug('Message not in monitored channels', { 
          messageId: message.id, 
          channelId: message.channel.id,
          channelName: (message.channel as TextChannel).name,
          monitoredChannels: this.config.channelIds,
          isTicketChannel: this.dynamicTicketChannels.has(message.channel.id)
        });
        return;
      }

      // Filter by guild IDs if configured
      if (this.config.guildIds && this.config.guildIds.length > 0) {
        if (!message.guild || !this.config.guildIds.includes(message.guild.id)) {
          Logger.debug('Message not in monitored guilds', { 
            messageId: message.id, 
            guildId: message.guild?.id,
            monitoredGuilds: this.config.guildIds 
          });
          return;
        }
      }

      Logger.info(`Processing ${isEdit ? 'edited ' : ''}message`, {
        messageId: message.id,
        authorId: message.author.id,
        channelId: message.channel.id,
        guildId: message.guild?.id
      });

      const messageData = this.formatMessageData(message);
      const payload: WebhookPayload = {
        event: isEdit ? 'message_update' : 'message_create',
        timestamp: new Date().toISOString(),
        data: messageData
      };

      const success = await this.webhookService.sendWebhook(payload);
      if (!success) {
        Logger.error('Failed to send webhook for message', null, { messageId: message.id });
      }
    } catch (error) {
      Logger.error('Error handling message', error, { messageId: message.id });
    }
  }

  private formatMessageData(message: Message): DiscordMessageData {
    const channel = message.channel as TextChannel;
    
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

  private async scanExistingTicketChannels(): Promise<void> {
    try {
      Logger.info('Scanning for existing ticket channels...');
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
            Logger.debug('Found existing ticket channel', {
              channelId: channel.id,
              channelName: channel.name,
              guildName: guild.name
            });
          }
        }
      }

      Logger.info(`Found ${ticketChannelCount} existing ticket channels to monitor`);
    } catch (error) {
      Logger.error('Error scanning existing ticket channels', error);
    }
  }

  private async handleChannelCreate(channel: any): Promise<void> {
    try {
      if (!channel.isTextBased()) return;

      if (this.isTicketChannel(channel.name)) {
        // Check guild filtering
        if (this.config.guildIds && this.config.guildIds.length > 0) {
          if (!channel.guild || !this.config.guildIds.includes(channel.guild.id)) {
            return;
          }
        }

        this.dynamicTicketChannels.add(channel.id);
        Logger.info('New ticket channel detected and added to monitoring', {
          channelId: channel.id,
          channelName: channel.name,
          guildName: channel.guild?.name || 'Unknown'
        });
      }
    } catch (error) {
      Logger.error('Error handling channel create event', error);
    }
  }

  private async handleChannelDelete(channel: any): Promise<void> {
    try {
      if (this.dynamicTicketChannels.has(channel.id)) {
        this.dynamicTicketChannels.delete(channel.id);
        Logger.info('Ticket channel removed from monitoring', {
          channelId: channel.id,
          channelName: channel.name || 'Unknown'
        });
      }
    } catch (error) {
      Logger.error('Error handling channel delete event', error);
    }
  }

  private isTicketChannel(channelName: string): boolean {
    return channelName.toLowerCase().includes('ticket');
  }

  private shouldMonitorChannel(channelId: string, guildId?: string): boolean {
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

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error('Max reconnection attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Max 30 seconds
    
    Logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        Logger.error('Reconnection failed', error);
        this.handleReconnect();
      }
    }, delay);
  }

  async start(): Promise<void> {
    try {
      Logger.info('Starting Discord bot...');
      await this.client.login(this.config.discordToken);
    } catch (error) {
      Logger.error('Failed to start Discord bot', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    Logger.info('Stopping Discord bot...');
    this.client.destroy();
  }

  isReady(): boolean {
    return this.client.isReady();
  }

  getUptime(): number | null {
    return this.client.uptime;
  }
}
