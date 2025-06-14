// Knowledge indexing system for BambiSleep knowledge agent
// This module provides indexing and searching capabilities for the knowledge base

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../knowledge/knowledge.json');

// In-memory index storage
let keywordIndex = {};
let categoryIndex = {};
let knowledgeItems = [];
let indexTimestamp = 0;

// Constants
const INDEX_TTL = 5 * 60 * 1000; // 5 minutes
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
  'at', 'from', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'in', 'on',
  'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
  'now', 'this', 'that', 'these', 'those', 'of', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing'
]);

/**
 * Load knowledge data from database
 * @returns {Array} Knowledge items
 */
function loadKnowledgeData() {
  if (!fs.existsSync(dbPath)) {
    return [];
  }
  
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (error) {
    console.error('[Knowledge Index] Error loading knowledge data:', error);
    return [];
  }
}

/**
 * Tokenize text into words, filtering out stopwords
 * @param {string} text Text to tokenize
 * @returns {string[]} Array of words
 */
function tokenize(text) {
  if (!text) return [];
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 2) // Filter out very short words
    .filter(word => !STOPWORDS.has(word)); // Filter out stopwords
}

/**
 * Build index from knowledge data
 */
function buildIndex() {
  const now = Date.now();
  
  // Return if index is still valid
  if (now - indexTimestamp < INDEX_TTL && Object.keys(keywordIndex).length > 0) {
    return;
  }
  
  console.log('[Knowledge Index] Building knowledge index...');
  
  // Reset indexes
  keywordIndex = {};
  categoryIndex = {};
  
  // Load data
  knowledgeItems = loadKnowledgeData();
  
  // Index each item
  knowledgeItems.forEach((item, idx) => {
    // Skip items that weren't processed successfully
    if (!item.processed) return;
    
    // Index by categories
    if (item.categories && Array.isArray(item.categories)) {
      item.categories.forEach(category => {
        if (!categoryIndex[category]) {
          categoryIndex[category] = [];
        }
        categoryIndex[category].push(idx);
      });
    }
    
    // Index by keywords from title and content
    const titleTokens = tokenize(item.title);
    const contentTokens = tokenize(item.content);
    const summaryTokens = tokenize(item.summary);
    
    // Combine all tokens with deduplication
    const allTokens = [...new Set([...titleTokens, ...summaryTokens, ...contentTokens])];
    
    allTokens.forEach(token => {
      if (!keywordIndex[token]) {
        keywordIndex[token] = [];
      }
      keywordIndex[token].push(idx);
    });
  });
  
  indexTimestamp = now;
  console.log(`[Knowledge Index] Indexed ${knowledgeItems.length} items with ${Object.keys(keywordIndex).length} keywords`);
}

/**
 * Search knowledge base by keywords
 * @param {string} query Search query
 * @param {number} limit Maximum number of results (default: 5)
 * @returns {Array} Search results
 */
export function searchByKeywords(query, limit = 5) {
  // Build/refresh index
  buildIndex();
  
  if (!query || knowledgeItems.length === 0) {
    return [];
  }
  
  const queryTokens = tokenize(query);
  const resultScores = {};
  
  // Score each document based on matching keywords
  queryTokens.forEach(token => {
    if (keywordIndex[token]) {
      keywordIndex[token].forEach(idx => {
        if (!resultScores[idx]) {
          resultScores[idx] = 0;
        }
        resultScores[idx] += 1;
      });
    }
  });
  
  // Convert scores to array and sort
  const results = Object.entries(resultScores)
    .map(([idx, score]) => ({
      item: knowledgeItems[parseInt(idx)],
      score,
      // Calculate match percentage based on number of matching tokens
      matchPercentage: Math.round((score / queryTokens.length) * 100)
    }))
    .filter(result => result.matchPercentage > 20) // Only include results with at least 20% match
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit); // Limit number of results
  
  return results;
}

/**
 * Search knowledge base by category
 * @param {string} category Category to search for
 * @param {number} limit Maximum number of results (default: 5)
 * @returns {Array} Search results
 */
export function searchByCategory(category, limit = 5) {
  // Build/refresh index
  buildIndex();
  
  if (!category || knowledgeItems.length === 0) {
    return [];
  }
  
  const category_lower = category.toLowerCase();
  let matches = [];
  
  // Look for exact category match
  for (const [cat, indices] of Object.entries(categoryIndex)) {
    if (cat.toLowerCase() === category_lower) {
      matches = indices;
      break;
    }
  }
  
  // If no exact match, look for partial matches
  if (matches.length === 0) {
    for (const [cat, indices] of Object.entries(categoryIndex)) {
      if (cat.toLowerCase().includes(category_lower)) {
        matches = [...matches, ...indices];
      }
    }
  }
  
  // Remove duplicates
  matches = [...new Set(matches)];
  
  // Convert to results
  const results = matches
    .map(idx => ({
      item: knowledgeItems[idx],
      score: 1,
      matchPercentage: 100
    }))
    .slice(0, limit);
  
  return results;
}

/**
 * Get a specific knowledge item by ID
 * @param {string} id Item ID
 * @returns {object|null} Knowledge item or null if not found
 */
export function getKnowledgeItemById(id) {
  // Build/refresh index
  buildIndex();
  
  const item = knowledgeItems.find(item => item.id === id);
  return item || null;
}

/**
 * Get all available categories
 * @returns {string[]} Array of categories
 */
export function getAllCategories() {
  // Build/refresh index
  buildIndex();
  
  return Object.keys(categoryIndex);
}

/**
 * Search for information to answer a specific question
 * @param {string} question Question to answer
 * @returns {object} Answer information
 */
export function findAnswerInfo(question) {
  const questionLower = question.toLowerCase();
  let category = 'general';
  
  // Determine question category
  if (questionLower.includes('what is') || questionLower.includes('who is')) {
    category = 'overview';
  } else if (questionLower.includes('how does') || questionLower.includes('how it works')) {
    category = 'technical';
  } else if (questionLower.includes('audience') || questionLower.includes('who should')) {
    category = 'audience';
  } else if (questionLower.includes('where') || questionLower.includes('platform')) {
    category = 'community';
  } else if (questionLower.includes('why') || questionLower.includes('benefit')) {
    category = 'effects';
  } else if (questionLower.includes('how to') || questionLower.includes('what to do')) {
    category = 'beginners';
  } else if (questionLower.includes('not') || questionLower.includes('danger') || questionLower.includes('risk')) {
    category = 'safety';
  }
  
  // Try category search first
  let results = searchByCategory(category, 3);
  
  // Fall back to keyword search if no results
  if (results.length === 0) {
    results = searchByKeywords(question, 3);
  }
  
  // Prepare answer info
  const answerInfo = {
    question,
    sources: results.map(result => ({
      title: result.item.title,
      url: result.item.url,
      summary: result.item.summary,
      matchPercentage: result.matchPercentage
    })),
    information: {}
  };
  
  // Extract relevant information from results
  results.forEach(result => {
    if (result.item.information) {
      // Merge information from all sources
      Object.entries(result.item.information).forEach(([key, value]) => {
        if (value && !answerInfo.information[key]) {
          answerInfo.information[key] = value;
        }
      });
    }
  });
  
  return answerInfo;
}

// Export functions
export default {
  searchByKeywords,
  searchByCategory,
  getKnowledgeItemById,
  getAllCategories,
  findAnswerInfo,
  buildIndex
};
