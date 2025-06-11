const socket = io(); // Initialize socket.io

// Function to cast a vote for a link
function castVote(linkId) {
    socket.emit('castVote', { linkId });
}

// Function to update the votes display
function updateVotes(linkId, votes) {
    const voteCountElement = document.getElementById(`vote-count-${linkId}`);
    if (voteCountElement) {
        voteCountElement.textContent = votes;
    }
}

// Listen for vote updates from the server
socket.on('voteUpdated', (data) => {
    const { linkId, votes } = data;
    updateVotes(linkId, votes);
});

// Event listeners for vote buttons
document.querySelectorAll('.vote-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const linkId = event.target.dataset.linkId;
        castVote(linkId);
    });
});

// Function to track a link view
async function trackView(linkId) {
    try {
        const response = await fetch(`/api/links/${linkId}/view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            updateViewCount(linkId, data.views);
        }
    } catch (error) {
        console.error('Error tracking view:', error);
    }
}

// Function to update the view count display
function updateViewCount(linkId, views) {
    const viewCountElement = document.querySelector(`[data-link-id="${linkId}"]`)
        ?.closest('.link-card')
        ?.querySelector('.view-count');
    
    if (viewCountElement) {
        viewCountElement.textContent = `👁 ${views}`;
    }
}

// Event listeners for link clicks to track views
document.querySelectorAll('.link-url').forEach(link => {
    link.addEventListener('click', (event) => {
        const linkCard = event.target.closest('.link-card');
        const voteButton = linkCard?.querySelector('.vote-button');
        const linkId = voteButton?.dataset.linkId;
        
        if (linkId) {
            trackView(linkId);
        }
    });
});

// Also track views for card links in main page
document.querySelectorAll('.card a').forEach(link => {
    link.addEventListener('click', (event) => {
        // For external links, we can track them differently if needed
        // This is more for internal links or if we want to track external link clicks
        console.log('External link clicked:', event.target.href);
    });
});