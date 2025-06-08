import { BotConfig } from './types';
export declare class DiscordBot {
    private client;
    private webhookService;
    private config;
    private channelManager;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private dynamicTicketChannels;
    constructor(config: BotConfig);
    private setupEventHandlers;
    private handleMessage;
    private formatMessageData;
    private scanExistingTicketChannels;
    private handleChannelCreate;
    private handleChannelDelete;
    private isTicketChannel;
    private shouldMonitorChannel;
    private handleReconnect;
    start(): Promise<void>;
    stop(): Promise<void>;
    isReady(): boolean;
    getUptime(): number | null;
}
//# sourceMappingURL=bot.d.ts.map