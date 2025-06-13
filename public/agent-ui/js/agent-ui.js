// BambiSleep Agent UI - Main Controller
// Unified interface controller that manages all agent interactions

class AgentUIController {
    constructor() {
        this.agents = {
            discovery: null,
            feed: null,
            stats: null
        };
        
        this.currentPanel = 'discovery';
        this.initialized = false;
        this.maxResults = 100; // Limit resource usage
        this.throttleTimeout = null;
        this.debounceTimeout = null;
        
        this.statusIndicators = {
            global: document.getElementById('globalStatusIndicator'),
            discovery: document.getElementById('discoveryStatus'),
            feed: document.getElementById('feedStatus'),
            stats: document.getElementById('statsStatus')
        };
        
        this.statusTexts = {
            global: document.getElementById('globalStatusText'),
            discovery: document.getElementById('discoveryStatusText'),
            feed: document.getElementById('feedStatusText'),
            stats: document.getElementById('statsStatusText')
        };
        
        this.loadingState = document.getElementById('agentLoadingState');
    }

    // Throttle function to limit execution frequency
    throttle(func, delay) {
        if (this.throttleTimeout) return;
        this.throttleTimeout = setTimeout(() => {
            func.apply(this, arguments);
            this.throttleTimeout = null;
        }, delay);
    }

