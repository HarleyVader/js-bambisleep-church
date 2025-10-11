// Search Knowledge Base MCP Tool
// Search the BambiSleep knowledge base for resources and information
import { z } from 'zod';
import { log } from '../../utils/logger.js';

export const toolName = 'search-knowledge';

export const config = {
    title: 'Search Knowledge Base',
    description: 'Search the BambiSleep knowledge base for resources and information',
    inputSchema: {
        query: z.string().describe('Search query for knowledge base'),
        category: z.enum(['all', 'official', 'community', 'scripts', 'safety']).optional().describe('Filter by category'),
        limit: z.number().max(20).optional().describe('Maximum number of results')
    },
    outputSchema: {
        results: z.array(z.object({
            title: z.string(),
            description: z.string(),
            url: z.string(),
            category: z.string(),
            relevance: z.number()
        })),
        total: z.number(),
        searchTerm: z.string()
    }
};

export async function handler({ query, category = 'all', limit = 10 }, context = {}) {
    try {
        const { knowledgeData = [] } = context;
        const searchTerm = query.toLowerCase();
        let filtered = knowledgeData;

        // Filter by category if specified
        if (category !== 'all') {
            filtered = filtered.filter(item => item.category === category);
        }

        // Search in title, description, and tags
        const results = filtered.filter(item => {
            return item.title?.toLowerCase().includes(searchTerm) ||
                item.description?.toLowerCase().includes(searchTerm) ||
                item.category?.toLowerCase().includes(searchTerm) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        }).slice(0, limit);

        // Calculate relevance scores
        results.forEach(item => {
            let score = 0;
            if (item.title?.toLowerCase().includes(searchTerm)) score += 3;
            if (item.description?.toLowerCase().includes(searchTerm)) score += 2;
            if (item.category?.toLowerCase().includes(searchTerm)) score += 1;
            if (item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) score += 1;
            item.relevance = score;
        });

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        const output = {
            results: results,
            total: results.length,
            searchTerm: query
        };

        return {
            content: [{
                type: 'text',
                text: `Found ${results.length} results for "${query}"\n\n` +
                    results.map(r => `• ${r.title}: ${r.description}`).join('\n')
            }],
            structuredContent: output
        };

    } catch (error) {
        log.error(`Search knowledge tool error: ${error.message}`);
        return {
            content: [{
                type: 'text',
                text: `Search failed: ${error.message}`
            }],
            isError: true
        };
    }
}

export default {
    toolName,
    config,
    handler
};
