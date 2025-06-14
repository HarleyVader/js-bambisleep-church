// Content processor for BambiSleep knowledge agent
// This module processes extracted content to identify relevant information

// BambiSleep relevance keywords (weighted)
const RELEVANCE_KEYWORDS = {
  high: ['bambisleep', 'bambi sleep', 'hypnosis', 'trance', 'feminization', 'sissy', 'trigger', 'uniform'],
  medium: ['audio', 'conditioning', 'mindfulness', 'transformation', 'suggestion', 'bambi'],
  low: ['fantasy', 'roleplay', 'community', 'discord', 'reddit', 'listen']
};

// Content categories for BambiSleep knowledge
const CATEGORIES = {
  overview: ['what is', 'introduction', 'overview', 'welcome', 'about'],
  beginners: ['beginner', 'start', 'new', 'first time', 'basic', 'getting started'],
  sessions: ['session', 'file', 'audio', 'listen', 'mp3', 'sound'],
  safety: ['safe', 'safety', 'consent', 'warning', 'caution', 'risk'],
  community: ['community', 'discord', 'reddit', 'forum', 'group'],
  technical: ['how it works', 'technique', 'method', 'process'],
  audience: ['who', 'audience', 'target', 'user', 'for whom'],
  effects: ['effect', 'result', 'impact', 'outcome', 'experience']
};

/**
 * Calculate relevance score based on keyword matching
 * @param {string} text Text to analyze
 * @returns {number} Relevance score from 0-10
 */
function calculateRelevanceScore(text) {
  const lowerText = text.toLowerCase();
  let score = 0;
  
  // Check high relevance keywords (worth 2 points each)
  RELEVANCE_KEYWORDS.high.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 2;
    }
  });
  
  // Check medium relevance keywords (worth 1 point each)
  RELEVANCE_KEYWORDS.medium.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });
  
  // Check low relevance keywords (worth 0.5 points each)
  RELEVANCE_KEYWORDS.low.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      score += 0.5;
    }
  });
  
  // Normalize score to 0-10 range
  score = Math.min(Math.round(score), 10);
  
  return score;
}

/**
 * Determine content categories based on text analysis
 * @param {string} text Text to analyze
 * @returns {string[]} Array of matching categories
 */
function determineCategories(text) {
  const lowerText = text.toLowerCase();
  const matchedCategories = [];
  
  // Check for each category
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedCategories.push(category);
        break; // Break once we match a category
      }
    }
  }
  
  // Default to 'general' if no categories matched
  if (matchedCategories.length === 0) {
    matchedCategories.push('general');
  }
  
  return [...new Set(matchedCategories)]; // Remove duplicates
}

/**
 * Extract information to answer specific questions about BambiSleep
 * @param {string} text Content to analyze
 * @returns {object} Object with extracted information
 */
function extractInformation(text) {
  const lowerText = text.toLowerCase();
  const info = {
    whatIs: null,
    targetAudience: null,
    howItWorks: null,
    benefits: null,
    risks: null,
    requirements: null
  };
  
  // Simple extraction based on common phrases and patterns
  
  // What is BambiSleep?
  const whatIsPatterns = [
    /bambisleep is (.*?)\./i,
    /bambi sleep is (.*?)\./i,
    /what is bambisleep\?(.*?)\./i,
    /about bambisleep:(.*?)\./i
  ];
  
  for (const pattern of whatIsPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.whatIs = match[1].trim();
      break;
    }
  }
  
  // Target audience
  const audiencePatterns = [
    /target audience(.*?)\./i,
    /intended for(.*?)\./i,
    /designed for(.*?)\./i,
    /who (should|can) (use|listen)(.*?)\./i
  ];
  
  for (const pattern of audiencePatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.targetAudience = match[1].trim();
      break;
    }
  }
  
  // How it works
  const howItWorksPatterns = [
    /how (it|bambisleep) works(.*?)\./i,
    /works by(.*?)\./i,
    /process involves(.*?)\./i,
    /technique (uses|involves)(.*?)\./i
  ];
  
  for (const pattern of howItWorksPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.howItWorks = match[1].trim();
      break;
    }
  }
  
  // Benefits
  const benefitsPatterns = [
    /benefits (include|are)(.*?)\./i,
    /advantages (include|are)(.*?)\./i,
    /reasons to (use|listen)(.*?)\./i,
    /why (use|listen)(.*?)\./i
  ];
  
  for (const pattern of benefitsPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.benefits = match[1].trim();
      break;
    }
  }
  
  // Risks
  const risksPatterns = [
    /risks (include|are)(.*?)\./i,
    /warnings(.*?)\./i,
    /cautions(.*?)\./i,
    /not recommended (for|if)(.*?)\./i
  ];
  
  for (const pattern of risksPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.risks = match[1].trim();
      break;
    }
  }
  
  // Requirements
  const requirementsPatterns = [
    /requirements (include|are)(.*?)\./i,
    /need (to have|to use)(.*?)\./i,
    /recommended (to have|to use)(.*?)\./i,
    /best (with|using)(.*?)\./i
  ];
  
  for (const pattern of requirementsPatterns) {
    const match = lowerText.match(pattern);
    if (match && match[1]) {
      info.requirements = match[1].trim();
      break;
    }
  }
  
  return info;
}

/**
 * Generate summary from content
 * @param {string} text Content to summarize
 * @returns {string} Summary text
 */
function generateSummary(text) {
  // Simple summary - first 250 characters
  return text.substring(0, 250).trim() + (text.length > 250 ? '...' : '');
}

/**
 * Process content for BambiSleep knowledge base
 * @param {object} contentData Content data from URL fetcher
 * @returns {object} Processed knowledge data
 */
export function processContent(contentData) {
  // Skip processing if there was an error fetching
  if (contentData.error) {
    return {
      ...contentData,
      processed: false,
      message: 'Failed to fetch content'
    };
  }
  
  const { url, title, content, description, fetchedAt } = contentData;
  
  // Calculate relevance score
  const relevanceScore = calculateRelevanceScore(content);
  
  // Skip if relevance is too low (less than 3)
  if (relevanceScore < 3) {
    return {
      url,
      title,
      relevance: relevanceScore,
      processed: false,
      message: 'Content not relevant to BambiSleep'
    };
  }
  
  // Determine categories
  const categories = determineCategories(content);
  
  // Extract BambiSleep-specific information
  const information = extractInformation(content);
  
  // Generate summary
  const summary = description || generateSummary(content);
  
  // Return processed data
  return {
    url,
    title,
    summary,
    content: content.substring(0, 10000), // Limit content size
    categories,
    relevance: relevanceScore,
    information,
    processedAt: new Date().toISOString(),
    fetchedAt,
    processed: true
  };
}

/**
 * Process multiple content items
 * @param {object[]} contentItems Array of content data from URL fetcher
 * @returns {object[]} Array of processed knowledge data
 */
export function processMultipleContents(contentItems) {
  return contentItems.map(item => processContent(item));
}

export default {
  processContent,
  processMultipleContents,
  calculateRelevanceScore,
  determineCategories
};
