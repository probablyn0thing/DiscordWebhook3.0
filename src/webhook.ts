import axios, { AxiosResponse } from 'axios';
import { WebhookPayload } from './types';
import { Logger } from './logger';

export class WebhookService {
  private webhookUrl: string;
  private retryAttempts: number;
  private retryDelay: number;

  constructor(webhookUrl: string, retryAttempts: number = 3, retryDelay: number = 1000) {
    this.webhookUrl = webhookUrl;
    this.retryAttempts = retryAttempts;
    this.retryDelay = retryDelay;
  }

  async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        Logger.debug(`Sending webhook attempt ${attempt}/${this.retryAttempts}`, {
          webhookUrl: this.maskUrl(this.webhookUrl),
          payloadSize: JSON.stringify(payload).length,
          event: payload.event,
          messageId: payload.data.id
        });

        // Simplify payload structure for Make.com compatibility
        const simplifiedPayload = {
          ...payload.data,
          event_type: payload.event,
          webhook_timestamp: payload.timestamp
        };

        // Log the actual payload being sent for debugging
        Logger.debug('Webhook payload', {
          payload: JSON.stringify(simplifiedPayload, null, 2)
        });

        const response: AxiosResponse = await axios.post(this.webhookUrl, simplifiedPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Discord-Bot-Webhook/1.0'
          },
          timeout: 10000, // 10 second timeout
        });

        if (response.status >= 200 && response.status < 300) {
          Logger.info('Webhook sent successfully', {
            status: response.status,
            attempt
          });
          return true;
        } else {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        Logger.warn(`Webhook attempt ${attempt} failed`, {
          error: lastError.message,
          attempt,
          maxAttempts: this.retryAttempts
        });

        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
          Logger.error('Webhook failed with client error, not retrying', error);
          return false;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          Logger.debug(`Waiting ${delay}ms before retry`);
          await this.sleep(delay);
        }
      }
    }

    Logger.error('Webhook failed after all retry attempts', lastError);
    return false;
  }

  private maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return 'invalid-url';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Validate webhook URL format
  static isValidWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:' || urlObj.protocol === 'http:';
    } catch {
      return false;
    }
  }
}
