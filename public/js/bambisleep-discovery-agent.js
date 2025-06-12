/**
 * Bambisleep Discovery Agent - Client Interface
 * Connects to server-side universal agent for content discovery
 */

class BambisleepDiscoveryAgent {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.stats = {
            totalScanned: 0,
            bambisleepFound: 0,
            contentByType: {}
        };
        
        // Wait for Socket.IO to be available
        this.init();
    }

    init() {
        // Socket.IO is loaded in footer.ejs, wait for it
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
            console.log('🔍 Discovery Agent connected');
        });

        this.socket.on('discovery-update', (data) => {
            this.handleDiscoveryUpdate(data);
        });

        this.socket.on('discovery-complete', (data) => {
            this.handleDiscoveryComplete(data);
        });
    }

    // Start content discovery
    startDiscovery(urls, options = {}) {
        if (!this.isConnected) {
            console.warn('Discovery agent not connected');
            return;
        }

        this.socket.emit('start-discovery', { urls, options });
        console.log('🔍 Started content discovery for', urls.length, 'URLs');
    }

    // Handle discovery updates
    handleDiscoveryUpdate(data) {
        this.stats = { ...this.stats, ...data };
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('discoveryUpdate', { 
            detail: data 
        }));
    }

    // Handle discovery completion
    handleDiscoveryComplete(data) {
        console.log('🔍 Discovery complete:', data);
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('discoveryComplete', { 
            detail: data 
        }));
    }

    // Get current stats
    getStats() {
        return this.stats;
    }

    // Check if agent is running
    isRunning() {
        return this.isConnected;
    }
}

// Initialize global instance
window.discoveryAgent = new BambisleepDiscoveryAgent();
