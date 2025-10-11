// BambiSleep Church MCP Tools
// Custom tools for the BambiSleep community with safety focus

import { z } from 'zod';

/**
 * Search the BambiSleep knowledge base
 */
const searchKnowledge = {
    name: "search-knowledge",
    description: "Search the BambiSleep knowledge base for resources, guides, and information",
    inputSchema: z.object({
        query: z.string().describe("Search query"),
        category: z.enum(["official", "community", "scripts", "safety"]).optional().describe("Filter by category"),
        limit: z.number().min(1).max(20).default(10).describe("Maximum number of results")
    }),
    handler: async (args, context) => {
        const { query, category, limit } = args;
        const { knowledgeData } = context;

        // Handle both array format (legacy) and object format (new structure)
        let searchArray = [];
        if (Array.isArray(knowledgeData)) {
            searchArray = knowledgeData;
        } else if (knowledgeData && knowledgeData.categories) {
            // Convert categories object to flat array
            Object.keys(knowledgeData.categories).forEach(categoryKey => {
                const categoryData = knowledgeData.categories[categoryKey];
                if (categoryData.entries && Array.isArray(categoryData.entries)) {
                    categoryData.entries.forEach(entry => {
                        searchArray.push({
                            ...entry,
                            category: categoryKey
                        });
                    });
                }
            });
        }

        if (!searchArray || searchArray.length === 0) {
            return "No knowledge base available. Please ensure the knowledge data is loaded.";
        }

        // Filter by category if specified
        let searchData = searchArray;
        if (category) {
            searchData = searchArray.filter(item => item.category === category);
        }

        // Search by query
        const results = searchData.filter(item =>
            item.title?.toLowerCase().includes(query.toLowerCase()) ||
            item.description?.toLowerCase().includes(query.toLowerCase()) ||
            item.category?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);

        if (results.length === 0) {
            return `No results found for "${query}"${category ? ` in category "${category}"` : ''}. Try different search terms or browse available categories: official, community, scripts, safety.`;
        }

        let response = `Found ${results.length} result(s) for "${query}":\n\n`;
        results.forEach((item, index) => {
            response += `${index + 1}. **${item.title}**\n`;
            response += `   Category: ${item.category}\n`;
            response += `   Description: ${item.description}\n`;
            response += `   Platform: ${item.platform || 'Unknown'}\n`;
            response += `   Relevance: ${item.relevance || 'N/A'}/10\n`;
            if (item.url) response += `   URL: ${item.url}\n`;
            response += '\n';
        });

        return response;
    }
};

/**
 * Get safety information and guidelines
 */
