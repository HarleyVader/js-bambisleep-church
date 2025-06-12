/**
 * Bambisleep Stats Agent - Client Interface  
 * Connects to server-side universal agent for statistics management
 */

class BambisleepStatsAgent {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.stats = {
            totalViews: 0,
            totalVotes: 0,
            popularContent: [],
            platformBreakdown: {},
            trendingTopics: []
        };
        
        this.init();
    }

    init() {
        // Wait for Socket.IO to be available
        if (typeof io !== 'undefined') {
            this.socket = io();
            this.setupEventHandlers();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('📊 Stats Agent connected');
            this.requestStats();
        });

        this.socket.on('stats-update', (data) => {
            this.handleStatsUpdate(data);
        });

        this.socket.on('trending-update', (data) => {
            this.handleTrendingUpdate(data);
        });

        this.socket.on('analytics-data', (data) => {
            this.handleAnalyticsData(data);
        });
    }

    // Request current statistics
    requestStats() {
        if (!this.isConnected) return;
        
        this.socket.emit('request-stats');
        console.log('📊 Requested current statistics');
    }

    // Track user interaction
    trackInteraction(type, data) {
        if (!this.isConnected) return;
        
        this.socket.emit('track-interaction', { type, data, timestamp: Date.now() });
    }

    // Handle stats updates
    handleStatsUpdate(data) {
        this.stats = { ...this.stats, ...data };
        console.log('📊 Stats updated:', data);
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('statsUpdate', { 
            detail: this.stats 
        }));
    }

    // Handle trending updates
    handleTrendingUpdate(data) {
        this.stats.trendingTopics = data.trending || [];
        console.log('📊 Trending updated:', data);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('trendingUpdate', { 
            detail: data 
        }));
    }

    // Handle analytics data
    handleAnalyticsData(data) {
        console.log('📊 Analytics data received:', data);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('analyticsData', { 
            detail: data 
        }));
    }

    // Get current stats
    getStats() {
        return this.stats;
    }

    // Get popular content
    getPopularContent() {
        return this.stats.popularContent || [];
    }

    // Get platform breakdown
    getPlatformBreakdown() {
        return this.stats.platformBreakdown || {};
    }

    // Check if agent is running
    isRunning() {
        return this.isConnected;
    }
}

// Initialize global instance
window.statsAgent = new BambisleepStatsAgent();
