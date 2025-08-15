/**
 * Centralized logging system for the application
 * In production, this should be replaced with a service like Datadog, LogRocket, or Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor(private context?: string) {}

  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.timestamp}]`,
      `[${entry.level.toUpperCase()}]`,
      entry.context ? `[${entry.context}]` : '',
      entry.userId ? `[User: ${entry.userId}]` : '',
      entry.message,
    ].filter(Boolean);

    return parts.join(' ');
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      userId: this.getCurrentUserId(),
      metadata,
      error: metadata?.error,
    };
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context if available
    if (this.isClient) {
      // This would be replaced with actual auth context
      return typeof window !== 'undefined' 
        ? (window as any).__USER_ID__ 
        : undefined;
    }
    return undefined;
  }

  private log(entry: LogEntry) {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const formatted = this.formatLog(entry);
      
      switch (entry.level) {
        case 'debug':
          console.debug(formatted, entry.metadata || '');
          break;
        case 'info':
          console.info(formatted, entry.metadata || '');
          break;
        case 'warn':
          console.warn(formatted, entry.metadata || '');
          break;
        case 'error':
        case 'fatal':
          console.error(formatted, entry.error || entry.metadata || '');
          break;
      }
    }

    // In production, send to logging service
    if (!this.isDevelopment && this.isClient) {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    // TODO: Integrate with actual logging service
    // Example: Sentry, LogRocket, Datadog, etc.
    
    // For now, just store critical errors in localStorage for debugging
    if (entry.level === 'error' || entry.level === 'fatal') {
      try {
        const errors = JSON.parse(
          localStorage.getItem('app_errors') || '[]'
        );
        errors.push({
          ...entry,
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
        // Keep only last 10 errors
        if (errors.length > 10) {
          errors.shift();
        }
        localStorage.setItem('app_errors', JSON.stringify(errors));
      } catch (e) {
        // Fail silently
      }
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('debug', message, metadata);
    this.log(entry);
  }

  info(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, metadata);
    this.log(entry);
  }

  warn(message: string, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, metadata);
    this.log(entry);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    this.log(entry);
  }

  fatal(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const entry = this.createLogEntry('fatal', message, {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    });
    this.log(entry);
    
    // Fatal errors should trigger immediate action
    if (this.isClient && !this.isDevelopment) {
      // Could trigger error reporting modal, redirect to error page, etc.
    }
  }

  // Get recent logs for debugging
  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  // Clear log buffer
  clearLogs() {
    this.logBuffer = [];
  }

  // Create a child logger with additional context
  child(context: string): Logger {
    return new Logger(
      this.context ? `${this.context}:${context}` : context
    );
  }
}

// Create singleton loggers for different parts of the app
export const logger = new Logger();
export const authLogger = logger.child('Auth');
export const dbLogger = logger.child('Database');
export const aiLogger = logger.child('AI');
export const apiLogger = logger.child('API');

// Performance logging utilities
export function logPerformance(name: string, fn: () => any) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  logger.debug(`Performance: ${name}`, {
    duration: `${duration.toFixed(2)}ms`,
  });
  
  return result;
}

export async function logAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    logger.debug(`Async Performance: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    logger.error(`Async Performance Error: ${name}`, error, {
      duration: `${duration.toFixed(2)}ms`,
    });
    
    throw error;
  }
}

// React hook for logging component lifecycle
export function useComponentLogger(componentName: string) {
  const componentLogger = logger.child(componentName);
  
  if (process.env.NODE_ENV === 'development') {
    componentLogger.debug('Component mounted');
    
    return {
      log: componentLogger,
      logRender: () => componentLogger.debug('Component rendered'),
      logEffect: (effectName: string) => 
        componentLogger.debug(`Effect triggered: ${effectName}`),
      logEvent: (eventName: string, data?: any) =>
        componentLogger.info(`Event: ${eventName}`, data),
    };
  }
  
  // In production, return no-op functions to avoid performance impact
  return {
    log: componentLogger,
    logRender: () => {},
    logEffect: () => {},
    logEvent: () => {},
  };
}

export default logger;