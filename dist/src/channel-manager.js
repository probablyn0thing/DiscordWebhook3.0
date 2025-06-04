"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelManager = void 0;
const logger_1 = require("./logger");
class ChannelManager {
    constructor(client) {
        this.client = client;
    }
    async listAllChannels() {
        const result = [];
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
    async getChannelInfo(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
                return null;
            }
            const textChannel = channel;
            return {
                id: textChannel.id,
                name: textChannel.name,
                guild: textChannel.guild ? `${textChannel.guild.name} (${textChannel.guild.id})` : 'DM'
            };
        }
        catch (error) {
            logger_1.Logger.error('Failed to fetch channel info', error, { channelId });
            return null;
        }
    }
    validateChannelIds(channelIds) {
        return new Promise(async (resolve) => {
            const valid = [];
            const invalid = [];
            for (const channelId of channelIds) {
                const info = await this.getChannelInfo(channelId);
                if (info) {
                    valid.push(channelId);
                }
                else {
                    invalid.push(channelId);
                }
            }
            resolve({ valid, invalid });
        });
    }
    logMonitoringConfig(channelIds, guildIds) {
        if (channelIds && channelIds.length > 0) {
            logger_1.Logger.info('Channel monitoring configured', {
                mode: 'specific channels',
                channelCount: channelIds.length,
                channels: channelIds
            });
        }
        else if (guildIds && guildIds.length > 0) {
            logger_1.Logger.info('Guild monitoring configured', {
                mode: 'specific guilds',
                guildCount: guildIds.length,
                guilds: guildIds
            });
        }
        else {
            logger_1.Logger.info('Monitoring all accessible channels', { mode: 'all channels' });
        }
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channel-manager.js.map