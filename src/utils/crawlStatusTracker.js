/**
 * Crawl Status Tracker
 * Tracks crawling operations status
 */

class CrawlStatusTracker {
    constructor() {
        this.activeCrawls = new Map();
        this.completedCrawls = new Map();
    }

    generateCrawlId() {
        return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    startCrawl(crawlId, options = {}) {
        const crawlStatus = {
            id: crawlId,
            status: 'running',
            startTime: new Date().toISOString(),
            progress: 0,
            estimatedTimeRemaining: null,
            ...options
        };
        
        this.activeCrawls.set(crawlId, crawlStatus);
        return crawlStatus;
    }

    updateCrawl(crawlId, updates) {
        const crawl = this.activeCrawls.get(crawlId);
        if (crawl) {
            Object.assign(crawl, updates);
            return crawl;
        }
        return null;
    }

    completeCrawl(crawlId, results = {}) {
        const crawl = this.activeCrawls.get(crawlId);
        if (crawl) {
            crawl.status = 'completed';
            crawl.endTime = new Date().toISOString();
            crawl.results = results;
            
            this.completedCrawls.set(crawlId, crawl);
            this.activeCrawls.delete(crawlId);
            return crawl;
        }
        return null;
    }

    getCrawlStatus(crawlId) {
        return this.activeCrawls.get(crawlId) || this.completedCrawls.get(crawlId) || null;
    }

    getAllActiveCrawls() {
        return Array.from(this.activeCrawls.values());
    }

    getOverallStats() {
        return {
            active: this.activeCrawls.size,
            completed: this.completedCrawls.size,
            total: this.activeCrawls.size + this.completedCrawls.size
        };
    }

    formatTimeRemaining(seconds) {
        if (!seconds) return 'Unknown';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
}

// Export singleton instance
module.exports = new CrawlStatusTracker();
