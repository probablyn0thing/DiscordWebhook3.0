import { Client, TextChannel, Guild } from 'discord.js';
import { Logger } from './logger';

export class ChannelManager {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async listAllChannels(): Promise<{ guild: string; channels: Array<{ id: string; name: string }> }[]> {
    const result: { guild: string; channels: Array<{ id: string; name: string }> }[] = [];
    
    for (const guild of this.client.guilds.cache.values()) {
      const channels = guild.channels.cache
        .filter(channel => channel.isTextBased())
        .map(channel => ({
          id: channel.id,
          name: channel.name
        }));
      
      result.push({
        guild: `${guild.name} (${guild.id})`,
        channels: channels
      });
    }
    
    return result;
  }

  async getChannelInfo(channelId: string): Promise<{ name: string; guild: string; id: string } | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        return null;
      }

      const textChannel = channel as TextChannel;
      return {
        id: textChannel.id,
        name: textChannel.name,
        guild: textChannel.guild ? `${textChannel.guild.name} (${textChannel.guild.id})` : 'DM'
      };
    } catch (error) {
      Logger.error('Failed to fetch channel info', error, { channelId });
      return null;
    }
  }

  validateChannelIds(channelIds: string[]): Promise<{ valid: string[]; invalid: string[] }> {
    return new Promise(async (resolve) => {
      const valid: string[] = [];
      const invalid: string[] = [];

      for (const channelId of channelIds) {
        const info = await this.getChannelInfo(channelId);
        if (info) {
          valid.push(channelId);
        } else {
          invalid.push(channelId);
        }
      }

      resolve({ valid, invalid });
    });
  }

  logMonitoringConfig(channelIds?: string[], guildIds?: string[]): void {
    if (channelIds && channelIds.length > 0) {
      Logger.info('Channel monitoring configured', { 
        mode: 'specific channels',
        channelCount: channelIds.length,
        channels: channelIds
      });
    } else if (guildIds && guildIds.length > 0) {
      Logger.info('Guild monitoring configured', { 
        mode: 'specific guilds',
        guildCount: guildIds.length,
        guilds: guildIds
      });
    } else {
      Logger.info('Monitoring all accessible channels', { mode: 'all channels' });
    }
  }
}