// URL fetcher for BambiSleep knowledgebase agent
// This tool fetches content from URLs and extracts the relevant text

import * as cheerio from 'cheerio';

import axios from 'axios';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pLimit from 'p-limit';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, '../../knowledge/cache');

// Create cache directory if it doesn't exist
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Configure rate limiting to avoid IP bans
const limit = pLimit(3); // Allow 3 concurrent requests
const DELAY_BETWEEN_REQUESTS = 500; // 500ms between requests

// Cache management
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached content if available and not expired
 * @param {string} url URL to check cache for
 * @returns {string|null} Cached content or null if not available
 */
function getCachedContent(url) {
  const hash = Buffer.from(url).toString('base64').replace(/[/=+]/g, '');
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  if (fs.existsSync(cachePath)) {
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const now = Date.now();
    
    if (now - cacheData.timestamp < CACHE_TTL) {
      return cacheData.content;
    }
  }
  
  return null;
}

/**
 * Cache content for a URL
 * @param {string} url URL to cache content for
 * @param {string} content Content to cache
 */
function cacheContent(url, content) {
  const hash = Buffer.from(url).toString('base64').replace(/[/=+]/g, '');
  const cachePath = path.join(CACHE_DIR, `${hash}.json`);
  
  const cacheData = {
    url,
    content,
    timestamp: Date.now()
  };
  
  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
}

/**
 * Extract main content from HTML
 * @param {string} html HTML content
 * @returns {string} Extracted text content
 */
function extractMainContent(html, url) {
  const $ = cheerio.load(html);
  
  // Remove script, style, and other non-content elements
  $('script, style, nav, footer, header, iframe, noscript').remove();
  
  // Special handling for different platforms
  if (url.includes('bambisleep.info')) {
    // Wiki-style content - main content is in the article or main tag
    const mainContent = $('article, main, #content, .content, #mw-content-text').first();
    if (mainContent.length) {
      return mainContent.text().trim();
    }
  } else if (url.includes('reddit.com')) {
    // Reddit content
    const posts = $('.thing, article');
    let content = '';
    
    posts.each((i, el) => {
      const title = $(el).find('h1, h2, h3, .title').first().text().trim();
      const body = $(el).find('.md, .usertext-body').first().text().trim();
      
      if (title || body) {
        content += `${title}\n${body}\n\n`;
      }
    });
    
    return content.trim();
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // YouTube content - extract title, description
    const title = $('title').first().text().trim();
    const description = $('meta[name="description"]').attr('content');
    
    return `${title}\n\n${description || ''}`.trim();
  }
  
  // Default extraction - get body text
  const bodyText = $('body').text().trim();
  return bodyText.replace(/[\s\n]+/g, ' ').trim();
}

/**
 * Fetch content from a URL
 * @param {string} url URL to fetch
 * @returns {Promise<object>} Object with content and metadata
 */
export async function fetchUrl(url) {
  // Check cache first
  const cachedContent = getCachedContent(url);
  if (cachedContent) {
    console.log(`[URL Fetcher] Using cached content for ${url}`);
    return JSON.parse(cachedContent);
  }
  
  // Otherwise fetch content with rate limiting
  return limit(async () => {
    try {
      console.log(`[URL Fetcher] Fetching ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 BambiSleep-Info-Bot/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml',
        },
        timeout: 10000
      });
      
      // Add delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      
      const html = response.data;
      const content = extractMainContent(html, url);
      
      // Extract metadata
      const $ = cheerio.load(html);
      const title = $('title').first().text().trim();
      const description = $('meta[name="description"]').attr('content') || '';
      
      const result = {
        url,
        title,
        content,
        description,
        fetchedAt: new Date().toISOString()
      };
      
      // Cache the result
      cacheContent(url, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error(`[URL Fetcher] Error fetching ${url}:`, error.message);
      return {
        url,
        error: true,
        message: error.message,
        fetchedAt: new Date().toISOString()
      };
    }
  });
}

/**
 * Fetch multiple URLs in sequence with rate limiting
 * @param {string[]} urls Array of URLs to fetch
 * @returns {Promise<object[]>} Array of results
 */
export async function fetchMultipleUrls(urls) {
  const results = [];
  
  for (const url of urls) {
    const result = await fetchUrl(url);
    results.push(result);
  }
  
  return results;
}

export default {
  fetchUrl,
  fetchMultipleUrls
};
