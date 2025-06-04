export interface DiscordMessageData {
    id: string;
    content: string;
    author: {
        id: string;
        username: string;
        discriminator: string;
        bot: boolean;
        avatar: string | null;
    };
    channel: {
        id: string;
        name: string;
        type: number;
    };
    guild: {
        id: string;
        name: string;
    } | null;
    timestamp: string;
    editedTimestamp: string | null;
    mentions: {
        users: Array<{
            id: string;
            username: string;
        }>;
        roles: Array<{
            id: string;
            name: string;
        }>;
        everyone: boolean;
    };
    attachments: Array<{
        id: string;
        filename: string;
        url: string;
        size: number;
    }>;
    embeds: Array<any>;
    reactions: Array<{
        emoji: string;
        count: number;
    }>;
}
export interface WebhookPayload {
    event: 'message_create';
    timestamp: string;
    data: DiscordMessageData;
}
export interface BotConfig {
    discordToken: string;
    webhookUrl: string;
    channelIds?: string[];
    guildIds?: string[];
}
export interface LogLevel {
    INFO: 'info';
    WARN: 'warn';
    ERROR: 'error';
    DEBUG: 'debug';
}
//# sourceMappingURL=types.d.ts.map