    // Debounce function to delay execution until after delay
    debounce(func, delay) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
            func.apply(this, arguments);
        }, delay);
    }

    async initialize() {
        console.log('🚀 Initializing BambiSleep Agent UI Controller...');
        
        // Setup UI event handlers
        this.setupTabNavigation();
        this.setupFormHandlers();
        
        // Initialize agents in sequence
        await this.initializeAgents();
        
        // Setup real-time updates
        this.setupRealTimeUpdates();
        
        // Hide loading state
        this.hideLoadingState();
        
        this.initialized = true;
        this.updateGlobalStatus('ready', '✅ All agents initialized and ready');
        
        console.log('✅ Agent UI Controller initialized successfully');
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const panels = document.querySelectorAll('.agent-panel');
        
        tabButtons.forEach((button, index) => {
            button.addEventListener('click', () => {
                this.switchPanel(button.dataset.panel);
            });
            
            // Keyboard navigation support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.switchPanel(button.dataset.panel);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const direction = e.key === 'ArrowLeft' ? -1 : 1;
                    const newIndex = (index + direction + tabButtons.length) % tabButtons.length;
                    tabButtons[newIndex].focus();
                }
            });
            
            // Add ARIA attributes for accessibility
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-selected', button.classList.contains('active'));
            button.setAttribute('aria-controls', `${button.dataset.panel}Panel`);
        });
        
        // Set up tab list attributes
        const tabList = document.querySelector('.agent-tabs');
        if (tabList) {
            tabList.setAttribute('role', 'tablist');
            tabList.setAttribute('aria-label', 'Agent interface navigation');
        }
        
        // Set up panel attributes
        panels.forEach(panel => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('tabindex', '0');
        });
    }

    switchPanel(panelId) {
        const tabButtons = document.querySelectorAll('.tab-button');
        const panels = document.querySelectorAll('.agent-panel');
        
        // Update active tab
        tabButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        const activeButton = document.querySelector(`[data-panel="${panelId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-selected', 'true');
        }
        
        // Update active panel
        panels.forEach(p => p.classList.remove('active'));
        const activePanel = document.getElementById(`${panelId}Panel`);
        if (activePanel) {
            activePanel.classList.add('active');
            // Announce panel change to screen readers
            activePanel.focus();
        }
        
        this.currentPanel = panelId;
        this.onPanelChange(panelId);
    }

    setupFormHandlers() {
        // Discovery form
        const discoveryForm = document.getElementById('discoveryForm');
        if (discoveryForm) {
            discoveryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const validation = this.validateForm(discoveryForm);
                if (validation.isValid) {
                    await this.handleDiscoverySubmit();
                } else {
                    this.showError(validation.errors.join(', '));
                }
            });
        }

        // Feed submission form
        const feedForm = document.getElementById('feedSubmissionForm');
        if (feedForm) {
            feedForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const validation = this.validateForm(feedForm);
                if (validation.isValid) {
                    await this.handleFeedSubmit();
                } else {
                    this.showError(validation.errors.join(', '));
                }
            });
        }

        // URL input real-time analysis
        const discoveryUrls = document.getElementById('discoveryUrls');
        if (discoveryUrls) {
            discoveryUrls.addEventListener('input', () => {
                this.analyzeUrlsPreview();
            });
        }

        // Insight tabs
        const insightTabs = document.querySelectorAll('.insight-tab');
        insightTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.handleInsightTabClick(tab);
            });
        });
    }

    async initializeAgents() {
        
        try {
            // Initialize discovery agent if available
            await this.initializeDiscoveryAgent();
            
            // Initialize feed agent if available  
            await this.initializeFeedAgent();
            
            // Initialize stats agent if available
            await this.initializeStatsAgent();
            
            // Load initial data
            await this.loadInitialData();
            
            
        } catch (error) {
            console.error('❌ Agent initialization failed:', error);
            this.showError('Failed to initialize agents: ' + error.message);
        }
    }

    async initializeDiscoveryAgent() {
        try {
            this.updateAgentStatus('discovery', 'loading', 'Initializing discovery agent...');
            
            // Lazy load discovery agent if not already loaded
            if (typeof BambiSleepDiscoveryAgent === 'undefined') {
                await this.loadScript('/js/bambisleep-discovery-agent.js');
            }
            
            if (typeof BambiSleepDiscoveryAgent !== 'undefined') {
                this.agents.discovery = new BambiSleepDiscoveryAgent();
                await this.agents.discovery.initialize();
                this.updateAgentStatus('discovery', 'ready', '✅ Discovery agent ready');
            } else {
                throw new Error('Discovery agent not available');
            }
        } catch (error) {
            this.updateAgentStatus('discovery', 'error', '❌ Discovery agent failed');
            
        }
    }

    async initializeFeedAgent() {
        try {
            this.updateAgentStatus('feed', 'loading', 'Initializing feed agent...');
            
            // Lazy load feed agent if not already loaded
            if (typeof BambiSleepFeedAgent === 'undefined') {
                await this.loadScript('/js/bambisleep-feed-agent.js');
            }
            
            if (typeof BambiSleepFeedAgent !== 'undefined') {
                this.agents.feed = new BambiSleepFeedAgent();
                await this.agents.feed.initialize();
                this.updateAgentStatus('feed', 'ready', '✅ Feed agent ready');
            } else {
                throw new Error('Feed agent not available');
            }
        } catch (error) {
            this.updateAgentStatus('feed', 'error', '❌ Feed agent failed');
            
        }
    }

    async initializeStatsAgent() {
        try {
            this.updateAgentStatus('stats', 'loading', 'Initializing stats agent...');
            
            // Lazy load stats agent if not already loaded
            if (typeof BambiSleepStatsAgent === 'undefined') {
                await this.loadScript('/js/bambisleep-stats-agent.js');
            }
            
            if (typeof BambiSleepStatsAgent !== 'undefined') {
                this.agents.stats = new BambiSleepStatsAgent();
                await this.agents.stats.initialize();
                this.updateAgentStatus('stats', 'ready', '✅ Stats agent ready');
            } else {
                throw new Error('Stats agent not available');
            }
        } catch (error) {
            this.updateAgentStatus('stats', 'error', '❌ Stats agent failed');
            
        }
    }

    // Utility method for lazy loading scripts
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }

    async loadInitialData() {
        try {
            // Load feed statistics
            if (this.agents.feed) {
                const feedStats = await this.agents.feed.getValidationStats();
                this.updateFeedStats(feedStats);
            }

            // Load intelligence statistics
            if (this.agents.stats) {
                const stats = await this.agents.stats.getStats();
                this.updateStatsDisplay(stats);
            }

            // Load initial insights
            await this.loadInsight('who');

        } catch (error) {
            
        }
    }

    setupRealTimeUpdates() {
        // Update stats every 30 seconds
        setInterval(async () => {
            if (this.agents.stats) {
                const stats = await this.agents.stats.getStats();
                this.updateStatsDisplay(stats);
            }
        }, 30000);

        // Update feed stats every 60 seconds
        setInterval(async () => {
            if (this.agents.feed) {
                const feedStats = await this.agents.feed.getValidationStats();
                this.updateFeedStats(feedStats);
            }
        }, 60000);

        // Socket.IO real-time updates if available
        if (typeof io !== 'undefined') {
            const socket = io();
            
            socket.on('newContent', (data) => {
                this.handleNewContent(data);
            });
            
            socket.on('agentUpdate', (data) => {
                this.handleAgentUpdate(data);
            });
            
            socket.on('connect', () => {
                
                this.updateConnectionStatus(true);
            });
            
            socket.on('disconnect', () => {
                
                this.updateConnectionStatus(false);
            });
            
            socket.on('error', (error) => {
                
                this.showError('Real-time connection error: ' + error.message);
            });
            
            // Join agent monitoring room
            socket.emit('joinAgentMonitoring');
            
            this.socket = socket;
        } else {
            
        }
    }

    // Event Handlers
    async handleDiscoverySubmit() {
        if (!this.agents.discovery) {
            this.showError('Discovery agent not available');
            return;
        }

        const urls = document.getElementById('discoveryUrls').value
            .split('\n')
            .filter(url => url.trim())
            .map(url => url.trim());

        if (urls.length === 0) {
            this.showError('Please enter at least one URL to analyze');
            return;
        }

        try {
            // Use the existing discovery agent method
            await this.agents.discovery.startDiscovery();
        } catch (error) {
            
            this.showError('Discovery failed: ' + error.message);
        }
    }

    async handleFeedSubmit() {
        const form = document.getElementById('feedSubmissionForm');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: formData.get('url'),
                    title: formData.get('title'),
                    description: formData.get('description')
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.showSuccess('Content submitted successfully!');
                form.reset();
                
                // Refresh feed display
                if (this.agents.feed) {
                    await this.agents.feed.forceValidation();
                }
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            
            this.showError('Submission failed: ' + error.message);
        }
    }

    analyzeUrlsPreview() {
        if (!this.agents.discovery) return;
        
        // Use the existing preview analysis method
        this.agents.discovery.analyzeUrlsPreview();
    }

    async handleInsightTabClick(tab) {
        const question = tab.dataset.question;
        
        // Update active tab
        document.querySelectorAll('.insight-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Load insight
        await this.loadInsight(question);
    }

    async loadInsight(question) {
        const insightContent = document.getElementById('insightContent');
        if (!insightContent) return;

        try {
            insightContent.innerHTML = '<div class="loading-state"><div class="spinner"></div>Loading insights...</div>';
            
            if (this.agents.stats) {
                const insight = await this.agents.stats.getInsight(question);
                if (insight) {
                    insightContent.innerHTML = `
                        <div class="insight-response">
                            <h4>${this.getInsightTitle(question)}</h4>
                            <p>${insight.analysis || 'No analysis available'}</p>
                        </div>
                    `;
                } else {
                    insightContent.innerHTML = `
                        <div class="insight-response">
                            <h4>${this.getInsightTitle(question)}</h4>
                            <p>Insight not yet available. The stats agent is still analyzing data.</p>
                        </div>
                    `;
                }
            } else {
                insightContent.innerHTML = '<p>Stats agent not available for insights.</p>';
            }
        } catch (error) {
            
            insightContent.innerHTML = '<p>Error loading insight data.</p>';
        }
    }

    // UI Update Methods
    updateGlobalStatus(status, message) {
        if (this.statusIndicators.global) {
            this.statusIndicators.global.className = `status-indicator ${status}`;
        }
        
        if (this.statusTexts.global) {
            this.statusTexts.global.textContent = message;
        }
    }

    updateAgentStatus(agent, status, message) {
        if (this.statusIndicators[agent]) {
            this.statusIndicators[agent].className = `status-indicator ${status}`;
        }
        
        if (this.statusTexts[agent]) {
            this.statusTexts[agent].textContent = message;
        }
    }

    updateFeedStats(stats) {
        const elements = {
            'feedTotalContent': stats.totalChecked || 0,
            'feedValidated': stats.bambisleepVerified || 0,
            'feedRemoved': stats.nonBambisleepRemoved || 0,
            'feedRelevanceRate': `${((stats.bambisleepVerified / Math.max(stats.totalChecked, 1)) * 100).toFixed(1)}%`
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    updateStatsDisplay(stats) {
        const elements = {
            'totalKnowledgeItems': stats.totalContent || 0,
            'activeUsers': stats.realTime?.activeUsers || 0,
            'contentValidated': stats.realTime?.contentValidated || 0,
            'a2aMessages': stats.realTime?.moderationActions || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    hideLoadingState() {
        if (this.loadingState) {
            this.loadingState.style.display = 'none';
        }
    }

    onPanelChange(panelId) {
        
        // Panel-specific initialization
        switch (panelId) {
            case 'discovery':
                if (this.agents.discovery) {
                    this.agents.discovery.analyzeUrlsPreview();
                }
                break;
            case 'feed':
                // Refresh feed data if needed
                break;
            case 'stats':
                // Refresh stats if needed
                break;
        }
    }

    handleNewContent(data) {
        try {
            // Update relevant displays
            if (this.currentPanel === 'feed') {
                this.refreshFeedDisplay();
            }
            
            // Show notification
            this.showNotification(`📝 New content: ${data.title || 'Unknown'}`);
            
            // Update statistics
            if (this.agents.stats) {
                this.agents.stats.handleNewContent(data);
            }
        } catch (error) {
            
        }
    }

    handleAgentUpdate(data) {
        try {
            const { agentId, status, message } = data;
            
            // Update agent status indicators
            if (this.statusIndicators[agentId] && this.statusTexts[agentId]) {
                this.updateAgentStatus(agentId, status, message);
            }
            
            // Log agent activity
            this.logAgentActivity(`${agentId}: ${message}`);
        } catch (error) {
            
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.querySelector('.connection-status');
        if (indicator) {
            indicator.classList.toggle('connected', connected);
            indicator.classList.toggle('disconnected', !connected);
        }
    }

    // Enhanced error handling with user-friendly messages
    showError(message, timeout = 5000) {
        try {
            // Remove existing error notifications
            document.querySelectorAll('.error-notification').forEach(el => el.remove());
            
            const notification = document.createElement('div');
            notification.className = 'error-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">⚠️</span>
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            // Add accessibility attributes
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'assertive');
            
            document.body.appendChild(notification);
            
            // Auto-remove after timeout
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, timeout);
            
            // Log error for debugging
            console.error('UI Error:', message);
        } catch (error) {
            
        }
    }

    showNotification(message, type = 'info', timeout = 3000) {
        try {
            const notification = document.createElement('div');
            notification.className = `success-notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <span class="notification-icon">${type === 'success' ? '✅' : '📝'}</span>
                    <span class="notification-message">${message}</span>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            // Add accessibility attributes
            notification.setAttribute('role', 'status');
            notification.setAttribute('aria-live', 'polite');
            
            document.body.appendChild(notification);
            
            // Auto-remove after timeout
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, timeout);
        } catch (error) {
            
        }
    }

    logAgentActivity(message) {
        try {
            const logContainer = document.getElementById('agentActivityLog');
            if (logContainer) {
                const timestamp = new Date().toLocaleTimeString();
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.innerHTML = `<span class="log-time">[${timestamp}]</span> ${message}`;
                
                logContainer.appendChild(logEntry);
                
                // Keep only last 50 entries
                const entries = logContainer.children;
                if (entries.length > 50) {
                    entries[0].remove();
                }
                
                // Auto-scroll to bottom
                logContainer.scrollTop = logContainer.scrollHeight;
            }
        } catch (error) {
            
        }
    }

    async refreshFeedDisplay() {
        try {
            if (this.agents.feed) {
                await this.agents.feed.forceValidation();
                const feedStats = await this.agents.feed.getValidationStats();
                this.updateFeedStats(feedStats);
            }
        } catch (error) {
            
            this.showError('Failed to refresh feed data');
        }
    }

    // Enhanced form validation with accessibility
    validateForm(formElement) {
        const requiredFields = formElement.querySelectorAll('[required]');
        let isValid = true;
        const errors = [];
        
        requiredFields.forEach(field => {
            const value = field.value.trim();
            const label = field.previousElementSibling?.textContent || field.name || 'Field';
            
            // Remove existing error styling
            field.classList.remove('error');
            field.removeAttribute('aria-describedby');
            
            if (!value) {
                isValid = false;
                errors.push(`${label} is required`);
                field.classList.add('error');
                
                // Add error message for screen readers
                const errorId = `${field.id || field.name}-error`;
                let errorElement = document.getElementById(errorId);
                if (!errorElement) {
                    errorElement = document.createElement('div');
                    errorElement.id = errorId;
                    errorElement.className = 'field-error sr-only';
                    field.parentNode.appendChild(errorElement);
                }
                errorElement.textContent = `Error: ${label} is required`;
                field.setAttribute('aria-describedby', errorId);
            }
        });
        
        // URL validation for URL fields
        const urlFields = formElement.querySelectorAll('input[type="url"]');
        urlFields.forEach(field => {
            const value = field.value.trim();
            if (value && !this.isValidUrl(value)) {
                isValid = false;
                errors.push('Please enter a valid URL');
                field.classList.add('error');
            }
        });
        
        return { isValid, errors };
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Public API
    getAgent(type) {
        return this.agents[type];
    }

    async forceRefresh() {
        await this.loadInitialData();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for other scripts to load
    setTimeout(async () => {
        window.agentUI = new AgentUIController();
        await window.agentUI.initialize();
    }, 1000);
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AgentUIController;
}
