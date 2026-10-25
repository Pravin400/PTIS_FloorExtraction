import pino, { Logger } from 'pino';

/**
 * Server-side logging utility for Next.js application
 * Provides structured logging using pino with environment-aware output and data sanitization
 * 
 * Features:
 * - Environment-aware (structured JSON in production, pretty-printed in development)
 * - Built-in sanitization of sensitive keys
 * - Standardized error formatting
 * - High performance
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sensitive keys that should be sanitized from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'apikey',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'bearer',
  'credentials',
  'access_token',
  'refresh_token',
];

// Generate redaction paths for pino
const redactPaths = SENSITIVE_KEYS.flatMap(key => [
  key,
  `*.${key}`,
  `*.*.${key}`,
  `context.${key}`,
  `context.*.${key}`
]);

/**
 * Pino configuration
 */
const pinoConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: {
    paths: redactPaths,
    placeholder: '[REDACTED]'
  },
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Use pino-pretty in development for better readability
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
};

// Create the base pino logger
const baseLogger = pino(pinoConfig);

// In development, pino-pretty creates a WriteStream that many child loggers
// attach listeners to. Increase the limit on process streams to prevent MaxListenersExceededWarning.
if (isDevelopment && typeof process !== 'undefined') {
  if (process.stdout && typeof process.stdout.setMaxListeners === 'function') {
    process.stdout.setMaxListeners(30);
  }
  if (process.stderr && typeof process.stderr.setMaxListeners === 'function') {
    process.stderr.setMaxListeners(30);
  }
}

interface LogContext {
  operation?: string;
  userId?: number | string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Server Logger class
 * Provides methods for different log levels with context and error support
 * Maintains compatibility with previous implementation while using pino under the hood
 */
class ServerLogger {
  private logger: Logger;
  private namespace?: string;

  constructor(namespace?: string, loggerInstance?: Logger) {
    this.namespace = namespace;
    this.logger = loggerInstance || (namespace ? baseLogger.child({ namespace }) : baseLogger);
  }

  /**
   * Create a child logger with a namespace
   */
  child(namespace: string): ServerLogger {
    const childNamespace = this.namespace 
      ? `${this.namespace}:${namespace}` 
      : namespace;
    
    const childLogger = this.logger.child({ namespace: childNamespace });
    return new ServerLogger(childNamespace, childLogger);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info({ context }, message);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.warn({ 
        context, 
        err: {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined
        }
      }, message);
    } else {
      this.logger.warn({ context, error }, message);
    }
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error({ 
        context, 
        err: {
          name: error.name,
          message: error.message,
          stack: isDevelopment ? error.stack : undefined
        }
      }, message);
    } else if (error) {
      this.logger.error({ context, error }, message);
    } else {
      this.logger.error({ context }, message);
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug({ context }, message);
  }
}

/**
 * Default logger instance
 */
export const logger = new ServerLogger();

/**
 * Create a namespaced logger for a specific module or feature
 * 
 * @example
 * const logger = createLogger('UserService');
 * logger.error('Failed to create user', { userId: 123 }, error);
 */
export function createLogger(namespace: string): ServerLogger {
  return new ServerLogger(namespace);
}

