// Standardized response utilities for consistent API responses
class ResponseUtils {
    /**
     * Send success response
     * @param {Object} res - Express response object
     * @param {Object} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code (default: 200)
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        const response = {
            success: true,
            message
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Send error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code (default: 500)
     * @param {Object} details - Additional error details
     */
    static error(res, message = 'Internal Server Error', statusCode = 500, details = null) {
        const response = {
            success: false,
            message
        };

        if (details) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * Send validation error response
     * @param {Object} res - Express response object
     * @param {string} message - Validation error message
     * @param {Array} errors - Array of validation errors
     */
    static validationError(res, message = 'Validation failed', errors = []) {
        return res.status(400).json({
            success: false,
            message,
            errors
        });
    }

    /**
     * Send not found response
     * @param {Object} res - Express response object
     * @param {string} resource - Name of the resource not found
     */
    static notFound(res, resource = 'Resource') {
        return res.status(404).json({
            success: false,
            message: `${resource} not found`
        });
    }

    /**
     * Send created response for successful resource creation
     * @param {Object} res - Express response object
     * @param {Object} data - Created resource data
     * @param {string} message - Success message
     */
    static created(res, data, message = 'Resource created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Send unauthorized response
     * @param {Object} res - Express response object
     * @param {string} message - Unauthorized message
     */
    static unauthorized(res, message = 'Unauthorized access') {
        return res.status(401).json({
            success: false,
            message
        });
    }

    /**
     * Handle async controller errors
     * @param {Function} controllerFn - Async controller function
     * @returns {Function} - Wrapped controller function with error handling
     */
    static asyncHandler(controllerFn) {
        return (req, res, next) => {
            Promise.resolve(controllerFn(req, res, next)).catch(next);
        };
    }
}

module.exports = ResponseUtils;
