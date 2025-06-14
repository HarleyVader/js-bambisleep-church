// BambiSleep Knowledge Q&A Client Script

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const questionInput = document.getElementById('knowledge-question');
  const askButton = document.getElementById('ask-button');
  const resultsContainer = document.querySelector('.results-container');
  const answerText = document.getElementById('answer-text');
  const answerSources = document.getElementById('answer-sources');
  const sourcesContent = document.getElementById('sources-content');
  const suggestedQuestions = document.getElementById('questions-list');
  const loadingIndicator = document.getElementById('loading-indicator');
  const errorMessage = document.getElementById('error-message');
  const commonQuestionButtons = document.querySelectorAll('.ask-common-question');
  const confidenceIndicator = document.getElementById('confidence-indicator');
  const answerCategories = document.getElementById('answer-categories');
  const answerDate = document.getElementById('answer-date');
  const lastUpdatedDate = document.getElementById('last-updated-date');
  const categoryBadges = document.querySelectorAll('.category-badge');
  const knowledgeInfoSection = document.getElementById('knowledge-info-section');
  const questionCards = document.querySelectorAll('.question-card');
  
  // Ask a question
  async function askQuestion(question) {
    // Reset UI
    answerText.textContent = '';
    sourcesContent.textContent = '';
    suggestedQuestions.innerHTML = '';
    errorMessage.style.display = 'none';
    resultsContainer.style.display = 'none';
    loadingIndicator.style.display = 'block';
    
    try {
      // Send question to server
      const response = await fetch('/api/bambisleep/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });
      
      const data = await response.json();
      
      // Hide loading indicator
      loadingIndicator.style.display = 'none';
      
      if (!data.success) {
        // Show error message
        errorMessage.textContent = data.error || 'Failed to get an answer. Please try again.';
        errorMessage.style.display = 'block';
        return;
      }
      
      // Display answer
      answerText.textContent = data.answer;
      
      // Display confidence level
      if (data.confidence) {
        let confidenceText = 'Medium Confidence';
        let confidenceClass = 'medium';
        
        if (data.confidence >= 0.8) {
          confidenceText = 'High Confidence';
          confidenceClass = 'high';
        } else if (data.confidence < 0.5) {
          confidenceText = 'Low Confidence';
          confidenceClass = 'low';
        }
        
        confidenceIndicator.textContent = confidenceText;
        confidenceIndicator.className = `confidence-badge ${confidenceClass}`;
      }
      
      // Display categories
      if (data.categories && data.categories.length > 0) {
        answerCategories.textContent = data.categories.join(', ');
      } else {
        answerCategories.textContent = 'General';
      }
      
      // Display last updated date
      if (data.lastUpdated) {
        answerDate.textContent = new Date(data.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      // Display sources if available
      if (data.citations && data.citations.trim()) {
        sourcesContent.innerHTML = data.citations.split('\n').map(line => `<p>${line}</p>`).join('');
        answerSources.style.display = 'block';
      } else {
        answerSources.style.display = 'none';
      }
      
      // Display suggested questions
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        suggestedQuestions.innerHTML = data.suggestedQuestions.map(q => 
          `<li><a href="#" class="suggested-question">${q}</a></li>`
        ).join('');
        
        // Add event listeners to suggested questions
        document.querySelectorAll('.suggested-question').forEach(link => {
          link.addEventListener('click', function(e) {
            e.preventDefault();
            const question = this.textContent;
            questionInput.value = question;
            askQuestion(question);
          });
        });
      }
      
      // Show additional info section
      knowledgeInfoSection.style.display = 'block';
      
      // Show results
      resultsContainer.style.display = 'block';
      
      // Scroll to results
      resultsContainer.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error asking question:', error);
      loadingIndicator.style.display = 'none';
      errorMessage.textContent = 'An error occurred while processing your question. Please try again later.';
      errorMessage.style.display = 'block';
    }
  }
  
  // Event listeners
  askButton.addEventListener('click', function() {
    const question = questionInput.value.trim();
    if (question) {
      askQuestion(question);
    }
  });
  
  questionInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const question = questionInput.value.trim();
      if (question) {
        askQuestion(question);
      }
    }
  });
  
  // Common questions
  commonQuestionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const card = this.closest('.question-card');
      const question = card.getAttribute('data-question');
      questionInput.value = question;
      askQuestion(question);
    });
  });
  
  // Category filtering
  categoryBadges.forEach(badge => {
    badge.addEventListener('click', function() {
      const category = this.textContent.toLowerCase();
      
      // Toggle active state
      if (this.classList.contains('active')) {
        this.classList.remove('active');
        // Show all question cards if no category is selected
        if (!document.querySelector('.category-badge.active')) {
          questionCards.forEach(card => {
            card.style.display = 'block';
          });
        }
      } else {
        // Remove active class from all badges
        categoryBadges.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked badge
        this.classList.add('active');
        
        // Filter question cards
        questionCards.forEach(card => {
          if (card.classList.contains(`category-${category}`) || 
              card.classList.contains(`category-${category.replace(' ', '-')}`)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });
      }
    });
  });
  
  // Feedback buttons
  document.getElementById('feedback-helpful').addEventListener('click', function() {
    // Send positive feedback
    sendFeedback(true);
    this.textContent = '✓ Thank you!';
    this.disabled = true;
    document.getElementById('feedback-not-helpful').disabled = true;
  });
  
  document.getElementById('feedback-not-helpful').addEventListener('click', function() {
    // Send negative feedback
    sendFeedback(false);
    this.textContent = '✓ Thank you for your feedback';
    this.disabled = true;
    document.getElementById('feedback-helpful').disabled = true;
  });
  
  function sendFeedback(isHelpful) {
    const question = questionInput.value.trim();
    
    fetch('/api/bambisleep/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: question,
        isHelpful: isHelpful
      })
    }).catch(error => {
      console.error('Error sending feedback:', error);
    });
  }
  
  // Initialize knowledge base if empty
  async function checkAndInitializeKnowledge() {
    try {
      // Check if knowledge base is empty
      const response = await fetch('/api/knowledge/list');
      const data = await response.json();
      
      if (!data || data.length === 0) {
        console.log('Knowledge base is empty, initializing...');
        
        // Show initialization message
        errorMessage.textContent = 'Initializing BambiSleep knowledge base. This may take a moment...';
        errorMessage.style.display = 'block';
        
        // Initialize knowledge base
        const initResponse = await fetch('/api/bambisleep/initialize', {
          method: 'POST'
        });
        
        const initData = await initResponse.json();
        
        if (initData.success) {
          console.log('Knowledge base initialized successfully');
          errorMessage.textContent = 'BambiSleep knowledge base initialized successfully! You can now ask questions.';
          setTimeout(() => {
            errorMessage.style.display = 'none';
          }, 3000);
        } else {
          console.error('Failed to initialize knowledge base:', initData.error);
          errorMessage.textContent = 'Failed to initialize knowledge base. Some features may not work properly.';
        }
      }
      
      // Update the last updated date
      const statsResponse = await fetch('/api/knowledge/stats');
      const statsData = await statsResponse.json();
      
      if (statsData && statsData.lastUpdated) {
        const formattedDate = new Date(statsData.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        if (lastUpdatedDate) {
          lastUpdatedDate.textContent = formattedDate;
        }
      }
    } catch (error) {
      console.error('Error checking knowledge base:', error);
    }
  }
  
  // Check and initialize knowledge base on page load
  checkAndInitializeKnowledge();
  
  // Script preview section functionality
  const viewAllScriptsBtn = document.querySelector('.view-all-scripts');
  const scriptItems = document.querySelectorAll('.text-script-item');
  
  if (viewAllScriptsBtn) {
    viewAllScriptsBtn.addEventListener('click', function() {
      window.location.href = '/knowledge?category=scripts';
    });
  }
  
  scriptItems.forEach(item => {
    item.addEventListener('click', function() {
      const title = this.querySelector('.script-title').textContent;
      const preview = this.querySelector('.script-preview').textContent;
      
      // Create a modal to display the full script content
      const modal = document.createElement('div');
      modal.classList.add('script-modal');
      
      const modalContent = document.createElement('div');
      modalContent.classList.add('script-modal-content');
      
      const closeBtn = document.createElement('button');
      closeBtn.classList.add('script-modal-close');
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => modal.remove());
      
      const modalTitle = document.createElement('h3');
      modalTitle.textContent = title;
      modalTitle.classList.add('script-modal-title');
      
      const modalBody = document.createElement('div');
      modalBody.classList.add('script-modal-body');
      
      // Replace this with actual script content fetching if available
      const scriptContent = preview.length > 100 
        ? preview 
        : preview + "\n\n[Full script content would be displayed here. This is a preview.]";
      
      modalBody.textContent = scriptContent;
      
      const modalFooter = document.createElement('div');
      modalFooter.classList.add('script-modal-footer');
      
      const askButton = document.createElement('button');
      askButton.textContent = 'Ask about this script';
      askButton.classList.add('script-ask-btn');
      askButton.addEventListener('click', () => {
        const question = `Tell me about the "${title}" script`;
        document.getElementById('knowledge-question').value = question;
        document.getElementById('ask-button').click();
        modal.remove();
      });
      
      modalFooter.appendChild(askButton);
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(modalTitle);
      modalContent.appendChild(modalBody);
      modalContent.appendChild(modalFooter);
      modal.appendChild(modalContent);
      
      document.body.appendChild(modal);    });
  });
});

