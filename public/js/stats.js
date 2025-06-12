// Stats page functionality with BambiSleep Stats Agent integration
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    setupInsightTabs();
    setupAgentIntegration();
});

async function loadStats() {
    try {
        // Wait for BambiSleep Stats Agent to initialize
        if (window.bambiSleepStatsAgent && window.bambiSleepStatsAgent.initialized) {
            const stats = await window.bambiSleepStatsAgent.getStats();
            displayStats(stats);
        } else {
            // Fallback to traditional API
            const response = await fetch('/api/stats');
            if (!response.ok) {
                throw new Error('Failed to load stats');
            }
            
            const stats = await response.json();
            displayStats(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        displayError();
    }
}

function setupAgentIntegration() {
    // Monitor agent initialization
    const checkAgent = setInterval(() => {
        if (window.bambiSleepStatsAgent && window.bambiSleepStatsAgent.initialized) {
            clearInterval(checkAgent);
            
            // Update stats display with agent data
            loadStats();
            
            // Setup real-time updates
            setInterval(async () => {
                const stats = await window.bambiSleepStatsAgent.getStats();
                updateRealTimeElements(stats);
            }, 10000); // Update every 10 seconds
            
            // Update agent status indicators
            updateAgentStatusDisplay();
        }
    }, 1000);
}

function updateAgentStatusDisplay() {
    const indicator = document.getElementById('statsAgentIndicator');
    const status = document.getElementById('statsAgentStatus');
    
    if (indicator && status) {
        indicator.style.background = '#4CAF50';
        indicator.style.boxShadow = '0 0 20px #4CAF50';
        status.textContent = 'ACTIVE';
        status.style.background = 'rgba(76, 175, 80, 0.2)';
        status.style.color = '#4CAF50';
        status.style.border = '1px solid #4CAF50';
    }
}

function updateRealTimeElements(stats) {
    // Update agent status panel
    if (stats.realTime) {
        updateElement('activeUsers', stats.realTime.activeUsers);
        updateElement('contentValidated', stats.realTime.contentValidated);
        updateElement('a2aMessages', stats.realTime.recentActivity?.length || 0);
    }
    
    // Update knowledge base items
    updateElement('knowledgeBaseItems', stats.totalContent);
}

function displayStats(stats) {
    // Display overall stats with enhanced BambiSleep metrics
    updateElement('total-links', stats.totalContent || stats.totalLinks);
    updateElement('total-votes', stats.totalVotes);
    updateElement('total-views', stats.totalViews);
    updateElement('avg-quality', stats.avgQualityScore ? Math.round(stats.avgQualityScore * 100) + '%' : 'N/A');
    updateElement('total-creators', stats.totalCreators || 'N/A');
    
    // Display content type analysis
    displayContentTypes(stats);
    
    // Display top content with enhanced insights
    displayTopContent(stats);
}

function displayContentTypes(stats) {
    const categoryContainer = document.getElementById('category-stats');
    if (!categoryContainer) return;
    
    const contentTypes = stats.contentByType || stats.categories;
    
    if (contentTypes) {
        if (Array.isArray(contentTypes)) {
            // Legacy format
            categoryContainer.innerHTML = contentTypes.map(cat => `
                <div class="category-stat-row">
                    <div class="category-name">${cat.category}</div>
                    <div class="category-details">
                        <span class="stat-detail">📝 ${cat.count} links</span>
                        <span class="stat-detail">👍 ${cat.votes} votes</span>
                        <span class="stat-detail">👁 ${cat.views} views</span>
                    </div>
                </div>
            `).join('');
        } else {
            // New agent format
            categoryContainer.innerHTML = Object.entries(contentTypes).map(([type, count]) => `
                <div class="category-stat-row">
                    <div class="category-name">${formatContentType(type)}</div>
                    <div class="category-details">
                        <span class="stat-detail">📝 ${count} items</span>
                        <span class="stat-detail">🔥 ${getTypeEmoji(type)}</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

function displayTopContent(stats) {
    const topLinksContainer = document.getElementById('top-links');
    if (!topLinksContainer) return;
    
    const topLinks = stats.topLinks || [];
    
    topLinksContainer.innerHTML = topLinks.slice(0, 10).map((link, index) => `
        <div class="top-link-row">
            <span class="rank">#${index + 1}</span>
            <div class="link-info">
                <div class="link-title">${link.title || `Content ${link.id}`}</div>
                <div class="link-stats">
                    <span class="link-category">${link.category || link.contentType || 'Unknown'}</span>
                    <span class="link-votes">👍 ${link.votes}</span>
                    <span class="link-views">👁 ${link.views || 0}</span>
                    ${link.engagement ? `<span class="link-engagement">⚡ ${Math.round(link.engagement)}</span>` : ''}
                    ${link.qualityScore ? `<span class="link-quality">⭐ ${Math.round(link.qualityScore * 100)}%</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function setupInsightTabs() {
    const tabs = document.querySelectorAll('.insight-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', async function() {
            // Update active tab
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.background = '#333';
            });
            
            this.classList.add('active');
            this.style.background = '#e91e63';
            
            // Get insight from agent
            const question = this.dataset.question;
            await displayInsight(question);
        });
    });
}

async function displayInsight(question) {
    const display = document.getElementById('insight-display');
    if (!display) return;
    
    display.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">Loading insight...</div>';
    
    try {
        if (window.bambiSleepStatsAgent && window.bambiSleepStatsAgent.initialized) {
            const insight = await window.bambiSleepStatsAgent.getInsight(question);
            
            if (insight) {
                display.innerHTML = formatInsight(question, insight);
            } else {
                display.innerHTML = `<div style="color: #666; text-align: center; padding: 20px;">Insight for "${question}" is being analyzed by the AI agent...</div>`;
            }
        } else {
            display.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">BambiSleep Stats Agent is initializing...</div>';
        }
    } catch (error) {
        console.error('Error displaying insight:', error);
        display.innerHTML = '<div style="color: #f44336; text-align: center; padding: 20px;">Error loading insight</div>';
    }
}

function formatInsight(question, insight) {
    const formatters = {
        who: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">👥 Who: BambiSleep Creators & Community</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${data.topCreators ? data.topCreators.slice(0, 6).map(creator => `
                    <div style="background: rgba(233, 30, 99, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #e91e63;">
                        <div style="font-weight: bold; color: #e91e63;">${creator.name || `Creator ${creator.id}`}</div>
                        <div style="font-size: 0.9em; color: #bbb;">${creator.contentCount || 0} contributions</div>
                        <div style="font-size: 0.9em; color: #bbb;">⭐ ${Math.round((creator.avgQuality || 0) * 100)}% quality</div>
                    </div>
                `).join('') : '<div style="color: #666;">Creator profiles being analyzed...</div>'}
            </div>
        `,
        
        what: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">📝 What: Content Analysis</h4>
            <div style="color: #ccc; line-height: 1.6;">
                ${data.summary || 'Content analysis in progress...'}
            </div>
            ${data.contentTypes ? `
                <div style="margin-top: 15px;">
                    <strong style="color: #e91e63;">Content Distribution:</strong>
                    <div style="margin-top: 10px;">
                        ${Object.entries(data.contentTypes).map(([type, count]) => `
                            <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                                <span>${formatContentType(type)}</span>
                                <span style="color: #e91e63;">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `,
        
        where: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">📍 Where: Platform Distribution</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                ${data.platforms ? Object.entries(data.platforms).map(([platform, count]) => `
                    <div style="background: rgba(233, 30, 99, 0.1); padding: 10px; border-radius: 8px; text-align: center;">
                        <div style="font-weight: bold; color: #e91e63;">${platform}</div>
                        <div style="color: #bbb;">${count} items</div>
                    </div>
                `).join('') : '<div style="color: #666;">Platform analysis in progress...</div>'}
            </div>
        `,
        
        when: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">⏰ When: Timeline Analysis</h4>
            <div style="color: #ccc; line-height: 1.6;">
                ${data.timelineInsights || 'Timeline analysis in progress...'}
            </div>
        `,
        
        why: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">❓ Why: Engagement Analysis</h4>
            <div style="color: #ccc; line-height: 1.6; margin-bottom: 15px;">
                ${data.engagementInsights || 'Engagement patterns being analyzed...'}
            </div>
            ${data.topEngagement ? `
                <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px;">
                    <strong style="color: #e91e63;">Top Engagement Drivers:</strong>
                    ${data.topEngagement.slice(0, 3).map(item => `
                        <div style="margin: 10px 0; padding: 8px; background: rgba(233, 30, 99, 0.1); border-radius: 4px;">
                            <div style="font-weight: bold;">${item.title || `Content ${item.id}`}</div>
                            <div style="font-size: 0.9em; color: #bbb;">⚡ ${Math.round(item.engagement)} engagement score</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `,
        
        how: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">⚙️ How: Process Analysis</h4>
            <div style="color: #ccc; line-height: 1.6;">
                ${data.processInsights || 'Process analysis in progress...'}
            </div>
        `,
        
        how_much: (data) => `
            <h4 style="color: #e91e63; margin-bottom: 15px;">📊 How Much: Quantitative Analysis</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                <div style="background: rgba(233, 30, 99, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #e91e63;">${data.totalVolume || 0}</div>
                    <div style="color: #bbb; font-size: 0.9em;">Total Volume</div>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #4CAF50;">${data.avgEngagement || 0}</div>
                    <div style="color: #bbb; font-size: 0.9em;">Avg Engagement</div>
                </div>
                <div style="background: rgba(255, 193, 7, 0.1); padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 1.5em; font-weight: bold; color: #FFC107;">${Math.round((data.qualityIndex || 0) * 100)}%</div>
                    <div style="color: #bbb; font-size: 0.9em;">Quality Index</div>
                </div>
            </div>
        `
    };
    
    const formatter = formatters[question];
    return formatter ? formatter(insight) : `
        <h4 style="color: #e91e63; margin-bottom: 15px;">🧠 ${question.toUpperCase()}</h4>
        <div style="color: #ccc; line-height: 1.6;">
            ${typeof insight === 'object' ? JSON.stringify(insight, null, 2) : insight}
        </div>
    `;
}

function formatContentType(type) {
    const typeMap = {
        'audio': '🎵 Audio Files',
        'video': '🎬 Video Content',
        'script': '📝 Scripts',
        'image': '🖼️ Images',
        'subliminal': '🌀 Subliminals',
        'hypno': '💫 Hypnosis',
        'other': '📂 Other'
    };
    return typeMap[type] || type;
}

function getTypeEmoji(type) {
    const emojiMap = {
        'audio': '🎵',
        'video': '🎬',
        'script': '📝',
        'image': '🖼️',
        'subliminal': '🌀',
        'hypno': '💫'
    };
    return emojiMap[type] || '📂';
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value !== undefined ? value : '-';
    }
}

function displayError() {
    updateElement('total-links', 'Error loading stats');
    updateElement('total-votes', '-');
    updateElement('total-views', '-');
    updateElement('avg-quality', '-');
    updateElement('total-creators', '-');
}
