import { Client } from 'discord.js';
export declare class ChannelManager {
    private client;
    constructor(client: Client);
    listAllChannels(): Promise<{
        guild: string;
        channels: Array<{
            id: string;
            name: string;
        }>;
    }[]>;
    getChannelInfo(channelId: string): Promise<{
        name: string;
        guild: string;
        id: string;
    } | null>;
    validateChannelIds(channelIds: string[]): Promise<{
        valid: string[];
        invalid: string[];
    }>;
    logMonitoringConfig(channelIds?: string[], guildIds?: string[]): void;
}
//# sourceMappingURL=channel-manager.d.ts.map