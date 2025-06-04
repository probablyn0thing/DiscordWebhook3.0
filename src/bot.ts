import { Client, GatewayIntentBits, Message, PartialMessage, TextChannel } from 'discord.js';
import { DiscordMessageData, WebhookPayload, BotConfig } from './types';
import { WebhookService } from './webhook';
import { Logger } from './logger';

export class DiscordBot {
  private client: Client;
  private webhookService: WebhookService;
  private config: BotConfig;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

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

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Bot ready event
    this.client.once('ready', () => {
      Logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
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
