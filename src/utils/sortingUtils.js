// Common sorting utilities for the application
class SortingUtils {
    /**
     * Sort array by votes in descending order (highest first)
     * @param {Array} array - Array of objects with votes property
     * @returns {Array} - Sorted array
     */
    static sortByVotesDesc(array) {
        return array.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }

    /**
     * Sort array by creation date in descending order (newest first)
     * @param {Array} array - Array of objects with createdAt property
     * @returns {Array} - Sorted array
     */
    static sortByDateDesc(array) {
        return array.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    /**
     * Sort array by views in descending order (highest first)
     * @param {Array} array - Array of objects with views property
     * @returns {Array} - Sorted array
     */
    static sortByViewsDesc(array) {
        return array.sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    /**
     * Sort array by engagement (votes + views + comments) in descending order
     * @param {Array} array - Array of objects with votes, views, and comments properties
     * @returns {Array} - Sorted array
     */
    static sortByEngagementDesc(array) {
        return array.sort((a, b) => {
            const aEngagement = (a.votes || 0) + (a.views || 0) + (a.comments || 0);
            const bEngagement = (b.votes || 0) + (b.views || 0) + (b.comments || 0);
            return bEngagement - aEngagement;
        });
    }

    /**
     * Generic sort function with multiple criteria
     * @param {Array} array - Array to sort
     * @param {string} sortBy - Sort criteria: 'votes', 'date', 'views', 'engagement'
     * @param {string} order - Sort order: 'asc' or 'desc'
     * @returns {Array} - Sorted array
     */
    static sortBy(array, sortBy = 'votes', order = 'desc') {
        const sortFunctions = {
            votes: (a, b) => (order === 'desc' ? (b.votes || 0) - (a.votes || 0) : (a.votes || 0) - (b.votes || 0)),
            date: (a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return order === 'desc' ? dateB - dateA : dateA - dateB;
            },
            views: (a, b) => (order === 'desc' ? (b.views || 0) - (a.views || 0) : (a.views || 0) - (b.views || 0)),
            engagement: (a, b) => {
                const aEngagement = (a.votes || 0) + (a.views || 0) + (a.comments || 0);
                const bEngagement = (b.votes || 0) + (b.views || 0) + (b.comments || 0);
                return order === 'desc' ? bEngagement - aEngagement : aEngagement - bEngagement;
            }
        };

        return array.sort(sortFunctions[sortBy] || sortFunctions.votes);
    }
}

module.exports = SortingUtils;
