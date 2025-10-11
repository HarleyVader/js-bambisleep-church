// Get Community Guidelines MCP Tool
// Retrieve community guidelines and code of conduct for BambiSleep Church
import { z } from 'zod';
import { log } from '../../utils/logger.js';

export const toolName = 'community-guidelines';

export const config = {
    title: 'Get Community Guidelines',
    description: 'Retrieve community guidelines and code of conduct for BambiSleep Church',
    inputSchema: {
        section: z.enum(['all', 'conduct', 'participation', 'safety', 'moderation']).optional().describe('Specific guideline section')
    },
    outputSchema: {
        guidelines: z.object({
            section: z.string(),
            rules: z.array(z.string()),
            principles: z.array(z.string())
        })
    }
};

export async function handler({ section = 'all' }, context = {}) {
    try {
        const allGuidelines = {
            conduct: {
                rules: [
                    "Treat all community members with respect and dignity",
                    "No harassment, discrimination, or harmful behavior",
                    "Maintain appropriate boundaries in all interactions",
                    "Report concerning behavior to community moderators",
                    "Follow platform-specific rules and terms of service"
                ],
                principles: [
                    "Consent and safety are paramount",
                    "Diversity and inclusion are valued",
                    "Open and honest communication is encouraged",
                    "Personal growth and spiritual development are supported"
                ]
            },
            participation: {
                rules: [
                    "Participate authentically and honestly",
                    "Contribute constructively to discussions",
                    "Share knowledge and experiences responsibly",
                    "Support fellow community members",
                    "Respect different levels of experience and comfort"
                ],
                principles: [
                    "Everyone's journey is unique and valid",
                    "Learning and growth happen at different paces",
                    "Community support enhances individual practice",
                    "Sharing knowledge strengthens the community"
                ]
            },
            safety: {
                rules: [
                    "Never pressure others to engage in activities they're uncomfortable with",
                    "Provide content warnings for potentially triggering material",
                    "Encourage safe practices and risk awareness",
                    "Support those seeking help or expressing concerns",
                    "Maintain confidentiality of personal information"
                ],
                principles: [
                    "Physical and psychological safety come first",
                    "Informed consent is required for all activities",
                    "Support and aftercare are community responsibilities",
                    "Professional help should be sought when needed"
                ]
            },
            moderation: {
                rules: [
                    "Follow moderator guidance and decisions",
                    "Appeal decisions through appropriate channels",
                    "Report violations promptly and accurately",
                    "Cooperate with community investigations",
                    "Accept consequences for guideline violations"
                ],
                principles: [
                    "Fair and consistent enforcement",
                    "Transparency in moderation decisions",
                    "Rehabilitation over punishment when appropriate",
                    "Community input on guideline development"
                ]
            }
        };

        let guidelines;
        if (section === 'all') {
            const allRules = [];
            const allPrinciples = [];

            Object.values(allGuidelines).forEach(g => {
                allRules.push(...g.rules);
                allPrinciples.push(...g.principles);
            });

            guidelines = {
                section: 'all',
                rules: allRules,
                principles: allPrinciples
            };
        } else {
            guidelines = {
                section: section,
                ...allGuidelines[section]
            };
        }

        return {
            content: [{
                type: 'text',
                text: `Community Guidelines - ${section.toUpperCase()}\n\n` +
                    `Rules:\n${guidelines.rules.map(r => `• ${r}`).join('\n')}\n\n` +
                    `Principles:\n${guidelines.principles.map(p => `• ${p}`).join('\n')}`
            }],
            structuredContent: { guidelines }
        };

    } catch (error) {
        log.error(`Community guidelines tool error: ${error.message}`);
        return {
            content: [{
                type: 'text',
                text: `Failed to get community guidelines: ${error.message}`
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
