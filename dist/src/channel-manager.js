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
    async listTicketChannels() {
        const result = [];
        for (const guild of this.client.guilds.cache.values()) {
            const ticketChannels = guild.channels.cache
                .filter(channel => channel.isTextBased() && channel.name.toLowerCase().includes('ticket'))
                .map(channel => ({
                id: channel.id,
                name: channel.name
            }));
            if (ticketChannels.length > 0) {
                result.push({
                    guild: `${guild.name} (${guild.id})`,
                    channels: ticketChannels
                });
            }
        }
        return result;
    }
    logMonitoringConfig(channelIds, guildIds, ticketChannelCount) {
        let monitoringInfo = '';
        if (channelIds && channelIds.length > 0) {
            monitoringInfo += `${channelIds.length} specific channels`;
        }
        if (guildIds && guildIds.length > 0) {
            if (monitoringInfo)
                monitoringInfo += ', ';
            monitoringInfo += `${guildIds.length} specific guilds`;
        }
        if (ticketChannelCount && ticketChannelCount > 0) {
            if (monitoringInfo)
                monitoringInfo += ', ';
            monitoringInfo += `${ticketChannelCount} ticket channels (auto-detected)`;
        }
        if (!monitoringInfo) {
            monitoringInfo = 'all accessible channels';
        }
        logger_1.Logger.info(`Monitoring: ${monitoringInfo}`, {
            staticChannels: channelIds?.length || 0,
            guilds: guildIds?.length || 0,
            ticketChannels: ticketChannelCount || 0
        });
    }
}
exports.ChannelManager = ChannelManager;
//# sourceMappingURL=channel-manager.js.map