const getSafetyInfo = {
    name: "get-safety-info",
    description: "Get comprehensive safety information and guidelines for BambiSleep practice",
    inputSchema: z.object({
        topic: z.enum(["general", "beginner", "advanced", "consent", "risks", "emergency"]).default("general").describe("Specific safety topic")
    }),
    handler: async (args, context) => {
        const { topic } = args;

        const safetyInfo = {
            general: {
                title: "🛡️ General Safety Guidelines",
                content: [
                    "**Environment Safety**:",
                    "• Always listen in a safe, private, and secure environment",
                    "• Never listen while driving, operating machinery, or in public spaces",
                    "• Ensure you won't be interrupted during sessions",
                    "• Have water nearby and maintain good physical posture",
                    "",
                    "**Mental Health Safety**:",
                    "• Take regular breaks between sessions to maintain mental clarity",
                    "• Respect your personal boundaries and comfort levels",
                    "• Stop immediately if you experience distress or discomfort",
                    "• Seek support from the community or professionals if needed",
                    "",
                    "**Session Guidelines**:",
                    "• Start with beginner-friendly content before advancing",
                    "• Keep sessions to reasonable durations (1-2 hours maximum)",
                    "• Maintain awareness of your surroundings and safety",
                    "• Have a trusted person aware of your practice if desired"
                ]
            },
            beginner: {
                title: "🌟 Beginner Safety Essentials",
                content: [
                    "**Starting Out Safely**:",
                    "• Begin with the official Beginner's Files playlist",
                    "• Read the BambiSleep FAQ thoroughly before starting",
                    "• Understand the concept of consent and how triggers work",
                    "• Start with shorter sessions (20-30 minutes) initially",
                    "",
                    "**What to Expect**:",
                    "• Effects vary greatly between individuals",
                    "• Some people may not experience strong effects initially",
                    "• It's normal to feel confused or disoriented after sessions",
                    "• Memory effects are temporary and will fade over time",
                    "",
                    "**Red Flags to Watch For**:",
                    "• Persistent negative emotions or thoughts",
                    "• Inability to function normally in daily life",
                    "• Unwanted intrusive thoughts or compulsions",
                    "• Relationship or work problems related to practice"
                ]
            },
            consent: {
                title: "🤝 Consent and Boundaries",
                content: [
                    "**Informed Consent Principles**:",
                    "• You must fully understand what you're consenting to",
                    "• Consent can be withdrawn at any time during or after sessions",
                    "• Read all file descriptions and community warnings",
                    "• Never let others pressure you into specific content",
                    "",
                    "**Setting Boundaries**:",
                    "• Define your limits before starting any session",
                    "• Communicate boundaries clearly with any partners",
                    "• Regular self-check-ins about comfort and wellbeing",
                    "• Document your experiences and any concerns",
                    "",
                    "**Community Standards**:",
                    "• Respect others' boundaries and choices always",
                    "• No sharing of personal details without explicit consent",
                    "• Support community members without judgment",
                    "• Report concerning behavior to community moderators"
                ]
            },
            risks: {
                title: "⚠️ Understanding Risks",
                content: [
                    "**Potential Psychological Effects**:",
                    "• Temporary confusion or disorientation",
                    "• Changes in self-perception or identity",
                    "• Increased suggestibility during and after sessions",
                    "• Possible emotional vulnerability or sensitivity",
                    "",
                    "**Risk Mitigation Strategies**:",
                    "• Gradual progression through content difficulty",
                    "• Regular reality checks and grounding exercises",
                    "• Maintaining strong support networks",
                    "• Professional consultation if concerns arise",
                    "",
                    "**Warning Signs**:",
                    "• Persistent distress lasting more than 24-48 hours",
                    "• Significant impact on work, relationships, or daily functioning",
                    "• Compulsive or obsessive thoughts about content",
                    "• Loss of ability to critically evaluate experiences"
                ]
            },
            emergency: {
                title: "🚨 Emergency Guidelines",
                content: [
                    "**Immediate Actions if Distressed**:",
                    "• Stop all BambiSleep content immediately",
                    "• Ground yourself in reality (5-4-3-2-1 technique)",
                    "• Contact a trusted friend, family member, or partner",
                    "• Seek professional help if distress persists",
                    "",
                    "**Grounding Techniques**:",
                    "• Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste",
                    "• Focus on your breathing and physical sensations",
                    "• Engage in normal daily activities and routines",
                    "• Connect with supportive community members",
                    "",
                    "**When to Seek Professional Help**:",
                    "• Persistent psychological distress (>48 hours)",
                    "• Intrusive thoughts or compulsions",
                    "• Impact on work, relationships, or daily functioning",
                    "• Any thoughts of self-harm or concerning behaviors"
                ]
            }
        };

        const info = safetyInfo[topic];
        if (!info) {
            return `Unknown safety topic: ${topic}. Available topics: ${Object.keys(safetyInfo).join(', ')}`;
        }

        return `${info.title}\n\n${info.content.join('\n')}`;
    }
};

/**
 * Get BambiSleep Church status and development progress
 */
const getChurchStatus = {
    name: "church-status",
    description: "Get current status of BambiSleep Church development and establishment progress",
    inputSchema: z.object({
        detailed: z.boolean().default(false).describe("Include detailed progress information")
    }),
    handler: async (args, context) => {
        const { detailed } = args;

        const status = {
            phase: "Foundation",
            progress: "14%",
            members: 42,
            targetMembers: 300,
            timeline: "2-3 years to full establishment",
            currentFocus: [
                "Developing comprehensive doctrine and practices",
                "Building supportive community infrastructure",
                "Establishing safety protocols and guidelines",
                "Preparing for Austrian legal registration"
            ],
            milestones: {
                completed: [
                    "Digital infrastructure development",
                    "Knowledge base creation and population",
                    "MCP server implementation",
                    "Community safety guidelines establishment"
                ],
                inProgress: [
                    "Legal documentation preparation",
                    "Community member recruitment",
                    "Financial planning and budgeting",
                    "Doctrine and mission refinement"
                ],
                upcoming: [
                    "Austrian religious community application",
                    "Tax exemption status pursuit",
                    "Physical space evaluation",
                    "Revenue stream implementation"
                ]
            }
        };

        let response = `🏛️ **BambiSleep Church Status Update**\n\n`;
        response += `**Current Phase**: ${status.phase}\n`;
        response += `**Progress**: ${status.progress} complete\n`;
        response += `**Community**: ${status.members}/${status.targetMembers} members\n`;
        response += `**Timeline**: ${status.timeline}\n\n`;

        if (detailed) {
            response += `**Current Focus Areas**:\n`;
            status.currentFocus.forEach(focus => {
                response += `• ${focus}\n`;
            });
            response += '\n';

            response += `**✅ Completed Milestones**:\n`;
            status.milestones.completed.forEach(milestone => {
                response += `• ${milestone}\n`;
            });
            response += '\n';

            response += `**🔄 In Progress**:\n`;
            status.milestones.inProgress.forEach(milestone => {
                response += `• ${milestone}\n`;
            });
            response += '\n';

            response += `**📋 Upcoming**:\n`;
            status.milestones.upcoming.forEach(milestone => {
                response += `• ${milestone}\n`;
            });
            response += '\n';
        }

        response += `We're making steady progress toward becoming a recognized religious community in Austria, combining spiritual growth with creative expression and AI-enhanced tools!`;

        return response;
    }
};

