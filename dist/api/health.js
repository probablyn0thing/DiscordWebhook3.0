"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
function handler(req, res) {
    // Health check endpoint for serverless deployment
    const response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Discord Webhook Bot',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        message: 'Bot service is running. Configure DISCORD_TOKEN and WEBHOOK_URL environment variables to start monitoring Discord messages.'
    };
    res.status(200).json(response);
}
//# sourceMappingURL=health.js.map