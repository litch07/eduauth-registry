/**
 * Logger Utility
 * Provides environment-aware logging with different log levels
 * In production, debug and info logs are suppressed
 */

const isDev = process.env.NODE_ENV !== 'production';

const logger = {
    /**
     * Log informational messages (development only)
     * @param {...any} args - Arguments to log
     */
    info: (...args) => {
        if (isDev) {
            console.log('[INFO]', new Date().toISOString(), ...args);
        }
    },

    /**
     * Log warning messages (always shown)
     * @param {...any} args - Arguments to log
     */
    warn: (...args) => {
        console.warn('[WARN]', new Date().toISOString(), ...args);
    },

    /**
     * Log error messages (always shown)
     * @param {...any} args - Arguments to log
     */
    error: (...args) => {
        console.error('[ERROR]', new Date().toISOString(), ...args);
    },

    /**
     * Log debug messages (development only)
     * @param {...any} args - Arguments to log
     */
    debug: (...args) => {
        if (isDev) {
            console.log('[DEBUG]', new Date().toISOString(), ...args);
        }
    },

    /**
     * Log success messages (development only)
     * @param {...any} args - Arguments to log
     */
    success: (...args) => {
        if (isDev) {
            console.log('[SUCCESS]', new Date().toISOString(), ...args);
        }
    }
};

module.exports = logger;
