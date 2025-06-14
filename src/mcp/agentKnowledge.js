// Intelligent Knowledge Base Agent - Content Curation & Validation

import * as cheerio from 'cheerio';
import * as contentProcessor from './tools/contentProcessor.js';
import * as knowledgeIndex from './tools/knowledgeIndex.js';
import * as knowledgeTools from './tools/knowledgeTools.js';
import * as lmstudio from '../lmstudio/client.js';
import * as qaSystem from './tools/qaSystem.js';
import * as urlFetcher from './tools/urlFetcher.js';

import axios from 'axios';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../knowledge/knowledge.json');

// Agent deployment configuration
const AGENT_CONFIG = {
  autoDiscovery: process.env.AGENT_AUTO_DISCOVERY !== 'false',
  discoveryInterval: process.env.AGENT_DISCOVERY_INTERVAL || '0 */6 * * *', // Every 6 hours
  maxRetries: 3,
  retryDelay: 5000,
  logPath: path.join(__dirname, '../logs/agent.log')
};

// Trusted content sources for auto-discovery
const TRUSTED_SOURCES = [
  'https://www.reddit.com/r/BambiSleep/new.json',
  'https://bambisleep.info',
  // Add more trusted sources as needed
];

// BambiSleep relevance keywords (weighted)
const RELEVANCE_KEYWORDS = {
  high: ['bambisleep', 'bambi sleep', 'hypnosis', 'trance', 'feminization', 'sissy'],
  medium: ['audio', 'meditation', 'mindfulness', 'transformation', 'conditioning'],
  low: ['fantasy', 'roleplay', 'community', 'discord', 'reddit']
};

// Content categories
const CATEGORIES = {
  official: ['bambisleep.info', 'official'],
  audio: ['soundcloud', 'audio', 'mp3', 'wav', 'music', 'podcast'],
  videos: ['youtube', 'vimeo', 'video', 'mp4', 'stream', 'watch'],
  images: ['image', 'picture', 'gallery', 'photo', 'artwork'],
  scripts: ['script', 'transcript', 'text-script', 'session-script'],
  guides: ['guide', 'tutorial', 'howto', 'instruction'],
  community: ['reddit', 'discord', 'forum', 'discussion'],
  creators: ['creator', 'profile', 'author', 'artist', 'channel'],
  tools: ['github', 'app', 'tool', 'software']
};

// Platform detection rules
const PLATFORMS = {
  youtube: ['youtube.com', 'youtu.be'],
  soundcloud: ['soundcloud.com'],
  vimeo: ['vimeo.com'],
  patreon: ['patreon.com'],
  twitter: ['twitter.com', 'x.com'],
  discord: ['discord.com', 'discord.gg'],
  reddit: ['reddit.com', 'r/'],
  bambicloud: ['bambisleep.info', 'bambi-cloud'],
  hypnotube: ['hypnotube.com'],
  github: ['github.com']
};

// Backup configuration
const BACKUP_CONFIG = {
  backupPath: path.join(__dirname, '../backups'),
  autoBackupInterval: '0 0 * * *', // Daily at midnight
  maxBackups: 7 // Keep 7 days of backups
};

// Webhook configuration for real-time updates
const WEBHOOK_CONFIG = {
  enabled: process.env.WEBHOOK_ENABLED === 'true',
  endpoints: (process.env.WEBHOOK_ENDPOINTS || '').split(',').filter(Boolean),
  timeout: 5000,
  retries: 2
};

// Simple in-memory cache for performance optimization
let dbCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

function loadDB() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (dbCache && (now - cacheTimestamp) < CACHE_TTL) {
    return dbCache;
  }
  
  // Load fresh data and cache it
  if (!fs.existsSync(dbPath)) {
    dbCache = [];
  } else {
    dbCache = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  }
  
  cacheTimestamp = now;
  return dbCache;
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  // Invalidate cache on save
  dbCache = data;
  cacheTimestamp = Date.now();
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
function categorizeContent(title, description, url, platform, mediaType) {
  const safeTitle = title || '';
  const safeDescription = description || '';
  const safeUrl = url || '';
  const text = `${safeTitle} ${safeDescription} ${safeUrl}`.toLowerCase();
  
  // First prioritize by mediaType if available
  if (mediaType) {
    switch(mediaType) {
      case 'video':
        return 'videos';
      case 'audio':
        return 'audio';
      case 'image':
        return 'images';
      case 'creator':
        return 'creators';
      case 'script':
        return 'scripts';
    }
  }
  
  // Then try to categorize by platform
  if (platform) {
    if (platform === 'youtube' || platform === 'vimeo') return 'videos';
    if (platform === 'soundcloud') return 'audio';
    if (platform === 'patreon' || platform === 'twitter') return 'creators';
    if (platform === 'reddit' || platform === 'discord') return 'community';
    if (platform === 'github') return 'tools';
    if (platform === 'bambicloud') return 'official';
  }
    // Check for video URLs
  if (safeUrl.includes('youtube.com/watch') || 
      safeUrl.includes('vimeo.com/') || 
      safeUrl.endsWith('.mp4') || 
      safeUrl.endsWith('.webm')) {
    return 'videos';
  }
  
  // Check for audio URLs
  if (safeUrl.includes('soundcloud.com') || 
      safeUrl.endsWith('.mp3') || 
      safeUrl.endsWith('.wav') || 
      safeUrl.endsWith('.ogg')) {
    return 'audio';
  }
  
  // Check for image URLs
  if (safeUrl.endsWith('.jpg') || 
      safeUrl.endsWith('.jpeg') || 
      safeUrl.endsWith('.png') || 
      safeUrl.endsWith('.gif') || 
      safeUrl.endsWith('.webp')) {
    return 'images';
  }
  
  // Fallback to keyword-based categorization
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  // Default to general for regular links
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
    // Try HEAD request first (faster)
    const response = await axios.head(url, { timeout: 5000 });
    return { valid: true, status: response.status, contentType: response.headers['content-type'] };
  } catch (headError) {
    try {
      // Fall back to GET request if HEAD fails (some servers block HEAD)
      const response = await axios.get(url, { timeout: 10000, maxContentLength: 1024 * 1024 }); // Limit to 1MB
      return { valid: true, status: response.status, contentType: response.headers['content-type'] };
    } catch (getError) {
      return { valid: false, error: `HEAD failed: ${headError.message}, GET failed: ${getError.message}` };
    }
  }
}

