/**
 * Logger Utility
 * Simple logging utility for development and production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log levels with colors for terminal
 */
const colors = {
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warning: '\x1b[33m', // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
  reset: '\x1b[0m',    // Reset
};

/**
 * Format log message with timestamp
 */
function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const levelUpper = level.toUpperCase();

  let logMessage = `[${timestamp}] [${levelUpper}] ${message}`;

  if (data) {
    logMessage += `\n${JSON.stringify(data, null, 2)}`;
  }

  return logMessage;
}

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Info log
   */
  info: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.info}${formatMessage('info', message, data)}${colors.reset}`
      );
    } else {
      console.log(formatMessage('info', message, data));
    }
  },

  /**
   * Success log
   */
  success: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.success}${formatMessage('success', message, data)}${colors.reset}`
      );
    } else {
      console.log(formatMessage('success', message, data));
    }
  },

  /**
   * Warning log
   */
  warning: (message, data = null) => {
    if (isDevelopment) {
      console.warn(
        `${colors.warning}${formatMessage('warning', message, data)}${colors.reset}`
      );
    } else {
      console.warn(formatMessage('warning', message, data));
    }
  },

  /**
   * Error log
   */
  error: (message, error = null) => {
    const errorData = error ? {
      message: error.message,
      stack: error.stack,
      ...error,
    } : null;

    if (isDevelopment) {
      console.error(
        `${colors.error}${formatMessage('error', message, errorData)}${colors.reset}`
      );
    } else {
      console.error(formatMessage('error', message, errorData));
    }
  },

  /**
   * Debug log (only in development)
   */
  debug: (message, data = null) => {
    if (isDevelopment) {
      console.log(
        `${colors.debug}${formatMessage('debug', message, data)}${colors.reset}`
      );
    }
  },
};

export default logger;
