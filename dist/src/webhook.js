"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("./logger");
class WebhookService {
    constructor(webhookUrl, retryAttempts = 3, retryDelay = 1000) {
        this.webhookUrl = webhookUrl;
        this.retryAttempts = retryAttempts;
        this.retryDelay = retryDelay;
    }
    async sendWebhook(payload) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                logger_1.Logger.debug(`Sending webhook attempt ${attempt}/${this.retryAttempts}`, {
                    webhookUrl: this.maskUrl(this.webhookUrl),
                    payloadSize: JSON.stringify(payload).length
                });
                const response = await axios_1.default.post(this.webhookUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Discord-Bot-Webhook/1.0'
                    },
                    timeout: 10000, // 10 second timeout
                });
                if (response.status >= 200 && response.status < 300) {
                    logger_1.Logger.info('Webhook sent successfully', {
                        status: response.status,
                        attempt
                    });
                    return true;
                }
                else {
                    throw new Error(`Webhook failed with status: ${response.status}`);
                }
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                logger_1.Logger.warn(`Webhook attempt ${attempt} failed`, {
                    error: lastError.message,
                    attempt,
                    maxAttempts: this.retryAttempts
                });
                // Don't retry on client errors (4xx)
                if (axios_1.default.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
                    logger_1.Logger.error('Webhook failed with client error, not retrying', error);
                    return false;
                }
                // Wait before retrying (exponential backoff)
                if (attempt < this.retryAttempts) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    logger_1.Logger.debug(`Waiting ${delay}ms before retry`);
                    await this.sleep(delay);
                }
            }
        }
        logger_1.Logger.error('Webhook failed after all retry attempts', lastError);
        return false;
    }
    maskUrl(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        }
        catch {
            return 'invalid-url';
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Validate webhook URL format
    static isValidWebhookUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
        }
        catch {
            return false;
        }
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.js.map