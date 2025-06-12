/**
 * 🕷️ Global Crawl Status Tracker
 * Tracks live crawling status across the application
 */

class CrawlStatusTracker {
    constructor() {
        this.activeCrawls = new Map();
        this.crawlHistory = [];
        this.maxHistorySize = 50;
    }

    startCrawl(crawlId, options = {}) {
        const crawlStatus = {
            id: crawlId,
            status: 'starting',
            startTime: Date.now(),
            endTime: null,
            totalUrls: 0,
            urlsRemaining: 0,
            urlsCrawled: 0,
            urlsQueue: [],
            newUrlsFound: 0,
            contentFound: 0,
            bambisleepContentFound: 0,
            iframesGenerated: 0,
            errors: [],
            currentUrl: null,
            estimatedTimeRemaining: null,
            options: options,
            progress: 0
        };

        this.activeCrawls.set(crawlId, crawlStatus);
        return crawlStatus;
    }

    updateCrawl(crawlId, updates) {
        const crawl = this.activeCrawls.get(crawlId);
        if (!crawl) return null;

        Object.assign(crawl, updates);
        
        // Calculate progress percentage
        if (crawl.totalUrls > 0) {
            crawl.progress = Math.round((crawl.urlsCrawled / crawl.totalUrls) * 100);
        }

        // Estimate time remaining
        if (crawl.urlsCrawled > 0 && crawl.urlsRemaining > 0) {
            const elapsed = Date.now() - crawl.startTime;
            const avgTimePerUrl = elapsed / crawl.urlsCrawled;
            crawl.estimatedTimeRemaining = avgTimePerUrl * crawl.urlsRemaining;
        }

        this.activeCrawls.set(crawlId, crawl);
        return crawl;
    }

    finishCrawl(crawlId, finalReport = {}) {
        const crawl = this.activeCrawls.get(crawlId);
        if (!crawl) return null;

        crawl.status = 'completed';
        crawl.endTime = Date.now();
        crawl.duration = crawl.endTime - crawl.startTime;
        crawl.progress = 100;
        crawl.estimatedTimeRemaining = 0;
        crawl.finalReport = finalReport;

        // Move to history
        this.crawlHistory.unshift(crawl);
        if (this.crawlHistory.length > this.maxHistorySize) {
            this.crawlHistory = this.crawlHistory.slice(0, this.maxHistorySize);
        }

        this.activeCrawls.delete(crawlId);
        return crawl;
    }

    errorCrawl(crawlId, error) {
        const crawl = this.activeCrawls.get(crawlId);
        if (!crawl) return null;

        crawl.status = 'error';
        crawl.endTime = Date.now();
        crawl.duration = crawl.endTime - crawl.startTime;
        crawl.errors.push({
            timestamp: Date.now(),
            error: error.message || error
        });

        // Move to history
        this.crawlHistory.unshift(crawl);
        this.activeCrawls.delete(crawlId);
        return crawl;
    }

    getCrawlStatus(crawlId) {
        return this.activeCrawls.get(crawlId) || 
               this.crawlHistory.find(c => c.id === crawlId);
    }

    getAllActiveCrawls() {
        return Array.from(this.activeCrawls.values());
    }

    getCrawlHistory() {
        return this.crawlHistory;
    }

    getOverallStats() {
        const active = this.getAllActiveCrawls();
        const totalActive = active.length;
        const totalContentFound = active.reduce((sum, crawl) => sum + crawl.contentFound, 0);
        const totalBambisleepFound = active.reduce((sum, crawl) => sum + crawl.bambisleepContentFound, 0);
        const totalIframes = active.reduce((sum, crawl) => sum + crawl.iframesGenerated, 0);

        return {
            activeCrawls: totalActive,
            totalContentFound,
            totalBambisleepFound,
            totalIframes,
            historyCount: this.crawlHistory.length
        };
    }

    formatTimeRemaining(ms) {
        if (!ms || ms <= 0) return 'Unknown';
        
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    generateCrawlId() {
        return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Global singleton instance
const crawlStatusTracker = new CrawlStatusTracker();

module.exports = crawlStatusTracker;
