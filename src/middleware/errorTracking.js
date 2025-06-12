/**
 * Error Tracking Middleware for Express
 * Integrates centralized error tracking with HTTP requests
 */

const errorTracker = require('./errorTracker');

/**
 * Express error handling middleware
 * Captures and tracks all unhandled errors in Express routes
 */
function errorTrackingMiddleware(err, req, res, next) {
    // Create comprehensive context for error tracking
    const context = {
        url: req.originalUrl || req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        userId: req.user?.id || req.session?.userId || 'anonymous',
        component: 'api',
        action: `${req.method} ${req.originalUrl}`,
        headers: req.headers,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
        params: req.params,
        status: err.status || err.statusCode || 500
    };

    // Track the error
    errorTracker.trackError(err, context).then(errorId => {
        // Add error ID to response headers for tracking
        res.set('X-Error-ID', errorId);
        
        // If headers not sent, send appropriate error response
        if (!res.headersSent) {
            const status = err.status || err.statusCode || 500;
            res.status(status).json({
                error: true,
                message: status >= 500 ? 'Internal server error' : err.message,
                errorId: errorId,
                timestamp: new Date().toISOString()
            });
        }
    }).catch(trackingError => {
        console.error('❌ Failed to track error:', trackingError);
        
        // Fallback error response if tracking fails
        if (!res.headersSent) {
            res.status(500).json({
                error: true,
                message: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        }
    });
}

/**
 * Request context middleware
 * Adds request context to all requests for better error tracking
 */
function requestContextMiddleware(req, res, next) {
    // Add request start time for performance tracking
    req.startTime = Date.now();
    
    // Override res.json to track response times and errors
    const originalJson = res.json;
    res.json = function(data) {
        const responseTime = Date.now() - req.startTime;
        
        // Track slow responses as potential issues
        if (responseTime > 5000) { // 5 seconds
            errorTracker.trackError(new Error('Slow response detected'), {
                url: req.originalUrl,
                method: req.method,
                component: 'performance',
                responseTime: responseTime,
                severity: 'medium'
            });
        }
        
        return originalJson.call(this, data);
    };
    
    next();
}

/**
 * Async error wrapper for route handlers
 * Automatically catches async errors and passes them to error tracking
 */
function asyncErrorWrapper(fn) {
    return function(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Track custom errors manually
 */
function trackCustomError(error, context = {}) {
    return errorTracker.trackError(error, {
        component: 'manual',
        ...context
    });
}

module.exports = {
    errorTrackingMiddleware,
    requestContextMiddleware,
    asyncErrorWrapper,
    trackCustomError,
    errorTracker
};
