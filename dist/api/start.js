"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
// Serverless endpoint to start the Discord bot
const serverless_1 = require("../src/serverless");
async function handler(req, res) {
    try {
        const success = await (0, serverless_1.initializeBot)();
        const status = (0, serverless_1.getBotStatus)();
        if (success) {
            res.status(200).json({
                message: 'Discord bot started successfully',
                status: 'running',
                botStatus: status,
                timestamp: new Date().toISOString()
            });
        }
        else {
            res.status(500).json({
                message: 'Failed to start Discord bot. Check environment variables.',
                status: 'error',
                botStatus: status,
                timestamp: new Date().toISOString()
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}
//# sourceMappingURL=start.js.map