// Extract metadata from webpage
async function extractMetadata(url) {
  try {
    // Ensure we're working with a valid URL
    if (!url) {
      return {
        title: 'Unknown',
        description: '',
        error: 'Invalid URL: URL is null or undefined'
      };
    }
    
    console.log(`🔍 Attempting to fetch metadata from: ${url}`);
    
    const response = await axios.get(url, { 
      timeout: 30000, // Increased timeout to 30 seconds
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5, // Allow redirects
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log(`✅ Successfully fetched ${url} - Status: ${response.status}, Content-Type: ${response.headers['content-type']}`);
    
    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text().trim() || 
                 url;
      const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim().slice(0, 200) || '';
    
    console.log(`📝 Extracted - Title: "${title}", Description: "${description.substring(0, 100)}..."`);
    
    // Extract scripts and transcripts
    const scripts = extractScriptsFromHTML($, response.data);
    
    console.log(`🎭 Found ${scripts.length} potential scripts in ${url}`);
    
    // Detect platform from URL
    const platform = detectPlatform(url);
    console.log(`🌐 Detected platform: ${platform || 'unknown'} for ${url}`);
    
    // Determine content type based on metadata and URL
    let contentType = {
      type: 'unknown',
      mimeType: response.headers['content-type']
    };
    
    // Check if it's an image
    if (response.headers['content-type']?.includes('image/')) {
      contentType.type = 'image';
    } 
    // Check if it's a video
    else if (
      response.headers['content-type']?.includes('video/') ||
      url.includes('youtube.com/watch') ||
      url.includes('youtu.be/') ||
      url.includes('vimeo.com') ||
      $('meta[property="og:video"]').length > 0
    ) {
      contentType.type = 'video';
    } 
    // Check if it's audio
    else if (
      response.headers['content-type']?.includes('audio/') ||
      url.includes('soundcloud.com') ||
      $('meta[property="og:audio"]').length > 0
    ) {
      contentType.type = 'audio';
    }
    // Check if it's a creator profile
    else if (
      url.includes('/channel/') ||
      url.includes('/user/') ||
      url.includes('/profile/') ||
      url.includes('patreon.com') ||
      url.match(/\/(u|user)\/[^\/]+\/?$/)
    ) {
      contentType.type = 'creator';
    }
    // Check if it's a script
    else if (scripts.length > 0) {
      contentType.type = 'script';
    }
    
    return { 
      title, 
      description, 
      contentType: response.headers['content-type'],
      platform,
      mediaType: contentType.type,
      scripts: scripts.length > 0 ? scripts : null
    };
  } catch (error) {
    console.error(`❌ Metadata extraction error for ${url}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    return { title: url, description: '', error: `Failed to extract metadata: ${error.message} (${error.code || error.response?.status})` };
  }
}

// Extract BambiSleep scripts and transcripts from HTML content
function extractScriptsFromHTML($, htmlContent) {
  const scripts = [];
  
  // Common patterns for script content
  const scriptSelectors = [
    'script[type="text/plain"]', // Some sites store scripts in plain text scripts
    '.script', '.transcript', '.content', '.post-content',
    '[data-script]', '[data-transcript]',
    'pre', 'code', // Code blocks often contain scripts
    '.text-content', '.article-content', '.entry-content'
  ];
  
  // Extract from various HTML elements
  scriptSelectors.forEach(selector => {
    $(selector).each((i, element) => {
      const text = $(element).text().trim();
      if (isScriptContent(text)) {
        scripts.push({
          content: text,
          source: selector,
          title: extractScriptTitle(text) || 'Extracted Script'
        });
      }
    });
  });
  
  // Also check for script-like content in paragraphs
  $('p').each((i, element) => {
    const text = $(element).text().trim();
    if (text.length > 200 && isScriptContent(text)) {
      scripts.push({
        content: text,
        source: 'paragraph',
        title: extractScriptTitle(text) || 'Extracted Script'
      });
    }
  });
  
  // Check for Reddit-style posts or comments that might contain scripts
  $('.md, .usertext-body, .comment-content').each((i, element) => {
    const text = $(element).text().trim();
    if (isScriptContent(text)) {
      scripts.push({
        content: text,
        source: 'reddit-content',
        title: extractScriptTitle(text) || 'Reddit Script'
      });
    }
  });
  
  return scripts.filter(script => script.content.length > 100); // Filter out too short content
}

// Check if text content looks like a BambiSleep script
function isScriptContent(text) {
  if (!text || text.length < 100) return false;
  
  const scriptIndicators = [
    /bambi/i,
    /trance/i,
    /hypnosis/i,
    /relax/i,
    /sleep/i,
    /breathe/i,
    /focus/i,
    /deeper/i,
    /voice/i,
    /mind/i,
    /listen/i,
    /close your eyes/i,
    /take a deep breath/i,
    /let go/i,
    /drift/i,
    /float/i,
    /surrender/i,
    /feminization/i,
    /transformation/i,
    /conditioning/i
  ];
  
  let matches = 0;
  scriptIndicators.forEach(pattern => {
    if (pattern.test(text)) matches++;
  });
  
  // Require at least 3 matches to consider it a script
  return matches >= 3;
}

// Extract a title from script content
function extractScriptTitle(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Check first few lines for title-like content
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Look for title patterns
    if (line.length < 100 && line.length > 5) {
      if (/^(title|name|script|session):/i.test(line)) {
        return line.replace(/^(title|name|script|session):\s*/i, '');
      }
      
      // If it's the first line and looks like a title
      if (i === 0 && !line.includes('.') && line.length < 50) {
        return line;
      }
    }
  }
  
  return null;
}

// Main intelligent crawl and analyze function
export async function crawlAndAnalyze(url) {
  try {
    console.log(`🚀 Starting analysis of: ${url}`);
    
    // Step 1: URL Validation
    const validation = await validateURL(url);
    if (!validation.valid) {
      const errorMsg = `URL validation failed: ${validation.error}`;
      console.log(`❌ [${url}] ${errorMsg}`);
      return { url, success: false, error: true, message: errorMsg };
    }
    console.log(`✅ [${url}] URL validation passed`);

    // Step 2: Extract metadata and scripts
    const metadata = await extractMetadata(url);
    if (metadata.error) {
      const errorMsg = `Metadata extraction failed: ${metadata.error}`;
      console.log(`❌ [${url}] ${errorMsg}`);
      return { url, success: false, error: true, message: errorMsg };
    }
    console.log(`✅ [${url}] Metadata extracted: "${metadata.title}"`);
    
    // New Step: Check if URL already exists and update it if it does
    const existingCheck = updateExistingEntry(url, metadata, validation);
    if (existingCheck.exists) {
      console.log(`🔄 [${url}] ${existingCheck.message}`);
      return { 
        url, 
        success: true, 
        updated: existingCheck.updated,
        entry: existingCheck.entry,
        message: existingCheck.message
      };
    }
    
    // Step 3: Advanced duplicate detection
    const existingEntries = loadDB();
    if (isAdvancedDuplicate({ url, title: metadata.title, description: metadata.description }, existingEntries)) {
      const errorMsg = 'Advanced duplicate detection: Similar content already exists';
      console.log(`⚠️ [${url}] ${errorMsg} - Title: "${metadata.title}"`);
      return { url, success: false, duplicate: true, message: errorMsg };
    }// Step 4: Calculate advanced relevance with LMStudio integration or fallback to heuristics
    let relevance = 0;
    let modelAnalyzed = false;
    
    // Try using LMStudio for advanced analysis
    try {
      const isLMStudioAvailable = await lmstudio.isAvailable();
      
      if (isLMStudioAvailable) {
        const combinedText = `Title: ${metadata.title}\nDescription: ${metadata.description || 'N/A'}\nURL: ${url}`;
        const analysis = await lmstudio.analyze(combinedText);
        
        // Use the model's relevance score if available
        if (analysis && typeof analysis.relevance === 'number') {
          relevance = analysis.relevance;
          modelAnalyzed = true;
          
          // Add model-enhanced categorization and keywords
          metadata.analyzedCategory = analysis.category;
          metadata.analyzedKeywords = analysis.keywords;
          metadata.analyzedSummary = analysis.summary;
          metadata.adultContent = analysis.adult_content;
          metadata.safetyRating = analysis.safety_rating;
          
          console.log(`🤖 [${url}] LMStudio analysis: relevance=${relevance}, category=${analysis.category}, keywords=[${analysis.keywords.join(', ')}]`);
        }
      }
    } catch (error) {
      console.error(`❌ [${url}] LMStudio analysis error: ${error.message}. Falling back to heuristic scoring.`);
    }
    
    // Fall back to heuristic scoring if model analysis failed
    if (!modelAnalyzed) {
      relevance = calculateAdvancedRelevanceScore(metadata.title, metadata.description, url);
      console.log(`📊 [${url}] Heuristic relevance score: ${relevance}/10`);
    }
    const safeUrl = url || '';
    const relevanceThreshold = safeUrl.includes('bambisleep.info') ? 1 : 2;
    if (relevance < relevanceThreshold) {
      const errorMsg = `Low relevance score: ${relevance}/10 (threshold: ${relevanceThreshold}) - Title: "${metadata.title}", Description: "${metadata.description?.substring(0, 100) || ''}..."`;
      console.log(`❌ [${url}] ${errorMsg}`);
      return { url, success: false, error: true, message: errorMsg };    }

    // Step 5: Categorize content with platform and media type awareness
    const category = categorizeContent(
      metadata.title, 
      metadata.description, 
      url, 
      metadata.platform, 
      metadata.mediaType
    );
    console.log(`🏷️ Categorized ${url} as: ${category} (platform: ${metadata.platform || 'unknown'}, type: ${metadata.mediaType || 'unknown'})`);    // Step 6: Create enriched entry
    const entry = {
      id: 'kb_' + Date.now(),
      url,
      title: metadata.title,
      description: metadata.description,
      category: metadata.analyzedCategory || category, // Use model category if available
      platform: metadata.platform || null,
      mediaType: metadata.mediaType || null,
      relevance,
      contentType: validation.contentType,
      addedAt: new Date().toISOString(),
      validated: true,
      scripts: metadata.scripts || [], // Store extracted scripts
      modelAnalyzed: modelAnalyzed || false,
      keywords: metadata.analyzedKeywords || [],
      summary: metadata.analyzedSummary || null,
      adultContent: metadata.adultContent || false,
      safetyRating: metadata.safetyRating || 5
    };

    // Step 7: Save to knowledge base
    const db = loadDB();
    db.push(entry);
      // Step 8: If scripts were found, also save them as separate text entries
    let scriptsAdded = 0;
    if (metadata.scripts && metadata.scripts.length > 0) {
      for (const script of metadata.scripts) {
        const scriptEntry = {
          id: 'script_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          type: 'text_script', // Explicit type to identify script content
          title: script.title || `Script from ${metadata.title}`,
          content: script.content,
          source: url,
          category: 'scripts', // Always categorize as scripts
          platform: metadata.platform || null,
          wordCount: script.content.split(/\s+/).length,
          relevance: 10, // Auto-extracted scripts get high relevance
          timestamp: new Date().toISOString(),
          addedAt: new Date().toISOString(),
          validated: true,
          extractedFrom: entry.id
        };
        db.push(scriptEntry);
        scriptsAdded++;
      }
    }
      saveDB(db);
    console.log(`✅ Successfully added ${url} to knowledge base with ${scriptsAdded} scripts`);

    const result = { success: true, entry };
    if (metadata.scripts && metadata.scripts.length > 0) {
      result.scriptsExtracted = metadata.scripts.length;
      result.message = `Content added with ${metadata.scripts.length} script(s) extracted automatically`;
    }
    
    // Add platform and media type information to the result
    if (metadata.platform) {
      result.platform = metadata.platform;
    }
    
    if (metadata.mediaType) {
      result.mediaType = metadata.mediaType;
    }

    return result;
  } catch (error) {
    console.error(`💥 Error analyzing ${url}:`, error.message);
    return { url, success: false, error: true, message: `Analysis error: ${error.message}` };
  }
}

// Batch analyze multiple URLs
export async function batchAnalyze(urls) {
  console.log(`📊 Starting batch analysis of ${urls.length} URLs`);
  const results = [];
  
  for (const url of urls) {
    const result = await crawlAndAnalyze(url);
    results.push(result);
    // Small delay to avoid overwhelming servers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Log categorized results
  const successful = results.filter(r => r.success).length;
  const duplicates = results.filter(r => r.duplicate).length;
  const errors = results.filter(r => r.error && !r.duplicate).length;
  
  console.log(`📈 Batch analysis completed: ${successful} new, ${duplicates} duplicates, ${errors} errors`);
  
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

// Logging function
function logMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };
  
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  
  // Ensure logs directory exists
  const logsDir = path.dirname(AGENT_CONFIG.logPath);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Append to log file
  try {
    fs.appendFileSync(AGENT_CONFIG.logPath, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

// Enhanced error handling wrapper
async function withRetry(operation, context = 'operation') {
  for (let attempt = 1; attempt <= AGENT_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      logMessage('error', `${context} failed (attempt ${attempt}/${AGENT_CONFIG.maxRetries})`, {
        error: error.message,
        stack: error.stack
      });
      
      if (attempt === AGENT_CONFIG.maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, AGENT_CONFIG.retryDelay * attempt));
    }
  }
}

// Discover content from Reddit
async function discoverFromReddit() {
  try {
    const response = await axios.get('https://www.reddit.com/r/BambiSleep/new.json', {
      headers: { 'User-Agent': 'BambiSleep-Church-Bot/1.0' },
      timeout: 10000
    });
    
    const posts = response.data?.data?.children || [];
    const discoveredUrls = [];    
    for (const post of posts) { // Process all posts (no artificial limits)
      const postData = post.data;
      if (postData.url && !postData.url.includes('reddit.com')) {
        discoveredUrls.push(postData.url);
      }
    }
    
    return discoveredUrls;
  } catch (error) {
    logMessage('error', 'Failed to discover content from Reddit', { error: error.message });
    return [];
  }
}

// Automated content discovery
export async function runContentDiscovery() {
  logMessage('info', 'Starting automated content discovery');
  
  try {
    const discoveredUrls = await withRetry(discoverFromReddit, 'Reddit discovery');
    
    if (discoveredUrls.length === 0) {
      logMessage('info', 'No new content discovered');
      return { success: true, discovered: 0, processed: 0 };
    }
    
    logMessage('info', `Discovered ${discoveredUrls.length} potential URLs`);
      // Process discovered URLs
    const results = await withRetry(
      () => batchAnalyze(discoveredUrls),
      'Batch analysis of discovered content'
    );
    
    // Categorize results properly
    const successful = results.filter(r => r.success).length;
    const duplicates = results.filter(r => r.duplicate).length;
    const errors = results.filter(r => r.error && !r.duplicate).length;
    
      logMessage('info', 'Content discovery completed', {
      discovered: discoveredUrls.length,
      successful,
      duplicates,
      errors
    });    // Send webhook notification for completed discovery
    await sendWebhookNotification('discovery:complete', {
      discovered: discoveredUrls.length,
      processed: successful,
      duplicates,
      errors,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      discovered: discoveredUrls.length, 
      processed: successful,
      duplicates,
      errors 
    };
    
  } catch (error) {
    logMessage('error', 'Content discovery failed', { error: error.message });
    
    // Send webhook notification for discovery errors
    await sendWebhookNotification('discovery:error', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

// Start automated agent deployment
export function deployAgent() {
  logMessage('info', 'Deploying Knowledge Base Agent');
  
  if (!AGENT_CONFIG.autoDiscovery) {
    logMessage('info', 'Auto-discovery disabled via configuration');
    return;
  }
  
  // Schedule content discovery
  cron.schedule(AGENT_CONFIG.discoveryInterval, async () => {
    logMessage('info', 'Running scheduled content discovery');
    await runContentDiscovery();
  });

  // Schedule automatic backups
  cron.schedule(BACKUP_CONFIG.autoBackupInterval, () => {
    logMessage('info', 'Running scheduled backup');
    const result = createBackup();
    if (result.success) {
      logMessage('info', `Backup created: ${result.backupFile} (${result.itemCount} items)`);
    } else {
      logMessage('error', `Backup failed: ${result.error}`);
    }
  });

  // Schedule content archival (weekly on Sundays at 2 AM)
  cron.schedule('0 2 * * 0', () => {
    logMessage('info', 'Running scheduled content archival');
    const result = archiveExpiredContent();
    if (result.error) {
      logMessage('error', `Archival failed: ${result.error}`);
    } else {
      logMessage('info', `Archival completed: ${result.archived} archived, ${result.active} remain active`);
      
      // Send webhook notification for archival
      sendWebhookNotification('content:archived', result);
    }
  });
  
  // Run initial discovery
  setTimeout(async () => {
    logMessage('info', 'Running initial content discovery');
    await runContentDiscovery();
  }, 5000); // Wait 5 seconds after startup

  // Create initial backup
  setTimeout(() => {
    logMessage('info', 'Creating initial backup');
    const result = createBackup();
    if (result.success) {
      logMessage('info', `Initial backup created: ${result.backupFile} (${result.itemCount} items)`);
    }
  }, 10000); // Wait 10 seconds after startup
  
  logMessage('info', `Agent deployed successfully. Discovery: ${AGENT_CONFIG.discoveryInterval}, Backups: ${BACKUP_CONFIG.autoBackupInterval}`);
}

// Agent health check
export function getAgentStatus() {
  const db = loadDB();
  const logExists = fs.existsSync(AGENT_CONFIG.logPath);
  
  return {
    status: 'operational',
    autoDiscovery: AGENT_CONFIG.autoDiscovery,
    discoverySchedule: AGENT_CONFIG.discoveryInterval,
    knowledgeEntries: db.length,
    logsAvailable: logExists,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    deployment: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      startTime: new Date().toISOString()
    }
  };
}

// Extract relevant links from a webpage
async function extractRelevantLinks(url) {
  try {
    const response = await axios.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const links = new Set();
    
    // Extract all links from the page
    $('a[href]').each((i, element) => {
      let href = $(element).attr('href');
      if (!href) return;
      
      // Convert relative URLs to absolute
      try {
        if (href.startsWith('/')) {
          const baseUrl = new URL(url);
          href = `${baseUrl.protocol}//${baseUrl.host}${href}`;
        } else if (href.startsWith('./') || href.startsWith('../')) {
          href = new URL(href, url).toString();
        } else if (!href.startsWith('http')) {
          return; // Skip invalid URLs
        }
        
        // Basic filtering for relevant content
        const linkText = $(element).text().toLowerCase();
        const linkUrl = href.toLowerCase();
        
        // Check if link is relevant to BambiSleep content
        const isRelevant = RELEVANCE_KEYWORDS.high.some(keyword => 
          linkText.includes(keyword) || linkUrl.includes(keyword)
        ) || RELEVANCE_KEYWORDS.medium.some(keyword => 
          linkText.includes(keyword) || linkUrl.includes(keyword)
        );
        
        if (isRelevant) {
          links.add(href);
        }
        
        // Also include links from known relevant domains
        const relevantDomains = [
          'youtube.com', 'youtu.be', 'soundcloud.com', 'reddit.com/r/bambisleep',
          'patreon.com', 'ko-fi.com', 'onlyfans.com', 'bambisleep.info'
        ];
        
        if (relevantDomains.some(domain => linkUrl.includes(domain))) {
          links.add(href);
        }
        
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    return Array.from(links);
  } catch (error) {
    logMessage('error', 'Failed to extract links', { url, error: error.message });
    return [];
  }
}

// Crawl a URL and extract relevant links, then analyze them
export async function crawlAndExtractLinks(submittedUrl, io = null) {
  logMessage('info', `Starting URL crawl and analysis: ${submittedUrl}`);
  
  // Emit initial progress
  if (io) {
    io.emit('crawl:progress', {
      percentage: 5,
      status: 'Analyzing main URL...',
      details: `Crawling: ${submittedUrl}`,
      logMessage: `🔍 Analyzing main URL: ${submittedUrl}`
    });
  }
  
  try {
    // First, analyze the submitted URL itself
    const mainResult = await withRetry(
      () => crawlAndAnalyze(submittedUrl),
      `Analysis of main URL: ${submittedUrl}`
    );
    
    if (io) {
      io.emit('crawl:progress', {
        percentage: 15,
        status: 'Extracting links...',
        details: `Finding relevant links on the page`,
        logMessage: mainResult.success ? '✅ Main URL analyzed successfully' : '❌ Main URL analysis failed'
      });
    }
    
    // Extract relevant links from the page
    const relevantLinks = await withRetry(
      () => extractRelevantLinks(submittedUrl),
      `Link extraction from: ${submittedUrl}`
    );
    
    logMessage('info', `Found ${relevantLinks.length} relevant links on page`);
    
    if (io) {
      io.emit('crawl:progress', {
        percentage: 25,
        status: 'Processing links...',
        details: `Found ${relevantLinks.length} relevant links to analyze`,
        logMessage: `📋 Found ${relevantLinks.length} relevant links`
      });
    }
      // Analyze each relevant link
    const linkResults = [];
    let successCount = 0;
    let errorCount = 0;
      // Process all found links (no artificial limits)
    const linksToProcess = relevantLinks;
    
    for (let i = 0; i < linksToProcess.length; i++) {
      const link = linksToProcess[i];
      const progressPercentage = 25 + Math.floor((i / linksToProcess.length) * 70);
      
      if (io) {
        io.emit('crawl:progress', {
          percentage: progressPercentage,
          status: 'Analyzing links...',
          details: `Processing link ${i + 1} of ${linksToProcess.length}: ${link.substring(0, 50)}...`,
          logMessage: `🔗 Analyzing link ${i + 1}/${linksToProcess.length}`
        });
      }        try {        // Small delay between requests to be respectful  
        await new Promise(resolve => setTimeout(resolve, 500)); // Reduced delay to 500ms
          console.log(`🔗 Processing link ${i + 1}/${linksToProcess.length}: ${link}`);
        const result = await crawlAndAnalyze(link);
        linkResults.push(result);
        
        if (result.success) {
          successCount++;
          console.log(`✅ Link ${i + 1} successful: ${link} - "${result.entry?.title || 'No title'}"`);
        } else {
          errorCount++;
          console.log(`❌ Link ${i + 1} failed: ${link}`);
          console.log(`   ↳ Error: ${result.message}`);
        }
        
        // Update progress more frequently
        if (io) {
          const progressPercentage = 25 + Math.floor(((i + 1) / linksToProcess.length) * 70);
          io.emit('crawl:progress', {
            percentage: progressPercentage,
            status: 'Analyzing links...',
            details: `Completed ${i + 1} of ${linksToProcess.length} links (✅${successCount} ❌${errorCount})`,
            logMessage: result.success ? 
              `✅ Link ${i + 1}/${linksToProcess.length} analyzed successfully` : 
              `❌ Link ${i + 1}/${linksToProcess.length} failed: ${result.message}`
          });
        }
      } catch (error) {
        errorCount++;
        console.log(`💥 Link ${i + 1} crashed: ${link} - ${error.message}`);
        linkResults.push({
          url: link,
          success: false,
          error: true,
          message: error.message
        });
        
        if (io) {
          io.emit('crawl:progress', {
            percentage: 25 + Math.floor(((i + 1) / linksToProcess.length) * 70),
            status: 'Analyzing links...',
            details: `Completed ${i + 1} of ${linksToProcess.length} links (✅${successCount} ❌${errorCount})`,
            logMessage: `💥 Link ${i + 1}/${linksToProcess.length} crashed: ${error.message}`
          });
        }
      }
    }

    // Send webhook notifications for completed crawl
    await sendWebhookNotification('crawl:complete', {
      success: true,
      results: linkResults,
      summary: { totalProcessed: linksToProcess.length, successful: successCount, failed: errorCount }
    });    // Categorize results for better reporting
    let addedCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let finalErrorCount = 0;
    
    linkResults.forEach(result => {
      if (result.success && result.updated) {
        updatedCount++;
      } else if (result.success && !result.updated) {
        addedCount++;
      } else if (result.message && result.message.includes('duplicate')) {
        duplicateCount++;
      } else {
        finalErrorCount++;
      }
    });

    // Final progress update with better categorization
    if (io) {
      io.emit('crawl:progress', {
        percentage: 100,
        status: 'Complete!',
        details: `Processed ${linksToProcess.length} links: ${addedCount} new, ${updatedCount} updated, ${duplicateCount} duplicates, ${finalErrorCount} errors`,
        logMessage: `✅ Crawl completed: ${addedCount} links added, ${updatedCount} links updated`
      });
      
      io.emit('crawl:complete', {
        success: true,
        results: linkResults,
        summary: {
          totalProcessed: linksToProcess.length,
          successful: addedCount,
          updated: updatedCount,
          duplicates: duplicateCount,
          failed: finalErrorCount
        }
      });
    }// Calculate total scripts extracted
    const totalScriptsExtracted = linkResults.reduce((total, result) => {
      if (result.success && result.scriptsExtracted) {
        return total + result.scriptsExtracted;
      }
      return total;
    }, 0);    return {
      success: true,
      message: `Successfully processed ${addedCount} new links and updated ${updatedCount} existing links out of ${linksToProcess.length} total (${duplicateCount} duplicates, ${finalErrorCount} errors)`,
      results: linkResults,
      summary: {
        totalProcessed: linksToProcess.length,
        successful: addedCount,
        updated: updatedCount,
        duplicates: duplicateCount,
        failed: finalErrorCount
      },
      linksFound: linksToProcess.length,
      added: addedCount,
      updated: updatedCount,
      scriptsExtracted: totalScriptsExtracted
    };
  } catch (error) {
    const errorMessage = `Error during crawl: ${error.message}`;
    
    // Send webhook notification for errors
    await sendWebhookNotification('crawl:error', { error: errorMessage });
    
    if (io) {
      io.emit('crawl:error', {
        error: errorMessage,
        details: error.stack
      });
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// ==================== WEBHOOK SUPPORT FOR REAL-TIME UPDATES ====================

async function sendWebhookNotification(event, data) {
  if (!WEBHOOK_CONFIG.enabled || WEBHOOK_CONFIG.endpoints.length === 0) {
    return;
  }

  const payload = {
    timestamp: new Date().toISOString(),
    event,
    data,
    source: 'bambisleep-knowledge-agent'
  };

  for (const endpoint of WEBHOOK_CONFIG.endpoints) {
    try {
      await axios.post(endpoint, payload, {
        timeout: WEBHOOK_CONFIG.timeout,
        headers: { 'Content-Type': 'application/json' }
      });
      logMessage('info', `Webhook sent successfully to ${endpoint}`);
    } catch (error) {
      logMessage('error', `Webhook failed for ${endpoint}: ${error.message}`);
    }
  }
}

// ==================== ADVANCED MACHINE LEARNING SCORING ====================

function calculateAdvancedRelevanceScore(title, description, url) {
  let score = 0;
  const safeTitle = title || '';
  const safeDescription = description || '';
  const safeUrl = url || '';
  const text = `${safeTitle} ${safeDescription} ${safeUrl}`.toLowerCase();
  
  // Enhanced keyword matching with context awareness
  const wordCounts = {};
  const words = text.split(/\s+/);
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  // High-value keywords (weighted scoring)
  RELEVANCE_KEYWORDS.high.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 4 * (wordCounts[keyword] || 1);
    }
  });

  RELEVANCE_KEYWORDS.medium.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 2 * (wordCounts[keyword] || 1);
    }
  });

  RELEVANCE_KEYWORDS.low.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 1;
    }
  });

  // Domain authority scoring
  if (url.includes('bambisleep.info')) score += 5;
  if (url.includes('reddit.com')) score += 2;
  if (url.includes('youtube.com') || url.includes('soundcloud.com')) score += 3;

  // Content length penalty (very short content less valuable)
  if (description.length < 50) score -= 1;
  if (description.length > 200) score += 1;

  // Recency bonus (if we had timestamps)
  // This could be enhanced with actual publication dates

  return Math.min(Math.max(score, 0), 10);
}

