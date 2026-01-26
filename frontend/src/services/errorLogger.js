/**
 * Error Logger Service
 * Provides standardized error logging for frontend components
 * In production, this can be extended to send errors to monitoring services
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log an error with context
 * @param {string} context - Component or function name where error occurred
 * @param {Error|string} error - The error object or message
 * @param {Object} additionalData - Optional additional data for debugging
 */
export const logError = (context, error, additionalData = null) => {
    if (isDev) {
        console.error(`[${context}]`, error);
        if (additionalData) {
            console.error('Additional data:', additionalData);
        }
    }
    
    // In production, you could send to an error tracking service like Sentry
    // if (!isDev && window.Sentry) {
    //     window.Sentry.captureException(error, { tags: { context }, extra: additionalData });
    // }
};

/**
 * Log a warning with context
 * @param {string} context - Component or function name
 * @param {string} message - Warning message
 */
export const logWarning = (context, message) => {
    if (isDev) {
        console.warn(`[${context}]`, message);
    }
};

/**
 * Log debug information (development only)
 * @param {string} context - Component or function name
 * @param {...any} args - Arguments to log
 */
export const logDebug = (context, ...args) => {
    if (isDev) {
        console.log(`[DEBUG:${context}]`, ...args);
    }
};

export default {
    error: logError,
    warn: logWarning,
    debug: logDebug
};
