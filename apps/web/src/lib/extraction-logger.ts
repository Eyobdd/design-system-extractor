/**
 * Extraction logging utilities for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  checkpointId: string;
  message: string;
  data?: Record<string, unknown> | undefined;
}

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

function shouldLog(level: LogLevel): boolean {
  const logLevel = process.env['LOG_LEVEL'] || 'info';
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(logLevel as LogLevel);
}

function formatLog(entry: LogEntry): string {
  const timestamp = entry.timestamp.toISOString();
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
  return `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.checkpointId}] ${entry.message}${dataStr}`;
}

function addLog(entry: LogEntry): void {
  logs.push(entry);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  if (shouldLog(entry.level)) {
    const formatted = formatLog(entry);
    switch (entry.level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }
}

export function createLogger(checkpointId: string) {
  return {
    debug(message: string, data?: Record<string, unknown>) {
      addLog({ timestamp: new Date(), level: 'debug', checkpointId, message, data });
    },
    info(message: string, data?: Record<string, unknown>) {
      addLog({ timestamp: new Date(), level: 'info', checkpointId, message, data });
    },
    warn(message: string, data?: Record<string, unknown>) {
      addLog({ timestamp: new Date(), level: 'warn', checkpointId, message, data });
    },
    error(message: string, data?: Record<string, unknown>) {
      addLog({ timestamp: new Date(), level: 'error', checkpointId, message, data });
    },
  };
}

export function getLogsForCheckpoint(checkpointId: string): LogEntry[] {
  return logs.filter(log => log.checkpointId === checkpointId);
}

export function getAllLogs(): LogEntry[] {
  return [...logs];
}

export function clearLogs(): void {
  logs.length = 0;
}
