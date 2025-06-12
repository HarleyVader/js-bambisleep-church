// Enhanced Feed JavaScript - Advanced filtering, platform organization, and real-time updates
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    let currentPage = 1;
    let isLoading = false;
    let allContent = [];
    let filteredContent = [];
    let platforms = [];
    let currentView = 'grid';
    let filters = {
        sort: 'newest',
        type: '',
        category: '',
        search: '',
        platforms: [],
        highQuality: false,
        newContent: false,
        trending: false
    };
    
    // DOM elements
    const feedContainer = document.getElementById('feedContainer');
    const platformGrid = document.getElementById('platformGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const platformFilters = document.getElementById('platformFilters');
    const sidebarPlatforms = document.getElementById('sidebarPlatforms');
    const recentActivity = document.getElementById('recentActivity');
    
    // Initialize enhanced feed
    initializeEnhancedFeed();
      function initializeEnhancedFeed() {
        setupViewModes();
        setupFilters();
        setupAdvancedFilters();
        setupRealTimeUpdates();
        setupSidebar();
        loadInitialContent();
        loadPlatformData();
        
        // Check URL parameters for initial view
        checkURLParameters();
    }
    
    // Check URL parameters for initial view mode
    function checkURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        
        if (viewParam && ['platform', 'grid', 'list', 'compact'].includes(viewParam)) {
            // Update the active button
            document.querySelectorAll('.view-mode-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.mode === viewParam) {
                    btn.classList.add('active');
                }
            });
            
            // Switch to the specified view
            currentView = viewParam;
            switchView(viewParam);
        }
    }
    
    // View mode management
    function setupViewModes() {
        document.querySelectorAll('.view-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.mode;
                switchView(currentView);
            });
        });
    }
    
    function switchView(view) {
        const gridView = document.getElementById('gridView');
        const platformView = document.getElementById('platformView');
        
        // Hide all views
        gridView.style.display = 'none';
        platformView.style.display = 'none';
        
        switch (view) {
            case 'platform':
                platformView.style.display = 'block';
                renderPlatformView();
                break;
            case 'grid':
                gridView.style.display = 'block';
                feedContainer.className = 'feed-container grid-view';
                renderFilteredContent();
                break;
            case 'list':
                gridView.style.display = 'block';
                feedContainer.className = 'feed-container list-view';
                renderFilteredContent();
                break;
            case 'compact':
                gridView.style.display = 'block';
                feedContainer.className = 'feed-container compact-view';
                renderFilteredContent();
                break;
        }
        
        updateFilteredCount();
    }
    
    // Filter management
    function setupFilters() {
        // Sort filter
        document.getElementById('sortFilter').addEventListener('change', (e) => {
            filters.sort = e.target.value;
            applyFilters();
        });
        
        // Type filter
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            filters.type = e.target.value;
            applyFilters();
        });
        
        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            filters.category = e.target.value;
            applyFilters();
        });
        
        // Search filter
        const searchInput = document.getElementById('searchFilter');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filters.search = e.target.value.toLowerCase();
                applyFilters();
            }, 300);
        });
        
        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', resetFilters);
        
        // Refresh feed
        document.getElementById('refreshFeed').addEventListener('click', refreshFeed);
        
        // Export filtered
        document.getElementById('exportFiltered').addEventListener('click', exportFilteredContent);
    }
    
    function setupAdvancedFilters() {
        document.getElementById('highQualityOnly').addEventListener('change', (e) => {
            filters.highQuality = e.target.checked;
            applyFilters();
        });
        
        document.getElementById('newContentOnly').addEventListener('change', (e) => {
            filters.newContent = e.target.checked;
            applyFilters();
        });
        
        document.getElementById('trendingOnly').addEventListener('change', (e) => {
            filters.trending = e.target.checked;
            applyFilters();
        });
    }
    
    function createPlatformFilter(platform, count) {
        const btn = document.createElement('button');
        btn.className = 'platform-filter-btn';
        btn.dataset.platform = platform;
        btn.innerHTML = `${getPlatformIcon(platform)} ${platform} (${count})`;
        
        btn.addEventListener('click', () => {
            const isActive = btn.classList.contains('active');
            
            if (isActive) {
                btn.classList.remove('active');
                filters.platforms = filters.platforms.filter(p => p !== platform);
            } else {
                btn.classList.add('active');
                filters.platforms.push(platform);
            }
            
            applyFilters();
        });
        
        return btn;
    }
      // Content loading and management
    async function loadInitialContent() {
        try {
            const response = await fetch('/api/feed?page=1&limit=50');
            const data = await response.json();
            
            if (data.links && data.links.length > 0) {
                allContent = data.links;
                applyFilters();
                updateLiveCount();
            } else {
                console.log('No content loaded from API');
                // Try fallback to links API
                const fallbackResponse = await fetch('/api/links');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    allContent = fallbackData || [];
                    applyFilters();
                }
            }
        } catch (error) {
            console.error('Error loading initial content:', error);
            // Try fallback to links API
            try {
                const fallbackResponse = await fetch('/api/links');
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    allContent = fallbackData || [];
                    applyFilters();
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                showError('Failed to load content');
            }
        }
    }
      async function loadPlatformData() {
        try {
            const response = await fetch('/api/platforms');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.success) {
                platforms = data.platforms || [];
                updatePlatformFilters();
                updateSidebarPlatforms();
                updatePlatformStats();
            } else {
                console.warn('Platform data request was not successful:', data);
            }
        } catch (error) {
            console.error('Error loading platform data:', error);
            // Try to continue with empty platforms array
            platforms = [];
        }
    }function updatePlatformFilters() {
        if (!platformFilters) return;
        
        platformFilters.innerHTML = '';
        
        const platformCounts = {};
        allContent.forEach(item => {
            const platform = item.metadata?.platform || item.platform || 'unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        Object.entries(platformCounts)
            .sort(([,a], [,b]) => b - a)
            .forEach(([platform, count]) => {
                platformFilters.appendChild(createPlatformFilter(platform, count));
            });
    }
    
    // Filter application
    function applyFilters() {
        filteredContent = allContent.filter(item => {
            // Type filter
            if (filters.type && item.contentType !== filters.type) return false;
            
            // Category filter
            if (filters.category) {
                const platformCategories = {
                    video: ['youtube', 'vimeo', 'dailymotion', 'twitch'],
                    audio: ['soundcloud', 'spotify', 'bandcamp', 'anchor'],
                    creator: ['patreon', 'ko-fi', 'onlyfans', 'subscribestar', 'gumroad', 'etsy'],
                    hypno: ['bambicloud', 'hypnotube'],
                    social: ['twitter', 'reddit'],
                    storage: ['google-drive', 'dropbox', 'mega']
                };
                  const categoryPlatforms = platformCategories[filters.category] || [];
                if (!categoryPlatforms.includes((item.metadata?.platform || '').toLowerCase())) return false;
            }
              // Platform filter
            if (filters.platforms.length > 0) {
                const platform = item.metadata?.platform || item.platform || 'unknown';
                if (!filters.platforms.includes(platform)) return false;
            }
              // Search filter
            if (filters.search) {
                const platform = item.metadata?.platform || item.platform || 'unknown';
                const searchFields = [
                    item.title,
                    item.uploader,
                    platform,
                    item.description
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchFields.includes(filters.search)) return false;
            }
            
            // High quality filter
            if (filters.highQuality && (item.qualityScore || 0) < 6) return false;
            
            // New content filter
            if (filters.newContent) {
                const itemDate = new Date(item.createdAt || 0);
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                if (itemDate <= oneDayAgo) return false;
            }
            
            // Trending filter
            if (filters.trending) {
                const engagement = (item.votes || 0) + (item.views || 0) + (item.comments || 0);
                if (engagement < 10) return false; // Basic trending threshold
            }
            
            return true;
        });
        
        // Apply sorting
        sortContent();
        
        // Render based on current view
        if (currentView === 'platform') {
            renderPlatformView();
        } else {
            renderFilteredContent();
        }
        
        updateFilteredCount();
        updateActiveFiltersCount();
    }
    
    function sortContent() {
        filteredContent.sort((a, b) => {
            switch (filters.sort) {
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'oldest':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'votes':
                    return (b.votes || 0) - (a.votes || 0);
                case 'comments':
                    return (b.comments || 0) - (a.comments || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);                case 'platform':
                    const aPlatform = a.metadata?.platform || a.platform || '';
                    const bPlatform = b.metadata?.platform || b.platform || '';
                    return aPlatform.localeCompare(bPlatform);
                case 'quality':
                    return (b.qualityScore || 0) - (a.qualityScore || 0);
                case 'engagement':
                    const aEngagement = (a.votes || 0) + (a.views || 0) + (a.comments || 0);
                    const bEngagement = (b.votes || 0) + (b.views || 0) + (b.comments || 0);
                    return bEngagement - aEngagement;
                default:
                    return 0;
            }
        });
    }
    
    // Rendering functions
    function renderFilteredContent() {
        if (!feedContainer) return;
        
        feedContainer.innerHTML = '';
        
        if (filteredContent.length === 0) {
            feedContainer.innerHTML = `
                <div class="no-content">
                    <h3 class="glitch">No content matches your filters</h3>
                    <p>Try adjusting your filters or <a href="/submit" style="color: var(--color-primary-cyan);">submit new content</a>!</p>
                </div>
            `;
            return;
        }
        
        filteredContent.forEach(item => {
            const card = createContentCard(item);
            feedContainer.appendChild(card);
        });
    }      function renderPlatformView() {
        if (!platformGrid) {
            console.warn('Platform grid element not found');
            return;
        }
        
        platformGrid.innerHTML = '';
        
        // Check if we have content to display
        if (!filteredContent || filteredContent.length === 0) {
            platformGrid.innerHTML = `
                <div class="no-content">
                    <h3 class="glitch">No content available</h3>
                    <p>Try <a href="/submit" style="color: var(--color-primary-cyan);">submitting some content</a> first!</p>
                </div>
            `;
            return;
        }
        
        // Group filtered content by platform
        const platformGroups = {};
        filteredContent.forEach(item => {
            const platform = item.metadata?.platform || item.platform || 'unknown';
            if (!platformGroups[platform]) {
                platformGroups[platform] = [];
            }
            platformGroups[platform].push(item);
        });
        
        // Create platform cards
        Object.entries(platformGroups)
            .sort(([,a], [,b]) => b.length - a.length)
            .forEach(([platform, items]) => {
                const card = createPlatformCard(platform, items);
                platformGrid.appendChild(card);
            });
    }
      function createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'link-card';
        card.dataset.linkId = item.id;
        
        // Get platform from metadata or fallback to direct platform property
        const platform = item.metadata?.platform || item.platform || 'unknown';
        const platformIcon = getPlatformIcon(platform);
        const qualityBadge = item.qualityScore ? `
            <span class="quality-badge quality-${getQualityClass(item.qualityScore)}">
                ${item.qualityScore}/10
            </span>
        ` : '';
        
        card.innerHTML = `
            <div class="link-header">
                <div class="platform-info">
                    <span class="platform-icon">${platformIcon}</span>
                    <span class="platform-name">${platform}</span>
                    ${qualityBadge}
                </div>
                <div class="link-stats">
                    <span class="stat">⭐ ${item.votes || 0}</span>
                    <span class="stat">👁 ${item.views || 0}</span>
                    <span class="stat">💬 ${item.comments || 0}</span>
                </div>
            </div>
            <h3 class="link-title">
                <a href="${item.url}" target="_blank">${item.title}</a>
            </h3>
            ${item.description ? `<p class="link-description">${item.description}</p>` : ''}
            ${item.uploader ? `<p class="link-uploader">By: ${item.uploader}</p>` : ''}
            <div class="link-meta">
                <span class="content-type">${item.contentType || 'Content'}</span>
                <span class="upload-date">${formatDate(item.createdAt)}</span>
            </div>
        `;
        
        return card;
    }
    
    function createPlatformCard(platform, items) {
        const card = document.createElement('div');
        card.className = 'platform-card';
        
        const totalVotes = items.reduce((sum, item) => sum + (item.votes || 0), 0);
        const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
        const avgQuality = items.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / items.length;
        
        card.innerHTML = `
            <div class="platform-header">
                <span class="platform-icon">${getPlatformIcon(platform)}</span>
                <h3 class="platform-name">${platform}</h3>
            </div>
            <div class="platform-stats">
                <div class="platform-stat">
                    <strong>${items.length}</strong><br>Items
                </div>
                <div class="platform-stat">
                    <strong>${totalVotes}</strong><br>Votes
                </div>
                <div class="platform-stat">
                    <strong>${totalViews}</strong><br>Views
                </div>
                <div class="platform-stat">
                    <strong>${avgQuality.toFixed(1)}</strong><br>Quality
                </div>
            </div>
            <div class="platform-content-preview">
                ${items.slice(0, 3).map(item => `
                    <div class="content-preview-item">
                        <a href="${item.url}" target="_blank">${item.title}</a>
                    </div>
                `).join('')}
                ${items.length > 3 ? `
                    <div class="content-preview-item">
                        <em>...and ${items.length - 3} more</em>
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }
    
    // Sidebar management
    function setupSidebar() {
        updateConnectionStatus();
        updateSidebarPlatforms();
        updateRecentActivity();
        updateQualityMetrics();
    }
      function updateSidebarPlatforms() {
        if (!sidebarPlatforms) return;
        
        sidebarPlatforms.innerHTML = '';
        
        const platformCounts = {};
        allContent.forEach(item => {
            const platform = item.metadata?.platform || item.platform || 'unknown';
            platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        Object.entries(platformCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8)
            .forEach(([platform, count]) => {
                const item = document.createElement('div');
                item.className = 'platform-item';
                item.innerHTML = `
                    <div class="platform-name">
                        <span>${getPlatformIcon(platform)}</span>
                        <span>${platform}</span>
                    </div>
                    <span class="platform-count">${count}</span>
                `;
                sidebarPlatforms.appendChild(item);
            });
    }
    
    function updateConnectionStatus() {
        const statusDot = document.getElementById('connectionStatus');
        const statusText = document.getElementById('connectionText');
        
        if (statusDot && statusText) {
            statusDot.className = 'status-dot';
            statusText.textContent = 'Connected';
        }
    }
    
    function updateRecentActivity() {
        if (!recentActivity) return;
        
        const recent = allContent
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5);
        
        recentActivity.innerHTML = recent.map(item => `
            <div class="activity-item">
                <div>New ${item.contentType || 'content'} on ${item.platform}</div>
                <div class="activity-time">${formatTimeAgo(item.createdAt)}</div>
            </div>
        `).join('');
    }
    
    function updateQualityMetrics() {
        const avgQuality = allContent.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / allContent.length;
        const highQualityCount = allContent.filter(item => (item.qualityScore || 0) >= 6).length;
        const highQualityPercent = (highQualityCount / allContent.length * 100).toFixed(1);
        const platformCount = new Set(allContent.map(item => item.platform)).size;
        
        document.getElementById('avgQuality').textContent = avgQuality.toFixed(1);
        document.getElementById('highQualityPercent').textContent = `${highQualityPercent}%`;
        document.getElementById('platformCount').textContent = platformCount;
    }
      function updateFilteredCount() {
        const filteredCountEl = document.getElementById('filteredCount');
        if (filteredCountEl) {
            filteredCountEl.textContent = filteredContent.length;
        }
    }
    
    function updateLiveCount() {
        const liveCountEl = document.getElementById('liveCount');
        if (liveCountEl) {
            liveCountEl.textContent = allContent.length;
        }
    }
    
    function updatePlatformStats() {
        const platformCountEl = document.getElementById('platformCount');
        if (platformCountEl && platforms.length > 0) {
            platformCountEl.textContent = platforms.length;
        }
    }
    
    function showError(message) {
        const container = feedContainer || document.getElementById('feedContainer');
        if (container) {
            container.innerHTML = `
                <div class="no-content" style="color: var(--color-primary-yellow);">
                    <h3>${message}</h3>
                    <p>Please try refreshing the page or <a href="/submit" style="color: var(--color-primary-cyan);">submit some content</a>.</p>
                </div>
            `;
        }
    }
    
    function updateActiveFiltersCount() {
        const activeFilters = Object.values(filters).filter(value => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return value;
            return value !== '' && value !== 'newest'; // 'newest' is default sort
        }).length;
        
        document.getElementById('activeFilters').textContent = activeFilters;
    }
    
    // Real-time updates
    function setupRealTimeUpdates() {
        socket.on('newContent', (data) => {
            console.log('New content received:', data);
            allContent.unshift(data);
            updatePlatformFilters();
            updateSidebarPlatforms();
            updateQualityMetrics();
            applyFilters();
            
            // Show notification
            showNotification(`New ${data.contentType || 'content'} added from ${data.platform}!`);
        });
        
        socket.on('contentUpdated', (data) => {
            const index = allContent.findIndex(item => item.id === data.id);
            if (index !== -1) {
                allContent[index] = data;
                applyFilters();
            }
        });
    }
    
    // Utility functions
    function resetFilters() {
        filters = {
            sort: 'newest',
            type: '',
            category: '',
            search: '',
            platforms: [],
            highQuality: false,
            newContent: false,
            trending: false
        };
        
        // Reset form controls
        document.getElementById('sortFilter').value = 'newest';
        document.getElementById('typeFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('searchFilter').value = '';
        document.getElementById('highQualityOnly').checked = false;
        document.getElementById('newContentOnly').checked = false;
        document.getElementById('trendingOnly').checked = false;
        
        // Reset platform filters
        document.querySelectorAll('.platform-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        applyFilters();
    }
    
    function refreshFeed() {
        loadInitialContent();
        loadPlatformData();
        showNotification('Feed refreshed!');
    }
    
    function exportFilteredContent() {
        const exportData = {
            filters: filters,
            content: filteredContent,
            timestamp: new Date().toISOString(),
            total: filteredContent.length
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bambi-sleep-church-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`Exported ${filteredContent.length} items!`);
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-primary-cyan);
            color: var(--color-bg-primary);
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    function getPlatformIcon(platform) {
        const icons = {
            'youtube': '📺',
            'soundcloud': '🎵',
            'vimeo': '🎬',
            'patreon': '💰',
            'bambicloud': '🌙',
            'hypnotube': '💫',
            'twitter': '🐦',
            'spotify': '🎶',
            'bandcamp': '🎼',
            'generic': '🌐',
            'direct': '📁',
            'pornhub': '🔞',
            'xvideos': '🔞',
            'xhamster': '🔞'
        };
        return icons[platform] || '🔗';
    }
    
    function getQualityClass(score) {
        if (score >= 8) return 'excellent';
        if (score >= 6) return 'good';
        if (score >= 4) return 'fair';
        return 'poor';
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    function formatTimeAgo(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    }
});
