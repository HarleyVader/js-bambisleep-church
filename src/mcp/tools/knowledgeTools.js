// Knowledge management tools for MCP server
import KnowledgeStorage from '../../knowledge/storage.js';
import LMStudioClient from '../../lmstudio/client.js';
import { crawlLinks, crawlMetadataBatch } from './urlCrawler.js';
import { analyzeUrls } from './urlAnalyzer.js';
import { convertAnalysisToUrls } from '../../utils/urlUpdater.js';

const storage = new KnowledgeStorage();
const lmStudio = new LMStudioClient();

// Search knowledge entries
export async function searchKnowledge(args) {
  try {
    const { query } = args;
    const results = await storage.searchEntries(query);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          resultsFound: results.length,
          results: results.map(r => ({
            id: r.id,
            title: r.metadata.title || 'Untitled',
            content: r.content.substring(0, 200) + '...',
            createdAt: r.metadata.createdAt
          }))
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error searching knowledge: ${error.message}`
      }]
    };
  }
}

// Add new knowledge entry
export async function addKnowledge(args) {
  try {
    const { content, title, category, tags } = args;
    const metadata = { title, category, tags };
    const result = await storage.addEntry(content, metadata);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: result.id,
          message: 'Knowledge entry added successfully'
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error adding knowledge: ${error.message}`
      }]
    };
  }
}

// List all knowledge entries
export async function listKnowledge() {
  try {
    const entries = await storage.listEntries();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalEntries: entries.length,
          entries: entries.map(e => ({
            id: e.id,
            title: e.metadata.title || 'Untitled',
            category: e.metadata.category,
            createdAt: e.metadata.createdAt
          }))
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error listing knowledge: ${error.message}`
      }]
    };
  }
}

// Get specific knowledge entry
export async function getKnowledge(args) {
  try {
    const { id } = args;
    const entry = await storage.getEntry(id);
    
    if (!entry) {
      return {
        content: [{
          type: 'text',
          text: `Knowledge entry with id ${id} not found`
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(entry, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error getting knowledge: ${error.message}`
      }]
    };
  }
}

// Update knowledge entry
export async function updateKnowledge(args) {
  try {
    const { id, content, title, category, tags } = args;
    const result = await storage.updateEntry(id, content, { title, category, tags });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.success,
          message: 'Knowledge entry updated successfully'
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error updating knowledge: ${error.message}`
      }]
    };
  }
}

// Analyze context using LM Studio
export async function analyzeContext(args) {
  try {
    const { text, context } = args;
    const prompt = `Analyze the following text and provide insights: ${text}${context ? `\n\nContext: ${context}` : ''}`;
    
    const analysis = await lmStudio.generateCompletion(prompt, { maxTokens: 300 });
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          analysis: analysis || 'Analysis unavailable',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error analyzing context: ${error.message}`
      }]
    };
  }
}

// Delete knowledge entry
export async function deleteKnowledge(args) {
  try {
    const { id } = args;
    const result = await storage.deleteEntry(id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: result.success,
          message: 'Knowledge entry deleted successfully'
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error deleting knowledge: ${error.message}`
      }]
    };
  }
}

// Agent: Crawl, analyze, get metadata, update URLs, build knowledge base
export async function agentBuildKnowledgeBase({ seedUrl, domainFilter = null }) {
  // 1. Crawl links from the seed URL
  const crawlResult = await crawlLinks(seedUrl, domainFilter);
  if (crawlResult.status !== 'success' || !crawlResult.links) {
    return { error: 'Failed to crawl links', details: crawlResult };
  }
  const urls = crawlResult.links.map(l => l.url);

  // 2. Batch crawl metadata for all URLs
  const metadataBatch = await crawlMetadataBatch(urls);
  if (metadataBatch.status !== 'success') {
    return { error: 'Failed to crawl metadata', details: metadataBatch };
  }

  // 3. Analyze URLs for structured info
  const analysis = await analyzeUrls(urls);

  // 4. Convert analysis to frontend-compatible URLs
  const urlInfos = convertAnalysisToUrls(analysis);

  // 5. Store each URL info as a knowledge entry
  const added = [];
  for (const info of urlInfos) {
    const { url, title, description, type, platform, metadata } = info;
    const content = description || '';
    const entryMeta = { title, type, platform, url, ...metadata };
    try {
      const result = await storage.addEntry(content, entryMeta);
      added.push(result.id);
    } catch (e) {
      // skip failed adds
    }
  }

  return {
    status: 'complete',
    crawled: urls.length,
    added: added.length,
    knowledgeIds: added
  };
}
