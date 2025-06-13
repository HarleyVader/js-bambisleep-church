// Knowledge search tool for MCP server
import KnowledgeStorage from '../../knowledge/storage.js';
import LMStudioClient from '../../lmstudio/client.js';

const storage = new KnowledgeStorage();
const lmClient = new LMStudioClient();

export async function searchKnowledge(args) {
  try {
    const { query, type = 'text' } = args;
    
    if (!query) {
      return {
        content: [{ type: 'text', text: 'Error: Query parameter is required' }],
        isError: true
      };
    }

    // Perform basic text search
    const results = await storage.searchEntries(query);
    
    if (results.length === 0) {
      return {
        content: [{ 
          type: 'text', 
          text: `No knowledge entries found for query: "${query}"` 
        }]
      };
    }

    // Format results
    const formattedResults = results.map(entry => ({
      id: entry.id,
      title: entry.metadata.title || 'Untitled',
      content: entry.content.substring(0, 200) + (entry.content.length > 200 ? '...' : ''),
      createdAt: entry.metadata.createdAt
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          resultCount: results.length,
          results: formattedResults
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error searching knowledge: ${error.message}` }],
      isError: true
    };
  }
}

export async function addKnowledge(args) {
  try {
    const { content, title, category } = args;
    
    if (!content) {
      return {
        content: [{ type: 'text', text: 'Error: Content parameter is required' }],
        isError: true
      };
    }

    const metadata = {
      title: title || 'Untitled',
      category: category || 'general'
    };

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
      content: [{ type: 'text', text: `Error adding knowledge: ${error.message}` }],
      isError: true
    };
  }
}

export async function listKnowledge() {
  try {
    const entries = await storage.listEntries();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalEntries: entries.length,
          entries
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error listing knowledge: ${error.message}` }],
      isError: true
    };
  }
}

export async function getKnowledge(args) {
  try {
    const { id } = args;
    
    if (!id) {
      return {
        content: [{ type: 'text', text: 'Error: ID parameter is required' }],
        isError: true
      };
    }

    const entry = await storage.getEntry(id);
    
    if (!entry) {
      return {
        content: [{ 
          type: 'text', 
          text: `No knowledge entry found with ID: ${id}` 
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
      content: [{ type: 'text', text: `Error retrieving knowledge: ${error.message}` }],
      isError: true
    };
  }
}

export async function updateKnowledge(args) {
  try {
    const { id, content, title, category } = args;
    
    if (!id) {
      return {
        content: [{ type: 'text', text: 'Error: ID parameter is required' }],
        isError: true
      };
    }

    // Check if entry exists
    const existingEntry = await storage.getEntry(id);
    if (!existingEntry) {
      return {
        content: [{ 
          type: 'text', 
          text: `No knowledge entry found with ID: ${id}` 
        }],
        isError: true
      };
    }

    // Update the entry
    const updatedData = {
      content: content || existingEntry.content,
      metadata: {
        ...existingEntry.metadata,
        title: title || existingEntry.metadata.title,
        category: category || existingEntry.metadata.category,
        updatedAt: new Date().toISOString()
      }
    };

    const result = await storage.updateEntry(id, updatedData.content, updatedData.metadata);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: result.id,
          message: 'Knowledge entry updated successfully'
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error updating knowledge: ${error.message}` }],
      isError: true
    };
  }
}

export async function analyzeContext(args) {
  try {
    const { conversation, extractType = 'summary' } = args;
    
    if (!conversation) {
      return {
        content: [{ type: 'text', text: 'Error: Conversation parameter is required' }],
        isError: true
      };
    }

    let analysisPrompt = '';
    switch (extractType) {
      case 'summary':
        analysisPrompt = `Analyze this conversation and provide a concise summary of the main points and conclusions:\n\n${conversation}`;
        break;
      case 'keywords':
        analysisPrompt = `Extract the key terms, concepts, and important keywords from this conversation:\n\n${conversation}`;
        break;
      case 'facts':
        analysisPrompt = `Identify and list the concrete facts, data points, and actionable information from this conversation:\n\n${conversation}`;
        break;
      default:
        analysisPrompt = `Analyze this conversation:\n\n${conversation}`;
    }

    // Use LM Studio to analyze the context
    const analysis = await lmClient.generateCompletion(analysisPrompt, {
      maxTokens: 800,
      temperature: 0.3
    });

    if (!analysis) {
      // Fallback: simple text analysis
      const wordCount = conversation.split(' ').length;
      const sentences = conversation.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            extractType,
            wordCount,
            sentenceCount: sentences.length,
            analysis: 'LM Studio unavailable - basic analysis only',
            suggestions: ['Add this conversation as knowledge entry', 'Extract key topics manually']
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          extractType,
          analysis: analysis.trim(),
          wordCount: conversation.split(' ').length,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error analyzing context: ${error.message}` }],
      isError: true
    };
  }
}

export async function deleteKnowledge(args) {
  try {
    const { id } = args;
    
    if (!id) {
      return {
        content: [{ type: 'text', text: 'Error: ID parameter is required' }],
        isError: true
      };
    }

    const result = await storage.deleteEntry(id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          id: result.id,
          message: 'Knowledge entry deleted successfully'
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error deleting knowledge: ${error.message}` }],
      isError: true
    };
  }
}