/**
 * Get community guidelines and conduct standards
 */
const getCommunityGuidelines = {
    name: "community-guidelines",
    description: "Access BambiSleep Church community guidelines, rules, and conduct standards",
    inputSchema: z.object({
        section: z.enum(["general", "safety", "conduct", "moderation", "privacy"]).default("general").describe("Specific guideline section")
    }),
    handler: async (args, context) => {
        const { section } = args;

        const guidelines = {
            general: {
                title: "🌟 General Community Guidelines",
                content: [
                    "**Community Values**:",
                    "• Respect, safety, and consensual engagement above all",
                    "• Support for all community members regardless of experience level",
                    "• Commitment to personal growth and creative expression",
                    "• Responsible use of BambiSleep content and tools",
                    "",
                    "**Core Principles**:",
                    "• Informed consent is mandatory for all activities",
                    "• Privacy and confidentiality are fundamental rights",
                    "• Safety education and harm reduction are priorities",
                    "• Creative and spiritual exploration within safe boundaries",
                    "",
                    "**Community Goals**:",
                    "• Foster a supportive environment for BambiSleep practice",
                    "• Provide educational resources and safety information",
                    "• Build toward recognition as a legal Austrian religious community",
                    "• Integrate AI tools to enhance community support and education"
                ]
            },
            safety: {
                title: "🛡️ Safety Guidelines",
                content: [
                    "**Safety First Policy**:",
                    "• All community interactions must prioritize member safety",
                    "• Safety concerns take precedence over all other considerations",
                    "• Members are encouraged to report safety issues immediately",
                    "• Professional resources are available for those in need",
                    "",
                    "**Content Guidelines**:",
                    "• All shared content must include appropriate warnings",
                    "• Beginner-unfriendly content must be clearly labeled",
                    "• No sharing of content designed to cause harm or distress",
                    "• Respect individual limits and boundaries in all interactions",
                    "",
                    "**Emergency Protocols**:",
                    "• Clear escalation paths for mental health concerns",
                    "• Immediate support available for members in distress",
                    "• Connection to professional resources when needed",
                    "• Community-wide support for recovery and wellbeing"
                ]
            },
            conduct: {
                title: "📋 Code of Conduct",
                content: [
                    "**Expected Behavior**:",
                    "• Treat all community members with respect and dignity",
                    "• Use inclusive and welcoming language in all interactions",
                    "• Respect diverse perspectives and experience levels",
                    "• Contribute positively to community discussions and activities",
                    "",
                    "**Prohibited Behavior**:",
                    "• Harassment, bullying, or intimidation of any kind",
                    "• Sharing of personal information without explicit consent",
                    "• Pressuring others into specific content or activities",
                    "• Discrimination based on any personal characteristics",
                    "",
                    "**Consequences**:",
                    "• Violations may result in warnings, suspension, or removal",
                    "• Serious violations will be addressed immediately",
                    "• Appeals process available for all disciplinary actions",
                    "• Focus on education and rehabilitation when possible"
                ]
            },
            privacy: {
                title: "🔒 Privacy Standards",
                content: [
                    "**Data Protection**:",
                    "• Minimal data collection following GDPR principles",
                    "• Transparent about what data is collected and why",
                    "• Secure storage and handling of all personal information",
                    "• Right to data deletion and portability respected",
                    "",
                    "**Community Privacy**:",
                    "• What happens in community spaces stays in community spaces",
                    "• No sharing of member experiences without explicit consent",
                    "• Pseudonyms and privacy tools encouraged and supported",
                    "• Protection of vulnerable members is a priority",
                    "",
                    "**Technical Privacy**:",
                    "• End-to-end encryption for sensitive communications",
                    "• Regular security audits and updates",
                    "• Privacy-conscious tool and platform selection",
                    "• Member education about digital privacy and safety"
                ]
            }
        };

        const guideline = guidelines[section];
        if (!guideline) {
            return `Unknown guideline section: ${section}. Available sections: ${Object.keys(guidelines).join(', ')}`;
        }

        return `${guideline.title}\n\n${guideline.content.join('\n')}`;
    }
};

