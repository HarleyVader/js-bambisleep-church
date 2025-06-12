/**
 * Centralized Error Tracking System for BambiSleep Church
 * Provides comprehensive error logging, tracking, and monitoring
 */

const fs = require('fs').promises;
const path = require('path');

class ErrorTracker {
    constructor() {
        this.errorLog = [];
        this.errorCounts = new Map();
        this.logFilePath = path.join(process.cwd(), 'logs', 'errors.json');
        this.maxLogSize = 1000; // Maximum number of errors to keep in memory
        
        // Create logs directory if it doesn't exist
        this.ensureLogDirectory();
    }

    /**
     * Ensure logs directory exists
     */
    async ensureLogDirectory() {
        try {
            const logDir = path.dirname(this.logFilePath);
            await fs.mkdir(logDir, { recursive: true });
        } catch (error) {
            console.warn('⚠️ Could not create logs directory:', error.message);
        }
    }

    /**
     * Track an error with comprehensive metadata
     */
    async trackError(error, context = {}) {
        const errorEntry = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack || 'No stack trace available',
            type: error.constructor.name || 'Error',
            severity: this.determineSeverity(error, context),
            context: {
                url: context.url,
                method: context.method,
                userId: context.userId,
                userAgent: context.userAgent,
                component: context.component,
                action: context.action,
                ...context
            },
            count: this.incrementErrorCount(error.message)
        };

        // Add to in-memory log
        this.errorLog.unshift(errorEntry);
        
        // Trim log if too large
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // Log to console with enhanced formatting
        this.logToConsole(errorEntry);

        // Persist to file (non-blocking)
        this.persistToFile(errorEntry).catch(err => 
            console.warn('⚠️ Failed to persist error to file:', err.message)
        );

        // Emit to global socket if available for real-time monitoring
        this.emitToSocket(errorEntry);

        return errorEntry.id;
    }

    /**
     * Generate unique error ID
     */
    generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `err_${timestamp}_${random}`;
    }

    /**
     * Determine error severity
     */
    determineSeverity(error, context) {
        // Critical errors that break core functionality
        if (error.message.includes('database') || 
            error.message.includes('connection') ||
            error.message.includes('network') ||
            context.component === 'mcp' ||
            context.component === 'agent') {
            return 'critical';
        }

        // High severity for user-facing errors
        if (error.status >= 500 || 
            error.message.includes('timeout') ||
            context.component === 'api') {
            return 'high';
        }

        // Medium for validation and client errors
        if (error.status >= 400 || 
            error.message.includes('validation') ||
            error.message.includes('invalid')) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Increment error count for tracking frequency
     */
    incrementErrorCount(message) {
        const count = (this.errorCounts.get(message) || 0) + 1;
        this.errorCounts.set(message, count);
        return count;
    }

    /**
     * Enhanced console logging with colors and formatting
     */
    logToConsole(errorEntry) {
        const severityColors = {
            critical: '\x1b[41m', // Red background
            high: '\x1b[31m',     // Red text
            medium: '\x1b[33m',   // Yellow text
            low: '\x1b[36m'       // Cyan text
        };

        const reset = '\x1b[0m';
        const color = severityColors[errorEntry.severity] || '\x1b[37m';

        console.error(
            `${color}[${errorEntry.severity.toUpperCase()}] ${errorEntry.id}${reset}`,
            `\n🔥 Error: ${errorEntry.message}`,
            `\n📍 Component: ${errorEntry.context.component || 'unknown'}`,
            `\n🔢 Count: ${errorEntry.count}`,
            `\n⏰ Time: ${errorEntry.timestamp}`,
            errorEntry.context.url ? `\n🌐 URL: ${errorEntry.context.url}` : '',
            errorEntry.stack ? `\n📚 Stack: ${errorEntry.stack.split('\n')[1]}` : ''
        );
    }

    /**
     * Persist error to JSON log file
     */
    async persistToFile(errorEntry) {
        try {
            // Read existing log file
            let existingLog = [];
            try {
                const fileContent = await fs.readFile(this.logFilePath, 'utf8');
                existingLog = JSON.parse(fileContent);
            } catch (readError) {
                // File doesn't exist or is invalid, start fresh
                existingLog = [];
            }

            // Add new error entry
            existingLog.unshift(errorEntry);

            // Keep only last 500 entries in file
            if (existingLog.length > 500) {
                existingLog = existingLog.slice(0, 500);
            }

            // Write back to file
            await fs.writeFile(this.logFilePath, JSON.stringify(existingLog, null, 2));
        } catch (writeError) {
            console.warn('⚠️ Failed to write error log to file:', writeError.message);
        }
    }

    /**
     * Emit error to socket for real-time monitoring
     */
    emitToSocket(errorEntry) {
        try {
            if (global.socketIO) {
                global.socketIO.emit('error_tracked', {
                    id: errorEntry.id,
                    severity: errorEntry.severity,
                    message: errorEntry.message,
                    component: errorEntry.context.component,
                    timestamp: errorEntry.timestamp,
                    count: errorEntry.count
                });
            }
        } catch (socketError) {
            // Silently fail socket emission to avoid error loops
        }
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const now = new Date();
        const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
        const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentErrors = this.errorLog.filter(error => 
            new Date(error.timestamp) > lastHour
        );

        const dailyErrors = this.errorLog.filter(error => 
            new Date(error.timestamp) > lastDay
        );

        const severityCounts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        this.errorLog.forEach(error => {
            severityCounts[error.severity]++;
        });

        const topErrors = Array.from(this.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([message, count]) => ({ message, count }));

        return {
            total: this.errorLog.length,
            recentHour: recentErrors.length,
            recentDay: dailyErrors.length,
            severityCounts,
            topErrors,
            lastError: this.errorLog[0] || null
        };
    }

    /**
     * Get recent errors for monitoring dashboard
     */
    getRecentErrors(limit = 20) {
        return this.errorLog.slice(0, limit).map(error => ({
            id: error.id,
            timestamp: error.timestamp,
            message: error.message,
            severity: error.severity,
            component: error.context.component,
            count: error.count
        }));
    }

    /**
     * Clear error log (for testing or manual reset)
     */
    clearErrors() {
        this.errorLog = [];
        this.errorCounts.clear();
        console.log('🧹 Error tracking log cleared');
    }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

module.exports = errorTracker;
