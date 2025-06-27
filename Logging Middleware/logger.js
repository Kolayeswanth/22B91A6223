const axios = require('axios');

/**
 * Reusable logging middleware that makes API calls to the test server
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug", "info", "warn", "error", "fatal"
 * @param {string} package - Package name (auth, config, middleware, utils, etc.)
 * @param {string} message - Log message
 */
async function Log(stack, level, package, message) {
    try {
        const logData = {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(),
            package: package,
            message: message,
            timestamp: new Date().toISOString()
        };

        // Make API call to the test server
        const response = await axios.post('http://20.244.56.144/evaluation-service/logs', logData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5 second timeout
        });

        console.log(`[${level.toUpperCase()}] [${package}] ${message}`);
        return response.data;
    } catch (error) {
        // Fallback to console logging if API call fails
        console.error(`[LOGGING ERROR] Failed to send log to server: ${error.message}`);
        console.log(`[${level.toUpperCase()}] [${package}] ${message}`);
    }
}

/**
 * Convenience methods for different log levels
 */
const Logger = {
    debug: (package, message) => Log('backend', 'debug', package, message),
    info: (package, message) => Log('backend', 'info', package, message),
    warn: (package, message) => Log('backend', 'warn', package, message),
    error: (package, message) => Log('backend', 'error', package, message),
    fatal: (package, message) => Log('backend', 'fatal', package, message)
};

module.exports = { Log, Logger };