// CSS for the script modal
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .script-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .script-modal-content {
      background: var(--color-bg-dark);
      border: 1px solid var(--color-accent-magenta);
      border-radius: var(--radius-md);
      max-width: 80%;
      max-height: 80%;
      overflow-y: auto;
      padding: var(--spacing-lg);
      position: relative;
      box-shadow: 0 0 20px rgba(218, 112, 214, 0.4);
    }
    
    .script-modal-close {
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 24px;
      background: none;
      border: none;
      color: var(--color-text-secondary);
      cursor: pointer;
    }
    
    .script-modal-title {
      color: var(--color-accent-green);
      margin-bottom: var(--spacing-md);
      padding-right: 30px;
    }
    
    .script-modal-body {
      color: var(--color-text-primary);
      line-height: 1.6;
      margin-bottom: var(--spacing-md);
      white-space: pre-wrap;
    }
    
    .script-modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-md);
    }
    
    .script-ask-btn {
      background: var(--color-accent-cyan);
      color: var(--color-bg-dark);
      border: none;
      border-radius: var(--radius-sm);
      padding: 8px 16px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .script-ask-btn:hover {
      background: var(--color-accent-magenta);
      box-shadow: 0 0 10px rgba(218, 112, 214, 0.4);
    }
  </style>
`);
