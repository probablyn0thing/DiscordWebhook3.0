export class Logger {
  private static formatTimestamp(): string {
    return new Date().toISOString();
  }

  private static formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = this.formatTimestamp();
    const argsStr = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${argsStr}`;
  }

  static info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('info', message, ...args));
  }

  static warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('warn', message, ...args));
  }

  static error(message: string, error?: Error | any, ...args: any[]): void {
    const errorInfo = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage('error', message, errorInfo, ...args));
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(this.formatMessage('debug', message, ...args));
    }
  }
}
