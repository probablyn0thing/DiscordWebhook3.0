"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    static formatTimestamp() {
        return new Date().toISOString();
    }
    static formatMessage(level, message, ...args) {
        const timestamp = this.formatTimestamp();
        const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${argsStr}`;
    }
    static info(message, ...args) {
        console.log(this.formatMessage('info', message, ...args));
    }
    static warn(message, ...args) {
        console.warn(this.formatMessage('warn', message, ...args));
    }
    static error(message, error, ...args) {
        const errorInfo = error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error;
        console.error(this.formatMessage('error', message, errorInfo, ...args));
    }
    static debug(message, ...args) {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
            console.debug(this.formatMessage('debug', message, ...args));
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map