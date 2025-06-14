// Intelligent Knowledge Base Agent - Content Curation & Validation

import * as cheerio from 'cheerio';
import * as knowledgeTools from './tools/knowledgeTools.js';
import * as lmstudio from '../lmstudio/client.js';

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
  audio: ['soundcloud', 'youtube', 'audio', 'mp3', 'wav'],
  guides: ['guide', 'tutorial', 'howto', 'instruction'],
  community: ['reddit', 'discord', 'forum', 'discussion'],
  tools: ['github', 'app', 'tool', 'script', 'software'],
  scripts: ['script', 'transcript', 'text', 'content', 'session']
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
    const response = await axios.get(url, { 
      timeout: 15000, // Increased timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('h1').first().text().trim() || 
                 url;
    
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('p').first().text().trim().slice(0, 200) || '';
    
    // Extract scripts and transcripts
    const scripts = extractScriptsFromHTML($, response.data);
    
    return { 
      title, 
      description, 
      contentType: response.headers['content-type'],
      scripts: scripts.length > 0 ? scripts : null
    };
  } catch (error) {
    console.error(`Metadata extraction error for ${url}:`, error.message);
    return { title: url, description: '', error: `Failed to extract metadata: ${error.message}` };
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
    // Step 1: URL Validation
    const validation = await validateURL(url);
    if (!validation.valid) {
      return { url, error: true, message: `URL validation failed: ${validation.error}` };
    }

    // Step 2: Extract metadata and scripts
    const metadata = await extractMetadata(url);
    if (metadata.error) {
      return { url, error: true, message: `Metadata extraction failed: ${metadata.error}` };
    }

    // Step 3: Advanced duplicate detection
    const existingEntries = loadDB();
    if (isAdvancedDuplicate({ url, title: metadata.title, description: metadata.description }, existingEntries)) {
      return { url, error: true, message: 'Advanced duplicate detection: Similar content already exists' };
    }    // Step 4: Calculate advanced relevance with ML-like scoring
    const relevance = calculateAdvancedRelevanceScore(metadata.title, metadata.description, url);
    console.log(`Relevance score for ${url}: ${relevance}/10 (title: "${metadata.title}", description: "${metadata.description.substring(0, 100)}...")`);
    
    if (relevance < 2) { // Lowered threshold from 3 to 2 for bambisleep.info
      return { url, error: true, message: `Low relevance score: ${relevance}/10 - Title: "${metadata.title}", Description: "${metadata.description.substring(0, 100)}..."` };
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
      validated: true,
      scripts: metadata.scripts || [] // Store extracted scripts
    };

    // Step 7: Save to knowledge base
    const db = loadDB();
    db.push(entry);
    
    // Step 8: If scripts were found, also save them as separate text entries
    if (metadata.scripts && metadata.scripts.length > 0) {
      for (const script of metadata.scripts) {
        const scriptEntry = {
          id: 'script_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          type: 'text',
          title: script.title,
          content: script.content,
          source: url,
          category: 'scripts',
          relevance: 10, // Auto-extracted scripts get high relevance
          addedAt: new Date().toISOString(),
          validated: true,
          extractedFrom: entry.id
        };
        db.push(scriptEntry);
      }
    }
    
    saveDB(db);

    const result = { success: true, entry };
    if (metadata.scripts && metadata.scripts.length > 0) {
      result.scriptsExtracted = metadata.scripts.length;
      result.message = `Content added with ${metadata.scripts.length} script(s) extracted automatically`;
    }

    return result;
  } catch (error) {
    console.error(`Error analyzing ${url}:`, error.message);
    return { url, error: true, message: `Analysis error: ${error.message}` };
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
    
    for (const post of posts.slice(0, 10)) { // Limit to 10 most recent
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
    
    const successful = results.filter(r => r.success).length;
    const errors = results.filter(r => r.error).length;
      logMessage('info', 'Content discovery completed', {
      discovered: discoveredUrls.length,
      successful,
      errors
    });

    // Send webhook notification for completed discovery
    await sendWebhookNotification('discovery:complete', {
      discovered: discoveredUrls.length,
      processed: successful,
      errors,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      discovered: discoveredUrls.length, 
      processed: successful,
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
      // Limit to 20 links to avoid overwhelming the system
    const linksToProcess = relevantLinks.slice(0, 20);
    
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
      }
        try {
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
          const result = await crawlAndAnalyze(link);
        linkResults.push(result);
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        linkResults.push({
          url: link,
          success: false,
          error: error.message
        });
      }
    }

    // Send webhook notifications for completed crawl
    await sendWebhookNotification('crawl:complete', {
      success: true,
      results: linkResults,
      summary: { totalProcessed: linksToProcess.length, successful: successCount, failed: errorCount }
    });

    // Final progress update
    if (io) {
      io.emit('crawl:progress', {
        percentage: 100,
        status: 'Complete!',
        details: `Processed ${linksToProcess.length} links: ${successCount} successful, ${errorCount} failed`,
        logMessage: `✅ Crawl complete: ${successCount} successful, ${errorCount} failed`
      });
      
      io.emit('crawl:complete', {
        success: true,
        results: linkResults,
        summary: {
          totalProcessed: linksToProcess.length,
          successful: successCount,
          failed: errorCount
        }
      });
    }    // Calculate total scripts extracted
    const totalScriptsExtracted = linkResults.reduce((total, result) => {
      if (result.success && result.scriptsExtracted) {
        return total + result.scriptsExtracted;
      }
      return total;
    }, 0);

    return {
      success: true,
      message: `Successfully processed ${successCount} out of ${linksToProcess.length} links`,
      results: linkResults,
      summary: {
        totalProcessed: linksToProcess.length,
        successful: successCount,
        failed: errorCount
      },
      linksFound: linksToProcess.length,
      added: successCount,
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
  const text = `${title} ${description} ${url}`.toLowerCase();
  
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
  const similarityThreshold = 0.8;
  
  for (const existing of existingEntries) {
    // Exact URL match
    if (newEntry.url === existing.url) {
      return true;
    }
    
    // Title similarity check
    const titleSimilarity = calculateSimilarity(newEntry.title || '', existing.title || '');
    if (titleSimilarity > similarityThreshold) {
      return true;
    }
    
    // Description similarity check
    const descSimilarity = calculateSimilarity(newEntry.description || '', existing.description || '');
    if (descSimilarity > similarityThreshold) {
      return true;
    }
    
    // Combined content similarity
    const combinedNew = `${newEntry.title} ${newEntry.description}`;
    const combinedExisting = `${existing.title} ${existing.description}`;
    const combinedSimilarity = calculateSimilarity(combinedNew, combinedExisting);
    if (combinedSimilarity > 0.7) {
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

// Export additional functions for API access
export { 
  sendWebhookNotification,
  calculateAdvancedRelevanceScore,
  isAdvancedDuplicate,
  archiveExpiredContent
};



// Get all text scripts from knowledge base
export function getTextScripts() {
  const db = loadDB();
  return db.filter(item => item.type === 'text_script')
    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
}

// Search text scripts by content
export function searchTextScripts(query) {
  const textScripts = getTextScripts();
  const queryLower = query.toLowerCase();
  
  return textScripts.filter(script => 
    script.title.toLowerCase().includes(queryLower) ||
    script.content.toLowerCase().includes(queryLower) ||
    script.description.toLowerCase().includes(queryLower)
  );
}
