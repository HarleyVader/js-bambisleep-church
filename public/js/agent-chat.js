// Agent Chat Client - Socket.io + UI Logic
(function () {
    const socket = io();
    let isTyping = false;

    // DOM elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');

    // Initialize
    function init() {
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        clearButton.addEventListener('click', clearChat);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Socket events
        socket.on('connect', () => {
            console.log('✅ Connected to agent');
            addSystemMessage('Connected to agent. Type a message to start!');
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from agent');
            addSystemMessage('Disconnected from agent. Refresh to reconnect.');
        });

        socket.on('agent:typing', (data) => {
            handleTypingIndicator(data.isTyping);
        });

        socket.on('agent:response', (data) => {
            addAgentMessage(data.message, data.tool);
        });

        socket.on('agent:error', (data) => {
            addErrorMessage(data.error);
        });

        // Add welcome message
        addSystemMessage('🤖 Welcome to SimpleWebAgent! Ask me about the knowledge base.');
        addSystemMessage('💡 Try: "search triggers", "show stats", or "help"');
    }

    // Send message
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message to UI
        addUserMessage(message);

        // Send to server
        socket.emit('agent:message', { message });

        // Clear input
        chatInput.value = '';
        chatInput.focus();
    }

    // Clear chat
    function clearChat() {
        chatMessages.innerHTML = '';
        addSystemMessage('Chat cleared. Start a new conversation!');
    }

    // Add user message to chat
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message user-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">👤</div>
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
                <div class="message-time">${getTimestamp()}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add agent message to chat
    function addAgentMessage(text, tool) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message agent-message';

        // Format text with markdown-style formatting
        const formattedText = formatAgentText(text);

        let toolBadge = '';
        if (tool && tool !== 'help') {
            toolBadge = `<span class="tool-badge">🛠️ ${tool}</span>`;
        }

        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                ${toolBadge}
                <div class="message-text">${formattedText}</div>
                <div class="message-time">${getTimestamp()}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add system message
    function addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message system-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Add error message
    function addErrorMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message error-message';
        messageDiv.innerHTML = `
            <div class="message-avatar">⚠️</div>
            <div class="message-content">
                <div class="message-text">${escapeHtml(text)}</div>
                <div class="message-time">${getTimestamp()}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Handle typing indicator
    function handleTypingIndicator(typing) {
        isTyping = typing;

        // Remove existing typing indicator
        const existing = document.querySelector('.typing-indicator');
        if (existing) {
            existing.remove();
        }

        if (typing) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message agent-message typing-indicator';
            typingDiv.innerHTML = `
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <div class="message-text">
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                        <span class="dot">.</span>
                    </div>
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            scrollToBottom();
        }
    }

    // Format agent text with basic markdown
    function formatAgentText(text) {
        let formatted = escapeHtml(text);

        // Bold text: **text**
        formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Links: keep as-is but make clickable
        formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

        // Line breaks
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Get timestamp
    function getTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Scroll to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
