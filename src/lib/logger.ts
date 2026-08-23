/**
 * Krishakarya Application Logger & Error Tracker
 * Provides structured logging, error diagnostics, and offline fallback telemetry.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  category: string;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private logs: LogPayload[] = [];
  private readonly maxLogs = 50;

  private formatMessage(level: LogLevel, category: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const entry: LogPayload = { category, message, data, timestamp };
    
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const prefix = `[Krishakarya:${category}]`;
    if (level === 'error') {
      console.error(prefix, message, data !== undefined ? data : '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data !== undefined ? data : '');
    } else if (level === 'info') {
      console.info(prefix, message, data !== undefined ? data : '');
    } else {
      console.debug(prefix, message, data !== undefined ? data : '');
    }
  }

  info(category: string, message: string, data?: any) {
    this.formatMessage('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.formatMessage('warn', category, message, data);
  }

  error(category: string, message: string, error?: any) {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    this.formatMessage('error', category, message, errorDetails);
  }

  debug(category: string, message: string, data?: any) {
    this.formatMessage('debug', category, message, data);
  }

  getRecentLogs(): LogPayload[] {
    return [...this.logs];
  }
}

export const logger = new Logger();
