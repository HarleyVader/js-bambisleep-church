/**
 * Error Tracking Middleware
 * Tracks and logs application errors
 */

const errorTracker = {
    errors: [],
    
    trackError(error, context = {}) {
        const errorEntry = {
            id: Date.now(),
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        
        this.errors.push(errorEntry);
        
        // Keep only last 100 errors
        if (this.errors.length > 100) {
            this.errors = this.errors.slice(-100);
        }
        
        console.error('Tracked error:', errorEntry);
        return errorEntry.id;
    },
    
    getRecentErrors(limit = 20) {
        return this.errors.slice(-limit);
    },
    
    getErrorStats() {
        return {
            total: this.errors.length,
            recent: this.getRecentErrors(10).length,
            lastError: this.errors.length > 0 ? this.errors[this.errors.length - 1] : null
        };
    }
};

const requestContextMiddleware = (req, res, next) => {
    req.context = {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    };
    next();
};

const errorTrackingMiddleware = (error, req, res, next) => {
    const context = req.context || {};
    const errorId = errorTracker.trackError(error, context);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        errorId: errorId
    });
};

const trackCustomError = (error, context = {}) => {
    return errorTracker.trackError(error, context);
};

module.exports = {
    errorTracker,
    errorTrackingMiddleware,
    requestContextMiddleware,
    trackCustomError
};