// ==================== ADVANCED DUPLICATE DETECTION ====================

function calculateSimilarity(str1, str2) {
  // Simple Jaccard similarity for fuzzy matching
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

function isAdvancedDuplicate(newEntry, existingEntries) {
  const similarityThreshold = 0.9; // Increased from 0.8 to be less aggressive
    for (const existing of existingEntries) {
    // Ensure we have valid URL strings
    const newUrl = newEntry.url || '';
    const existingUrl = existing.url || '';
    
    // Exact URL match - this is a true duplicate
    if (newUrl === existingUrl && newUrl !== '') {
      return true;
    }
    
    // For bambisleep.info domains, be more lenient to allow different pages
    if (newUrl.includes('bambisleep.info') && existingUrl.includes('bambisleep.info')) {
      // Only consider duplicates if URLs are very similar or identical titles
      const urlSimilarity = calculateSimilarity(newUrl, existingUrl);
      if (urlSimilarity > 0.9) {
        return true;
      }
      
      // For bambisleep.info, only flag as duplicate if titles are nearly identical
      const titleSimilarity = calculateSimilarity(newEntry.title || '', existing.title || '');
      if (titleSimilarity > 0.95) {
        return true;
      }
      
      // Skip other similarity checks for bambisleep.info to allow different pages
      continue;
    }
    
    // Title similarity check (for non-bambisleep domains)
    const titleSimilarity = calculateSimilarity(newEntry.title || '', existing.title || '');
    if (titleSimilarity > similarityThreshold) {
      return true;
    }
    
    // Description similarity check (for non-bambisleep domains)
    const descSimilarity = calculateSimilarity(newEntry.description || '', existing.description || '');
    if (descSimilarity > similarityThreshold) {
      return true;
    }
    
    // Combined content similarity (for non-bambisleep domains)
    const combinedNew = `${newEntry.title} ${newEntry.description}`;
    const combinedExisting = `${existing.title} ${existing.description}`;
    const combinedSimilarity = calculateSimilarity(combinedNew, combinedExisting);
    if (combinedSimilarity > 0.8) { // Increased from 0.7
      return true;
    }
  }
  
  return false;
}

// ==================== CONTENT EXPIRATION AND ARCHIVAL ====================

function archiveExpiredContent() {
  try {
    const db = loadDB();
    const now = Date.now();
    const expirationThreshold = 365 * 24 * 60 * 60 * 1000; // 1 year
    const lowRelevanceThreshold = 90 * 24 * 60 * 60 * 1000; // 90 days for low relevance
    
    const activeContent = [];
    const archivedContent = [];
    
    db.forEach(entry => {
      const entryDate = new Date(entry.timestamp || entry.dateAdded || Date.now()).getTime();
      const age = now - entryDate;
      const isOld = age > expirationThreshold;
      const isLowRelevance = (entry.relevanceScore || 0) < 3 && age > lowRelevanceThreshold;
      
      if (isOld || isLowRelevance) {
        entry.archived = true;
        entry.archiveDate = new Date().toISOString();
        entry.archiveReason = isOld ? 'expired' : 'low_relevance';
        archivedContent.push(entry);
      } else {
        activeContent.push(entry);
      }
    });
    
    // Save active content
    saveDB(activeContent);
    
    // Save archived content separately
    const archivePath = path.join(__dirname, '../knowledge/archived.json');
    let existingArchive = [];
    if (fs.existsSync(archivePath)) {
      existingArchive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
    }
    
    const updatedArchive = [...existingArchive, ...archivedContent];
    fs.writeFileSync(archivePath, JSON.stringify(updatedArchive, null, 2));
    
    logMessage('info', `Archived ${archivedContent.length} entries, ${activeContent.length} remain active`);
    
    return {
      archived: archivedContent.length,
      active: activeContent.length
    };
  } catch (error) {
    logMessage('error', `Archive process failed: ${error.message}`);
    return { error: error.message };
  }
}

// ==================== BACKUP & RESTORE FUNCTIONS ====================

function createBackup() {
  try {
    const db = loadDB();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_CONFIG.backupPath, `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(db, null, 2));
    
    // Cleanup old backups
    cleanupOldBackups();
    
    return {
      success: true,
      backupFile,
      itemCount: db.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_CONFIG.backupPath);
    const backups = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const fullPath = path.join(BACKUP_CONFIG.backupPath, file);
        const stats = fs.statSync(fullPath);
        return {
          file,
          fullPath,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Newest first
    
    return { success: true, backups };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function restoreBackup(backupFile) {
  try {
    const backupPath = path.join(BACKUP_CONFIG.backupPath, backupFile);
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    saveDB(data);
    
    return { success: true, itemCount: data.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function cleanupOldBackups() {
  try {
    const backupsList = listBackups();
    if (backupsList.success && backupsList.backups.length > BACKUP_CONFIG.maxBackups) {
      const toDelete = backupsList.backups.slice(BACKUP_CONFIG.maxBackups);
      toDelete.forEach(backup => {
        fs.unlinkSync(backup.fullPath);
      });
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

// ==================== KNOWLEDGE BASE CLEANUP ====================

export async function cleanKnowledgeBase(io = null) {
  try {
    logMessage('info', 'Starting knowledge base cleanup');
    
    if (io) {
      io.emit('cleanup:progress', {
        percentage: 10,
        status: 'Loading knowledge base...',
        message: '🔍 Loading current knowledge base'
      });
    }

    const db = loadDB();
    const originalCount = db.length;
    let cleaned = [];
    let duplicatesRemoved = 0;
    let invalidRemoved = 0;
    let archivedCount = 0;

    if (io) {
      io.emit('cleanup:progress', {
        percentage: 20,
        status: 'Removing duplicates...',
        message: `📋 Found ${originalCount} entries, removing duplicates`
      });
    }

    // Step 1: Remove exact URL duplicates
    const urlMap = new Map();
    for (const entry of db) {
      if (!entry.url || typeof entry.url !== 'string') {
        invalidRemoved++;
        continue;
      }
      
      if (urlMap.has(entry.url)) {
        duplicatesRemoved++;
        continue;
      }
      
      urlMap.set(entry.url, entry);
      cleaned.push(entry);
    }

    if (io) {
      io.emit('cleanup:progress', {
        percentage: 40,
        status: 'Validating entries...',
        message: `✅ Removed ${duplicatesRemoved} duplicates, ${invalidRemoved} invalid entries`
      });
    }

    // Step 2: Validate and clean entries
    cleaned = cleaned.filter(entry => {
      // Ensure required fields
      if (!entry.id || !entry.url || !entry.title) {
        invalidRemoved++;
        return false;
      }
      
      // Clean up malformed data
      if (typeof entry.relevance !== 'number') {
        entry.relevance = 1;
      }
      if (!entry.category) {
        entry.category = 'general';
      }
      if (!entry.addedAt) {
        entry.addedAt = new Date().toISOString();
      }
      
      return true;
    });

    if (io) {
      io.emit('cleanup:progress', {
        percentage: 60,
        status: 'Archiving old content...',
        message: `🧹 Cleaned ${cleaned.length} valid entries`
      });
    }

    // Step 3: Archive very old, low-relevance content
    const now = Date.now();
    const archiveThreshold = 180 * 24 * 60 * 60 * 1000; // 6 months
    
    cleaned = cleaned.filter(entry => {
      const entryAge = now - new Date(entry.addedAt).getTime();
      if (entryAge > archiveThreshold && entry.relevance < 3) {
        archivedCount++;
        return false;
      }
      return true;
    });

    if (io) {
      io.emit('cleanup:progress', {
        percentage: 80,
        status: 'Sorting and organizing...',
        message: `📦 Archived ${archivedCount} old entries`
      });
    }

    // Step 4: Sort by relevance and date
    cleaned.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return new Date(b.addedAt) - new Date(a.addedAt);
    });

    // Step 5: Save cleaned database
    saveDB(cleaned);
    
    const finalCount = cleaned.length;
    const totalRemoved = originalCount - finalCount;
    
    logMessage('info', 'Knowledge base cleanup completed', {
      original: originalCount,
      final: finalCount,
      removed: totalRemoved,
      duplicates: duplicatesRemoved,
      invalid: invalidRemoved,
      archived: archivedCount
    });

    if (io) {
      io.emit('cleanup:progress', {
        percentage: 100,
        status: 'Cleanup complete!',
        message: `✅ Cleanup finished: ${totalRemoved} entries removed`
      });
        io.emit('cleanup:complete', {
        success: true,
        summary: {
          originalCount,
          finalCount,
          totalRemoved,
          duplicatesRemoved,
          invalidRemoved,
          archivedCount
        }
      });
    }
      return {
      success: true,
      message: `Cleanup completed: ${totalRemoved} entries removed (${duplicatesRemoved} duplicates, ${invalidRemoved} invalid, ${archivedCount} archived)`,
      summary: {
        originalCount,
        finalCount,
        totalRemoved,
        duplicatesRemoved,
        invalidRemoved,
        archivedCount
      }
    };

  } catch (error) {
    const errorMessage = `Cleanup failed: ${error.message}`;
    logMessage('error', errorMessage, { error: error.stack });
    
    if (io) {
      io.emit('cleanup:error', {
        error: errorMessage
      });
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Get all text scripts from knowledge base
export function getTextScripts() {
  const db = loadDB();
  const textScripts = db.filter(item => 
    item.type === 'text_script' || 
    (item.category === 'scripts' && item.content)
  );
  
  // Add word count if missing
  textScripts.forEach(script => {
    if (!script.wordCount && script.content) {
      script.wordCount = script.content.split(/\s+/).length;
    }
  });
  
  return textScripts.sort((a, b) => {
    const dateA = new Date(a.addedAt || a.timestamp);
    const dateB = new Date(b.addedAt || b.timestamp);
    return dateB - dateA;
  });
}

// Search text scripts by content
export function searchTextScripts(query) {
  const textScripts = getTextScripts();
  const queryLower = query.toLowerCase();
  
  return textScripts.filter(script => 
    (script.title && script.title.toLowerCase().includes(queryLower)) ||
    (script.content && script.content.toLowerCase().includes(queryLower)) ||
    (script.description && script.description.toLowerCase().includes(queryLower)) ||
    (script.platform && script.platform.toLowerCase().includes(queryLower))
  );
}

// Determine platform from URL
function detectPlatform(url) {
  if (!url) return null;
  
  const urlLower = url.toLowerCase();
  
  for (const [platform, domains] of Object.entries(PLATFORMS)) {
    if (domains.some(domain => urlLower.includes(domain))) {
      return platform;
    }
  }
  
  return null;
}

// Check if URL exists and update with new information
function updateExistingEntry(url, newMetadata, validationData) {
  const db = loadDB();
  const existingIndex = db.findIndex(item => item.url === url);
  
  if (existingIndex === -1) {
    return { exists: false };
  }
  
  const existingEntry = db[existingIndex];
  let hasChanges = false;
  
  // Fields to compare and update
  const fieldsToUpdate = [
    { field: 'title', source: newMetadata.title },
    { field: 'description', source: newMetadata.description },
    { field: 'platform', source: newMetadata.platform },
    { field: 'mediaType', source: newMetadata.mediaType },
    { field: 'contentType', source: validationData.contentType },
    { field: 'category', source: categorizeContent(
        newMetadata.title, 
        newMetadata.description, 
        url, 
        newMetadata.platform, 
        newMetadata.mediaType
      )
    },
    { field: 'relevance', source: calculateAdvancedRelevanceScore(
        newMetadata.title, 
        newMetadata.description, 
        url
      )
    }
  ];
  
  // Compare and update fields
  for (const field of fieldsToUpdate) {
    // Skip undefined or null values
    if (field.source === undefined || field.source === null) {
      continue;
    }
    
    // Check if field is different
    if (existingEntry[field.field] !== field.source) {
      console.log(`🔄 Updating ${field.field}: "${existingEntry[field.field]}" -> "${field.source}"`);
      existingEntry[field.field] = field.source;
      hasChanges = true;
    }
  }
  
  // Add scripts if new ones were found
  if (newMetadata.scripts && newMetadata.scripts.length > 0) {
    // Add scripts that don't already exist
    const existingScripts = existingEntry.scripts || [];
    const newScripts = newMetadata.scripts.filter(newScript => {
      // Consider a script new if there isn't a matching title or content
      return !existingScripts.some(existingScript => 
        (existingScript.title === newScript.title) || 
        (calculateSimilarity(existingScript.content, newScript.content) > 0.8)
      );
    });
    
    if (newScripts.length > 0) {
      existingEntry.scripts = [...existingScripts, ...newScripts];
      hasChanges = true;
      console.log(`🔄 Added ${newScripts.length} new scripts to existing entry`);
    }
  }
  
  // Only update if there were actual changes
  if (hasChanges) {
    // Add updatedAt timestamp
    existingEntry.updatedAt = new Date().toISOString();
    // Update the entry in the database
    db[existingIndex] = existingEntry;
    saveDB(db);
    
    return { 
      exists: true, 
      updated: true, 
      entry: existingEntry,
      message: `Updated existing entry with new information`
    };
  }
  
  return { 
    exists: true, 
    updated: false, 
    entry: existingEntry,
    message: `Entry exists but no changes were detected`
  };
}

/**
 * Fetch and process BambiSleep content from a URL
 * @param {string} url URL to fetch
 * @returns {Promise<object>} Result of fetching and processing
 */
export async function fetchAndProcessBambiSleepContent(url, io = null) {
  try {
    // Log operation start
    console.log(`[BambiSleep QA] Fetching content from ${url}`);
    if (io) {
      io.emit('agent:log', { message: `Fetching BambiSleep content from ${url}`, type: 'info' });
    }
    
    // Fetch content
    const content = await urlFetcher.fetchUrl(url);
    
    // Check for fetch error
    if (content.error) {
      console.error(`[BambiSleep QA] Error fetching URL: ${content.message}`);
      if (io) {
        io.emit('agent:log', { message: `Error fetching URL: ${content.message}`, type: 'error' });
      }
      return { success: false, error: content.message };
    }
    
    // Process content
    console.log(`[BambiSleep QA] Processing content from ${url}`);
    if (io) {
      io.emit('agent:log', { message: `Processing BambiSleep content`, type: 'info' });
    }
    
    const processed = contentProcessor.processContent(content);
    
    // Check if content is relevant to BambiSleep
    if (!processed.processed) {
      console.log(`[BambiSleep QA] Content not relevant to BambiSleep: ${processed.message}`);
      if (io) {
        io.emit('agent:log', { message: `Content not relevant to BambiSleep: ${processed.message}`, type: 'warning' });
      }
      return { success: false, error: processed.message };
    }
    
    // Save to knowledge base
    console.log(`[BambiSleep QA] Adding to knowledge base: ${processed.title}`);
    if (io) {
      io.emit('agent:log', { message: `Adding to knowledge base: ${processed.title}`, type: 'success' });
    }
    
    // Create entry for knowledge database
    const entry = {
      url: processed.url,
      title: processed.title,
      description: processed.summary,
      category: processed.categories[0] || 'general',
      relevance: processed.relevance,
      contentType: 'bambisleep-info',
      validated: true,
      information: processed.information
    };
    
    // Add to knowledge base
    const db = loadDB();
    
    // Check if entry already exists
    const existingIndex = db.findIndex(item => item.url === url);
    if (existingIndex !== -1) {
      // Update existing entry
      db[existingIndex] = { ...db[existingIndex], ...entry, updatedAt: new Date().toISOString() };
      saveDB(db);
      
      console.log(`[BambiSleep QA] Updated existing entry in knowledge base`);
      if (io) {
        io.emit('agent:log', { message: `Updated existing entry in knowledge base`, type: 'success' });
      }
      
      return { success: true, updated: true, entry: db[existingIndex] };
    }
    
    // Add new entry
    const id = 'kb_' + Date.now();
    const newEntry = { id, ...entry, addedAt: new Date().toISOString() };
    db.push(newEntry);
    saveDB(db);
    
    console.log(`[BambiSleep QA] Added new entry to knowledge base`);
    if (io) {
      io.emit('agent:log', { message: `Added new entry to knowledge base`, type: 'success' });
    }
    
    return { success: true, added: true, entry: newEntry };
  } catch (error) {
    console.error(`[BambiSleep QA] Error processing content: ${error.message}`);
    if (io) {
      io.emit('agent:log', { message: `Error processing content: ${error.message}`, type: 'error' });
    }
    return { success: false, error: error.message };
  }
}

/**
 * Answer a question about BambiSleep
 * @param {string} question Question to answer
 * @returns {Promise<object>} Answer object
 */
export async function answerBambiSleepQuestion(question) {
  try {
    console.log(`[BambiSleep QA] Answering question: ${question}`);
    
    // Use QA system to answer the question
    const answer = qaSystem.answerQuestion(question);
    
    // Get suggested follow-up questions
    const suggestedQuestions = qaSystem.getSuggestedQuestions(question);
    
    return {
      success: true,
      question,
      answer: answer.answer,
      citations: answer.citations,
      confidence: answer.confidence,
      suggestedQuestions
    };
  } catch (error) {
    console.error(`[BambiSleep QA] Error answering question: ${error.message}`);
    return {
      success: false,
      error: error.message,
      question,
      answer: "I couldn't answer your question due to a technical issue. Please try again later."
    };
  }
}

/**
 * Initialize the BambiSleep knowledge base with core knowledge
 * @returns {Promise<object>} Result of initialization
 */
export async function initializeBambiSleepKnowledge() {
  try {
    console.log('[BambiSleep QA] Initializing BambiSleep knowledge base with core knowledge');
    
    // Core BambiSleep URLs to fetch
    const coreUrls = [
      'https://bambisleep.info/Welcome_to_Bambi_Sleep',
      'https://bambisleep.info/Bambi_Sleep_FAQ',
      'https://bambisleep.info/BS,_Consent,_And_You',
      'https://bambisleep.info/Triggers',
      'https://bambisleep.info/Beginner%27s_Files'
    ];
    
    const results = [];
    
    // Process each URL
    for (const url of coreUrls) {
      console.log(`[BambiSleep QA] Processing core URL: ${url}`);
      const result = await fetchAndProcessBambiSleepContent(url);
      results.push(result);
    }
    
    // Build knowledge index
    knowledgeIndex.buildIndex();
    
    return {
      success: true,
      message: 'BambiSleep knowledge base initialized with core knowledge',
      results
    };
  } catch (error) {
    console.error(`[BambiSleep QA] Error initializing knowledge: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}
