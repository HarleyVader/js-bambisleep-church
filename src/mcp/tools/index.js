// BambiSleep Church MCP Tools Index
// Consolidated tool exports for the complete agentic system

import { bambiTools } from './bambi-tools.js';
import { mongodbTools } from './mongodb/mongodbTools.js';
import { lmstudioTools } from './lmstudio/lmstudioTools.js';
// Temporarily disabled during Mother Brain system upgrade
// import { agenticTools } from './agentic/agenticTools.js';
import { motherBrainTools } from './motherBrain/motherBrainTools.js';

// Import crawler tools if available (graceful fallback)
let crawlerTools = [];
try {
    const { crawlerTools: importedCrawlerTools } = await import('./crawler/crawlerTools.js');
    crawlerTools = importedCrawlerTools;
} catch (error) {
    console.warn('⚠️ Crawler tools not available:', error.message);
}

// Combine all tool collections
export const allTools = [
    ...Object.values(bambiTools),      // 5 BambiSleep community tools
    ...mongodbTools,                   // 15 MongoDB management tools
    ...lmstudioTools,                  // 10 LMStudio AI tools
    ...crawlerTools,                   // Web crawler tools (if available)
    // Temporarily disabled during Mother Brain system upgrade
    // ...agenticTools,                   // 7 Agentic orchestration tools
    ...Object.values(motherBrainTools) // 5 MOTHER BRAIN spider tools
];

// Tool categories for organization
export const toolCategories = {
    bambi: Object.values(bambiTools),
    mongodb: mongodbTools,
    lmstudio: lmstudioTools,
    crawler: crawlerTools,
    agentic: agenticTools,
    motherBrain: Object.values(motherBrainTools)
};

// Total count validation
export const TOOL_COUNTS = {
    bambi: 5,
    mongodb: 15,
    lmstudio: 10,
    crawler: 6,
    agentic: 7,
    motherBrain: 5,
    total: 48  // 5 + 15 + 10 + 6 + 7 + 5 = 48 total tools
};

// Tool descriptions
export const TOOL_DESCRIPTIONS = {
    bambi: 'Community-focused BambiSleep tools for knowledge search, safety checking, content recommendations, script analysis, and trigger warnings',
    mongodb: 'Complete MongoDB management including CRUD operations, aggregation, indexing, schema analysis, and database administration',
    lmstudio: 'LMStudio AI integration for content analysis, completion, embeddings, summarization, and safety assessment',
    crawler: 'Web crawling system for content discovery, extraction, processing, link analysis, batch operations, and session management',
    agentic: 'Autonomous orchestration system using AI brain to control and coordinate all services for intelligent knowledge base building'
};

// Get tools by category
export function getToolsByCategory(category) {
    return toolCategories[category] || [];
}

// Get all tool names
export function getAllToolNames() {
    return allTools.map(tool => tool.name);
}

// Get tool by name
export function getToolByName(name) {
    return allTools.find(tool => tool.name === name);
}

// Validate tool counts
export function validateToolCounts() {
    const actualCounts = {
        bambi: Object.values(bambiTools).length,
        mongodb: mongodbTools.length,
        lmstudio: lmstudioTools.length,
        crawler: crawlerTools.length,
        agentic: agenticTools.length,
        total: allTools.length
    };

    const isValid = Object.keys(TOOL_COUNTS).every(
        category => actualCounts[category] === TOOL_COUNTS[category]
    );

    return {
        isValid,
        expected: TOOL_COUNTS,
        actual: actualCounts,
        summary: `Expected ${TOOL_COUNTS.total} tools, found ${actualCounts.total} tools`
    };
}

// Export individual collections for direct import
export {
    bambiTools,
    mongodbTools,
    lmstudioTools,
    crawlerTools,
    agenticTools
};

// Default export
export default allTools;
