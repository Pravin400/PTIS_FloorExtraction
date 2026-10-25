/**
 * Centralized Logging Utility
 * 
 * Provides structured logging for production applications.
 * In development: logs to console
 * In production: can be extended to send to monitoring services (Sentry, LogRocket, etc.)
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  error?: Error;
  stack?: string;
  componentStack?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log an error with context
   */
  error(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, context);
    } else {
      // In production: send to monitoring service
      this.sendToMonitoring('error', message, context);
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      this.sendToMonitoring('warn', message, context);
    }
  }

  /**
   * Log info (development only)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  /**
   * Send logs to external monitoring service
   * 
   * Security Note: This method is designed for production monitoring integration.
   * It does NOT use window.postMessage to avoid exposing sensitive error details
   * to third-party scripts running on the page.
   */
  private sendToMonitoring(_level: LogLevel, message: string, context?: LogContext): void {
    // TODO: Integrate with monitoring service
    // Example: Sentry.captureException(context?.error, { level, extra: context });
    
    // Production logging should use a secure monitoring service (e.g., Sentry, LogRocket)
    // NOT window.postMessage which broadcasts to all scripts including third-party tags
    
    // Fallback for production: log critical errors to console if no monitoring is configured
    // This ensures rendering failures are not silently dropped
    if (_level === 'error') {
      console.error('[Logger] PRODUCTION ERROR:', message, context);
    }
    return;
  }
}

// Singleton instance
export const logger = new Logger();

/**
 * Legacy exports for gradual migration
 */
export const logError = (message: string, context?: LogContext) => logger.error(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
