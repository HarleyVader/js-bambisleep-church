// Get Safety Information MCP Tool
// Get important safety information and best practices for BambiSleep
import { z } from 'zod';
import { log } from '../../utils/logger.js';

export const toolName = 'get-safety-info';

export const config = {
    title: 'Get Safety Information',
    description: 'Get important safety information and best practices for BambiSleep',
    inputSchema: {
        topic: z.enum(['general', 'beginners', 'triggers', 'consent', 'aftercare', 'limits']).optional().describe('Specific safety topic')
    },
    outputSchema: {
        topic: z.string(),
        guidelines: z.array(z.string()),
        resources: z.array(z.object({
            title: z.string(),
            url: z.string(),
            description: z.string()
        }))
    }
};

export async function handler({ topic = 'general' }, context = {}) {
    try {
        const { knowledgeData = [] } = context;

        const safetyInfo = {
            general: {
                guidelines: [
                    "Always listen to content in a safe, private environment",
                    "Never listen while driving or operating machinery",
                    "Maintain awareness of your limits and boundaries",
                    "Take breaks between sessions",
                    "Stay hydrated and maintain good physical health"
                ]
            },
            beginners: {
                guidelines: [
                    "Start with lighter, introductory content",
                    "Learn about hypnosis and how it works",
                    "Establish clear personal boundaries before starting",
                    "Consider having a trusted friend aware of your interests",
                    "Keep a journal of your experiences"
                ]
            },
            triggers: {
                guidelines: [
                    "Understand that triggers can have lasting effects",
                    "Only accept triggers you consciously want",
                    "Learn techniques to remove unwanted triggers",
                    "Be cautious with conditioning content",
                    "Consider the long-term impact of changes"
                ]
            },
            consent: {
                guidelines: [
                    "Consent must be informed, enthusiastic, and ongoing",
                    "You have the right to stop at any time",
                    "Communicate boundaries clearly with any partners",
                    "Regular check-ins are essential in relationships",
                    "Consent can be withdrawn at any time"
                ]
            },
            aftercare: {
                guidelines: [
                    "Take time to ground yourself after sessions",
                    "Drink water and have a light snack",
                    "Reflect on the experience in a journal",
                    "Seek support if you feel overwhelmed",
                    "Practice self-care and emotional regulation"
                ]
            },
            limits: {
                guidelines: [
                    "Set clear boundaries before engaging with content",
                    "Respect your own limits and those of others",
                    "Communicate limits clearly in any interactions",
                    "Regular self-assessment of comfort levels",
                    "Know when to seek professional help"
                ]
            }
        };

        const info = safetyInfo[topic] || safetyInfo.general;

        // Find relevant safety resources from knowledge base
        const safetyResources = knowledgeData
            .filter(item => item.category === 'safety' ||
                item.title?.toLowerCase().includes('safety') ||
                item.description?.toLowerCase().includes('safety'))
            .slice(0, 5)
            .map(item => ({
                title: item.title,
                url: item.url,
                description: item.description
            }));

        const output = {
            topic: topic,
            guidelines: info.guidelines,
            resources: safetyResources
        };

        return {
            content: [{
                type: 'text',
                text: `Safety Information - ${topic.toUpperCase()}\n\n` +
                    `Guidelines:\n${info.guidelines.map(g => `• ${g}`).join('\n')}\n\n` +
                    `Resources:\n${safetyResources.map(r => `• ${r.title}: ${r.description}`).join('\n')}`
            }],
            structuredContent: output
        };

    } catch (error) {
        log.error(`Safety info tool error: ${error.message}`);
        return {
            content: [{
                type: 'text',
                text: `Failed to get safety information: ${error.message}`
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
