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
});
