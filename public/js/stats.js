// Stats page functionality
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
});

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }
        
        const stats = await response.json();
        displayStats(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        displayError();
    }
}

function displayStats(stats) {
    // Display overall stats
    document.getElementById('total-links').textContent = stats.totalLinks;
    document.getElementById('total-votes').textContent = stats.totalVotes;
    document.getElementById('total-views').textContent = stats.totalViews;
    
    // Display category stats
    const categoryContainer = document.getElementById('category-stats');
    categoryContainer.innerHTML = stats.categories.map(cat => `
        <div class="category-stat-row">
            <div class="category-name">${cat.category}</div>
            <div class="category-details">
                <span class="stat-detail">📝 ${cat.count} links</span>
                <span class="stat-detail">👍 ${cat.votes} votes</span>
                <span class="stat-detail">👁 ${cat.views} views</span>
            </div>
        </div>
    `).join('');
    
    // Display top links
    const topLinksContainer = document.getElementById('top-links');
    topLinksContainer.innerHTML = stats.topLinks.map((link, index) => `
        <div class="top-link-row">
            <span class="rank">#${index + 1}</span>
            <div class="link-info">
                <div class="link-title">${link.title}</div>
                <div class="link-stats">
                    <span class="link-category">${link.category}</span>
                    <span class="link-votes">👍 ${link.votes}</span>
                    <span class="link-views">👁 ${link.views || 0}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function displayError() {
    document.getElementById('total-links').textContent = 'Error loading stats';
    document.getElementById('total-votes').textContent = '-';
    document.getElementById('total-views').textContent = '-';
}
