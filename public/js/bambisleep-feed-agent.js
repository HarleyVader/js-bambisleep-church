/**
 * Bambisleep Feed Agent - Client Interface
 * Connects to server-side universal agent for feed management
 */

class BambisleepFeedAgent {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.feedStats = {
            totalLinks: 0,
            moderatedLinks: 0,
            rejectedLinks: 0,
            qualityScore: 0
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
            console.log('📰 Feed Agent connected');
        });

        this.socket.on('feed-update', (data) => {
            this.handleFeedUpdate(data);
        });

        this.socket.on('link-moderated', (data) => {
            this.handleLinkModerated(data);
        });

        this.socket.on('feed-stats', (data) => {
            this.handleFeedStats(data);
        });
    }

    // Submit new link for moderation
    submitLink(linkData) {
        if (!this.isConnected) {
            console.warn('Feed agent not connected');
            return;
        }

        this.socket.emit('submit-link', linkData);
        console.log('📰 Submitted link for moderation:', linkData.url);
    }

    // Request feed refresh
    refreshFeed() {
        if (!this.isConnected) return;
        
        this.socket.emit('refresh-feed');
        console.log('📰 Requested feed refresh');
    }

    // Handle feed updates
    handleFeedUpdate(data) {
        console.log('📰 Feed updated:', data);
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('feedUpdate', { 
            detail: data 
        }));
    }

    // Handle link moderation results
    handleLinkModerated(data) {
        console.log('📰 Link moderated:', data);
        
        // Update stats
        if (data.approved) {
            this.feedStats.moderatedLinks++;
        } else {
            this.feedStats.rejectedLinks++;
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('linkModerated', { 
            detail: data 
        }));
    }

    // Handle feed statistics
    handleFeedStats(data) {
        this.feedStats = { ...this.feedStats, ...data };
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('feedStats', { 
            detail: this.feedStats 
        }));
    }

    // Get current feed stats
    getStats() {
        return this.feedStats;
    }

    // Check if agent is running
    isRunning() {
        return this.isConnected;
    }
}

// Initialize global instance
window.feedAgent = new BambisleepFeedAgent();
