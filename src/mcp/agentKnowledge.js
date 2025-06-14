// Intelligent Knowledge Base Agent - Content Curation & Validation

import * as knowledgeTools from './tools/knowledgeTools.js';
import * as lmstudio from '../lmstudio/client.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../knowledge/knowledge.json');

// BambiSleep relevance keywords (weighted)
const RELEVANCE_KEYWORDS = {
  high: ['bambisleep', 'bambi sleep', 'hypnosis', 'trance', 'feminization', 'sissy'],
  medium: ['audio', 'meditation', 'mindfulness', 'transformation', 'conditioning'],
  low: ['fantasy', 'roleplay', 'community', 'discord', 'reddit']
};

// Content categories
const CATEGORIES = {
  official: ['bambisleep.info', 'official'],
  audio: ['soundcloud', 'youtube', 'audio', 'mp3', 'wav'],
  guides: ['guide', 'tutorial', 'howto', 'instruction'],
  community: ['reddit', 'discord', 'forum', 'discussion'],
  tools: ['github', 'app', 'tool', 'script', 'software']
};

function loadDB() {
  if (!fs.existsSync(dbPath)) return [];
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Calculate relevance score (0-10)
function calculateRelevance(title, description, url) {
  let score = 0;
  const text = `${title} ${description} ${url}`.toLowerCase();
  
  // High relevance keywords
  RELEVANCE_KEYWORDS.high.forEach(keyword => {
    if (text.includes(keyword)) score += 3;
  });
  
  // Medium relevance keywords  
  RELEVANCE_KEYWORDS.medium.forEach(keyword => {
    if (text.includes(keyword)) score += 2;
  });
  
  // Low relevance keywords
  RELEVANCE_KEYWORDS.low.forEach(keyword => {
    if (text.includes(keyword)) score += 1;
  });
  
  return Math.min(score, 10);
}

// Determine content category
function categorizeContent(title, description, url) {
  const text = `${title} ${description} ${url}`.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

// Check for duplicates
function isDuplicate(url, title) {
  const db = loadDB();
  return db.some(item => 
    item.url === url || 
    (item.title && title && item.title.toLowerCase() === title.toLowerCase())
  );
}

// Validate URL accessibility
async function validateURL(url) {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return { valid: true, status: response.status, contentType: response.headers['content-type'] };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Extract metadata from webpage
async function extractMetadata(url) {
  try {
    const response = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text().trim() || 
                 url;
    
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim().slice(0, 200) || '';
    
    return { title, description, contentType: response.headers['content-type'] };
  } catch (error) {
    return { title: url, description: '', error: error.message };
  }
}

// Main intelligent crawl and analyze function
export async function crawlAndAnalyze(url) {
  try {
    // Step 1: URL Validation
    const validation = await validateURL(url);
    if (!validation.valid) {
      return { url, error: true, message: `URL validation failed: ${validation.error}` };
    }

    // Step 2: Extract metadata
    const metadata = await extractMetadata(url);
    if (metadata.error) {
      return { url, error: true, message: `Metadata extraction failed: ${metadata.error}` };
    }

    // Step 3: Check for duplicates
    if (isDuplicate(url, metadata.title)) {
      return { url, error: true, message: 'Duplicate content detected' };
    }

    // Step 4: Calculate relevance
    const relevance = calculateRelevance(metadata.title, metadata.description, url);
    if (relevance < 3) {
      return { url, error: true, message: `Low relevance score: ${relevance}/10` };
    }

    // Step 5: Categorize content
    const category = categorizeContent(metadata.title, metadata.description, url);

    // Step 6: Create enriched entry
    const entry = {
      id: 'kb_' + Date.now(),
      url,
      title: metadata.title,
      description: metadata.description,
      category,
      relevance,
      contentType: validation.contentType,
      addedAt: new Date().toISOString(),
      validated: true
    };

    // Step 7: Save to knowledge base
    const db = loadDB();
    db.push(entry);
    saveDB(db);

    return { success: true, entry };

  } catch (error) {
    return { url, error: true, message: error.message };
  }
}

// Batch analyze multiple URLs
export async function batchAnalyze(urls) {
  const results = [];
  for (const url of urls) {
    const result = await crawlAndAnalyze(url);
    results.push(result);
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return results;
}

// Get content quality metrics
export function getQualityMetrics() {
  const db = loadDB();
  const total = db.length;
  const validated = db.filter(item => item.validated).length;
  const highRelevance = db.filter(item => item.relevance >= 7).length;
  const categories = {};
  
  db.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1;
  });

  return {
    total,
    validated,
    validationRate: total > 0 ? (validated / total * 100).toFixed(1) + '%' : '0%',
    highQuality: highRelevance,
    qualityRate: total > 0 ? (highRelevance / total * 100).toFixed(1) + '%' : '0%',
    categories
  };
}
