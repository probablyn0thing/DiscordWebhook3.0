import { BotConfig } from './types';
export declare class DiscordBot {
    private client;
    private webhookService;
    private config;
    private reconnectAttempts;
    private maxReconnectAttempts;
    constructor(config: BotConfig);
    private setupEventHandlers;
    private handleMessage;
    private formatMessageData;
    private handleReconnect;
    start(): Promise<void>;
    stop(): Promise<void>;
    isReady(): boolean;
    getUptime(): number | null;
}
//# sourceMappingURL=bot.d.ts.map