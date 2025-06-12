// This file contains the main JavaScript logic for the client-side application.

// Enhanced polyfill for crypto.randomUUID if not available
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
    // Create crypto object if it doesn't exist
    if (typeof crypto === 'undefined') {
        window.crypto = {};
    }
    
    crypto.randomUUID = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const linksContainer = document.getElementById('links-container');
    const creatorsContainer = document.getElementById('creators-list');
    const socket = io();

    // Function to render creators sorted by votes
    const renderCreators = (creators) => {
        if (!creatorsContainer) return;
        
        // Clear current creators (keep the structure but update content)
        const navItems = creatorsContainer.querySelectorAll('.nav-item');
        navItems.forEach(item => item.remove());
        
        creators.forEach(creator => {
            const listItem = document.createElement('li');
            listItem.className = 'nav-item';
            listItem.setAttribute('data-creator-id', creator.id);
            
            const isExternal = creator.url.startsWith('http');
            listItem.innerHTML = `
                <a href="${creator.url}" ${isExternal ? 'target="_blank"' : ''} class="nav-link">
                    ${creator.name}
                    <span class="creator-score">(${creator.votes})</span>
                </a>
                <button class="creator-vote-btn" onclick="voteForCreator(${creator.id})" title="Vote for this creator">👍</button>
            `;
            creatorsContainer.appendChild(listItem);
        });
    };

    // Function to render links
    const renderLinks = (links) => {
        if (!linksContainer) return;
        
        linksContainer.innerHTML = '';
        links.forEach(link => {
            const linkCard = document.createElement('div');
            linkCard.className = 'link-card';
            linkCard.innerHTML = `
                <h3>${link.title}</h3>
                <div class="link-row">
                    <span class="link-arrow">|></span>
                    <a href="${link.url}" target="_blank" class="link-url">Visit Link</a>
                </div>
                <div class="link-meta">
                    <span class="category-tag">${link.category}</span>
                    <span class="vote-count">👍 ${link.votes}</span>
                    <span class="view-count">👁 ${link.views || 0}</span>
                    <span class="date-added">📅 ${link.createdAt ? new Date(link.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <button class="vote-button" data-link-id="${link.id}">Vote for this link</button>
            `;
            linksContainer.appendChild(linkCard);
        });
    };

    // Fetch and render creators
    fetch('/api/creators')
        .then(response => response.json())
        .then(data => {
            if (creatorsContainer) {
                renderCreators(data);
            }
        })
        .catch(error => {
            console.error('Error fetching creators:', error);
        });

    // Fetch initial links
    fetch('/api/links')
        .then(response => response.json())
        .then(data => renderLinks(data))
        .catch(error => {
            console.error('Error fetching links:', error);
            // Show sample data if API fails
            const sampleLinks = [
                { 
                    id: 1, 
                    title: 'Bambi Sleep - Innocence Training Series', 
                    url: 'https://example.com/innocence-training', 
                    category: 'Training', 
                    votes: 42 
                },
                { 
                    id: 2, 
                    title: 'Bambi Mindset Guide - Complete Transformation', 
                    url: 'https://example.com/mindset-guide', 
                    category: 'Guides', 
                    votes: 37 
                },
                { 
                    id: 3, 
                    title: 'Bambi Uniform Shopping Guide', 
                    url: 'https://example.com/uniform-guide', 
                    category: 'Fashion', 
                    votes: 28 
                }
            ];
            renderLinks(sampleLinks);
        });

    // Listen for real-time updates
    socket.on('updateLinks', (links) => {
        renderLinks(links);
    });

    socket.on('updateCreators', (creators) => {
        renderCreators(creators);
    });

    // Vote function for links
    window.vote = (linkId) => {
        fetch(`/api/vote/${linkId}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    socket.emit('voteCast', linkId);
                }
            })
            .catch(error => {
                console.error('Error voting:', error);
            });
    };

    // Vote function for creators
    window.voteForCreator = (creatorId) => {
        fetch(`/api/creators/${creatorId}/vote`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update the creator's vote count in real-time
                    const creatorElement = document.querySelector(`[data-creator-id="${creatorId}"] .creator-score`);
                    if (creatorElement) {
                        creatorElement.textContent = `(${data.creator.votes})`;
                    }
                    
                    // Fetch updated creators list to re-sort
                    fetch('/api/creators')
                        .then(response => response.json())
                        .then(creators => renderCreators(creators))
                        .catch(error => console.error('Error refreshing creators:', error));
                        
                    socket.emit('creatorVoteCast', creatorId);
                }
            })
            .catch(error => {
                console.error('Error voting for creator:', error);
            });
    };

    // Load quick stats for home page
    async function loadQuickStats() {
        try {
            const response = await fetch('/api/stats');
            if (response.ok) {
                const stats = await response.json();
                const totalLinksEl = document.getElementById('quick-total-links');
                const totalVotesEl = document.getElementById('quick-total-votes');
                const totalViewsEl = document.getElementById('quick-total-views');
                
                if (totalLinksEl) totalLinksEl.textContent = stats.totalLinks;
                if (totalVotesEl) totalVotesEl.textContent = stats.totalVotes;
                if (totalViewsEl) totalViewsEl.textContent = stats.totalViews;
            }
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    // Load stats on page load
    loadQuickStats();
});