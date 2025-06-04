import { WebhookPayload } from './types';
export declare class WebhookService {
    private webhookUrl;
    private retryAttempts;
    private retryDelay;
    constructor(webhookUrl: string, retryAttempts?: number, retryDelay?: number);
    sendWebhook(payload: WebhookPayload): Promise<boolean>;
    private maskUrl;
    private sleep;
    static isValidWebhookUrl(url: string): boolean;
}
//# sourceMappingURL=webhook.d.ts.map