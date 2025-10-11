// Get Resource Recommendations MCP Tool
// Get personalized resource recommendations based on experience level and interests
import { z } from 'zod';
import { log } from '../../utils/logger.js';

export const toolName = 'resource-recommendations';

export const config = {
    title: 'Get Resource Recommendations',
    description: 'Get personalized resource recommendations based on experience level and interests',
    inputSchema: {
        experience: z.enum(['beginner', 'intermediate', 'advanced']).describe('Your experience level with BambiSleep'),
        interests: z.array(z.string()).optional().describe('Specific interests or topics'),
        safetyFocus: z.boolean().optional().describe('Prioritize safety-focused resources')
    },
    outputSchema: {
        recommendations: z.array(z.object({
            title: z.string(),
            description: z.string(),
            url: z.string(),
            category: z.string(),
            suitability: z.string(),
            safetyRating: z.number()
        })),
        experienceLevel: z.string(),
        totalRecommendations: z.number()
    }
};

export async function handler({ experience, interests = [], safetyFocus = false }, context = {}) {
    try {
        const { knowledgeData = [] } = context;
        let recommendations = [...knowledgeData];

        // Filter by experience level
        if (experience === 'beginner') {
            recommendations = recommendations.filter(item =>
                item.category === 'safety' ||
                item.title?.toLowerCase().includes('beginner') ||
                item.title?.toLowerCase().includes('intro') ||
                item.description?.toLowerCase().includes('beginner')
            );
        }

        // Filter by interests if provided
        if (interests.length > 0) {
            recommendations = recommendations.filter(item =>
                interests.some(interest =>
                    item.title?.toLowerCase().includes(interest.toLowerCase()) ||
                    item.description?.toLowerCase().includes(interest.toLowerCase()) ||
                    item.category?.toLowerCase().includes(interest.toLowerCase())
                )
            );
        }

        // Prioritize safety resources if requested
        if (safetyFocus) {
            recommendations.sort((a, b) => {
                const aIsSafety = a.category === 'safety' ? 1 : 0;
                const bIsSafety = b.category === 'safety' ? 1 : 0;
                return bIsSafety - aIsSafety;
            });
        }

        // Add suitability and safety ratings
        recommendations = recommendations.slice(0, 8).map(item => ({
            ...item,
            suitability: getSuitabilityForExperience(item, experience),
            safetyRating: getSafetyRating(item)
        }));

        const output = {
            recommendations: recommendations,
            experienceLevel: experience,
            totalRecommendations: recommendations.length
        };

        return {
            content: [{
                type: 'text',
                text: `Resource Recommendations for ${experience.toUpperCase()} Level\n\n` +
                    recommendations.map((r, i) =>
                        `${i + 1}. ${r.title}\n   ${r.description}\n   Safety: ${r.safetyRating}/5 | ${r.suitability}\n`
                    ).join('\n')
            }],
            structuredContent: output
        };

    } catch (error) {
        log.error(`Resource recommendations tool error: ${error.message}`);
        return {
            content: [{
                type: 'text',
                text: `Failed to get recommendations: ${error.message}`
            }],
            isError: true
        };
    }
}

/**
 * Helper function to determine suitability for experience level
 */
function getSuitabilityForExperience(item, experience) {
    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';

    if (experience === 'beginner') {
        if (title.includes('advanced') || description.includes('advanced')) return 'Advanced - approach with caution';
        if (item.category === 'safety') return 'Highly recommended for beginners';
        if (title.includes('intro') || title.includes('beginner')) return 'Perfect for beginners';
        return 'Suitable with proper preparation';
    }

    if (experience === 'intermediate') {
        if (title.includes('beginner')) return 'Good for review';
        if (title.includes('advanced')) return 'Ready to explore';
        return 'Well-suited for your level';
    }

    // Advanced
    return 'Suitable for experienced practitioners';
}

/**
 * Helper function to calculate safety rating
 */
function getSafetyRating(item) {
    let rating = 3; // Default neutral rating

    const title = item.title?.toLowerCase() || '';
    const description = item.description?.toLowerCase() || '';

    // Increase rating for safety-focused content
    if (item.category === 'safety') rating += 2;
    if (title.includes('safety') || description.includes('safety')) rating += 1;
    if (title.includes('guide') || description.includes('guide')) rating += 1;

    // Decrease rating for potentially risky content
    if (title.includes('extreme') || description.includes('extreme')) rating -= 2;
    if (title.includes('advanced') || description.includes('advanced')) rating -= 1;

    return Math.max(1, Math.min(5, rating));
}

export default {
    toolName,
    config,
    handler
};