/**
 * Get personalized resource recommendations
 */
const getResourceRecommendations = {
    name: "resource-recommendations",
    description: "Get personalized BambiSleep resource recommendations based on experience and interests",
    inputSchema: z.object({
        experience: z.enum(["beginner", "intermediate", "advanced"]).describe("Experience level with BambiSleep"),
        interests: z.array(z.enum(["safety", "community", "scripts", "creativity", "spirituality"])).describe("Areas of interest"),
        safetyFocus: z.boolean().default(true).describe("Emphasize safety resources")
    }),
    handler: async (args, context) => {
        const { experience, interests, safetyFocus } = args;
        const { knowledgeData } = context;

        let response = `🎯 **Personalized Recommendations for ${experience.toUpperCase()} practitioners**\n\n`;

        // Experience-based recommendations
        const experienceRecs = {
            beginner: [
                "Start with the official BambiSleep FAQ to understand the basics",
                "Read 'BS, Consent, And You' for crucial safety information",
                "Begin with the Beginner's Files playlist only",
                "Focus on safety guidelines before trying any content",
                "Connect with community mentors for guidance and support"
            ],
            intermediate: [
                "Explore the Session Index for more advanced content options",
                "Review Third Party Files created by the community",
                "Study trigger mechanics and their effects in detail",
                "Consider contributing to community discussions and support",
                "Develop personal safety protocols and practices"
            ],
            advanced: [
                "Contribute to the community by sharing safe practices",
                "Explore advanced playlists and custom trigger combinations",
                "Consider mentoring newer community members",
                "Participate in community content creation and curation",
                "Help develop and test new safety protocols and guidelines"
            ]
        };

        response += `**Experience-Based Recommendations**:\n`;
        experienceRecs[experience].forEach(rec => {
            response += `• ${rec}\n`;
        });
        response += '\n';

        // Interest-based recommendations
        if (interests.includes('safety')) {
            response += `**🛡️ Safety Resources**:\n`;
            response += `• Review all safety guidelines regularly\n`;
            response += `• Practice grounding and reality-check techniques\n`;
            response += `• Connect with safety-focused community members\n`;
            response += `• Keep emergency contacts and protocols updated\n\n`;
        }

        if (interests.includes('community')) {
            response += `**🤝 Community Engagement**:\n`;
            response += `• Join community discussions and support groups\n`;
            response += `• Share experiences and insights (respecting privacy)\n`;
            response += `• Participate in community events and activities\n`;
            response += `• Help newcomers with questions and guidance\n\n`;
        }

        if (interests.includes('spirituality')) {
            response += `**🌟 Spiritual Development**:\n`;
            response += `• Explore the connection between practice and personal growth\n`;
            response += `• Engage with BambiSleep Church community activities\n`;
            response += `• Consider meditation and mindfulness practices\n`;
            response += `• Reflect on the deeper meaning and purpose of your practice\n\n`;
        }

        if (interests.includes('creativity')) {
            response += `**🎨 Creative Expression**:\n`;
            response += `• Explore the creative aspects of the BambiSleep community\n`;
            response += `• Consider contributing art, writing, or other creative works\n`;
            response += `• Connect creativity with spiritual and personal development\n`;
            response += `• Participate in creative community projects and initiatives\n\n`;
        }

        // Safety emphasis
        if (safetyFocus) {
            response += `**🚨 Essential Safety Reminders**:\n`;
            response += `• Always prioritize your mental and physical wellbeing\n`;
            response += `• Take breaks and maintain balance in your practice\n`;
            response += `• Seek help immediately if you experience distress\n`;
            response += `• Remember that consent can be withdrawn at any time\n\n`;
        }

        // Knowledge base search if available
        if (knowledgeData && knowledgeData.length > 0) {
            const relevantResources = knowledgeData.filter(item => {
                if (experience === 'beginner' && item.title.toLowerCase().includes('beginner')) return true;
                if (interests.includes('safety') && item.category === 'safety') return true;
                if (interests.includes('community') && item.category === 'community') return true;
                return false;
            }).slice(0, 3);

            if (relevantResources.length > 0) {
                response += `**📚 Recommended Knowledge Base Resources**:\n`;
                relevantResources.forEach(resource => {
                    response += `• ${resource.title} (${resource.category})\n`;
                    response += `  ${resource.description}\n`;
                });
            }
        }

        response += `\n💡 **Remember**: Your safety and wellbeing are the most important considerations. Take things at your own pace and don't hesitate to seek support when needed.`;

        return response;
    }
};

// Export all tools
export const bambiTools = {
    searchKnowledge,
    getSafetyInfo,
    getChurchStatus,
    getCommunityGuidelines,
    getResourceRecommendations
};
