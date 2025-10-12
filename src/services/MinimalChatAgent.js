// MOTHER BRAIN Mainframe Chat Agent for BambiSleep Church
// Advanced chat agent powered by MOTHER BRAIN's Global Mainframe Chat Stream
import { log } from '../utils/logger.js';
import { mongoService } from './MongoDBService.js';
import { MotherBrain } from './MotherBrain.js';

class MotherBrainChatAgent {
    constructor() {
        this.isInitialized = false;
        this.motherBrain = null;
        this.userId = `chat_agent_${Date.now()}`;
        this.userProfile = {
            username: 'BambiSleep_Assistant',
            avatar: '🔥🤖',
            role: 'assistant',
            reputation: 100
        };
    }

    async initialize() {
        try {
            // Initialize MOTHER BRAIN with mainframe chat enabled
            this.motherBrain = new MotherBrain({
                enableMainframeChat: true,
                maxChatHistory: 500,
                userAgent: 'BambiSleep-Church-ChatAgent/2.0 (Assistant; +https://github.com/HarleyVader/js-bambisleep-church)'
            });

            await this.motherBrain.initialize();

            // Join the mainframe chat as the chat assistant
            const joinResult = this.motherBrain.joinMainframeChat(this.userId, this.userProfile);

            if (joinResult.success) {
                log.success('🔥🤖 MOTHER BRAIN Chat Agent connected to mainframe');

                // Post welcome message to mainframe
                this.motherBrain.postToMainframeChat(this.userId,
                    '🔥 BambiSleep Assistant connected to mainframe! Ready to help with knowledge searches and safety info. #assistant #online'
                );

                this.isInitialized = true;
                return true;
            } else {
                throw new Error(`Failed to join mainframe: ${joinResult.error}`);
            }
        } catch (error) {
            log.error(`❌ MOTHER BRAIN Chat Agent initialization failed: ${error.message}`);
            return false;
        }
    }

    async chat(message) {
        try {
            if (!this.isInitialized || !this.motherBrain) {
                return { success: false, response: 'MOTHER BRAIN Chat Agent not initialized', tool: 'system' };
            }

            const lowerMessage = message.toLowerCase();
            let response, tool = 'chat';

            // Process different types of messages
            if (lowerMessage.includes('mainframe') || lowerMessage.includes('chat') || lowerMessage.includes('community')) {
                response = await this.getMainframeInfo(message);
                tool = 'mainframe-info';
            } else if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('knowledge')) {
                response = await this.searchKnowledge(message);
                tool = 'knowledge-search';
            } else if (lowerMessage.includes('safety')) {
                response = await this.getSafety();
                tool = 'safety-info';
            } else if (lowerMessage.includes('share') || lowerMessage.includes('discovery')) {
                response = await this.handleSharingRequest(message);
                tool = 'sharing-request';
            } else if (lowerMessage.includes('status') || lowerMessage.includes('stats')) {
                response = await this.getSystemStatus();
                tool = 'system-status';
            } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                response = await this.getGreeting();
                tool = 'greeting';
            } else if (message.startsWith('/')) {
                response = await this.processChatCommand(message);
                tool = 'command';
            } else {
                response = await this.getGeneralHelp();
                tool = 'general';
            }

            // Post user interaction to mainframe (if enabled)
            if (this.shouldBroadcastToMainframe(message)) {
                this.motherBrain.postToMainframeChat(this.userId,
                    `📞 User inquiry: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}" #user-support`
                );
            }

            return {
                success: true,
                response,
                tool,
                timestamp: new Date().toISOString(),
                mainframeStats: this.motherBrain.getMainframeChatStats()
            };
        } catch (error) {
            log.error(`❌ MOTHER BRAIN Chat error: ${error.message}`);

            // Post error to mainframe for debugging
            if (this.motherBrain) {
                this.motherBrain.postToMainframeChat(this.userId,
                    `❌ Chat error encountered: ${error.message} #error #debugging`
                );
            }

            return { success: false, response: 'Sorry, I encountered an error with the mainframe.', tool: 'error' };
        }
    }

    async searchKnowledge(message) {
        try {
            const searchTerm = this.extractSearchTerm(message);
            if (!searchTerm) return "Please specify what you're looking for in the knowledge base.";

            // Search MongoDB knowledge base
            const results = await mongoService.findMany('bambisleep_knowledge', {
                $or: [
                    { 'analysis.title': { $regex: searchTerm, $options: 'i' } },
                    { 'analysis.summary': { $regex: searchTerm, $options: 'i' } },
                    { 'category.main': { $regex: searchTerm, $options: 'i' } }
                ]
            }, { limit: 3 });

            if (!results.length) {
                // Share the search attempt with mainframe community
                this.motherBrain.postToMainframeChat(this.userId,
                    `🔍 Knowledge search for "${searchTerm}" returned no results. Community, any suggestions? #knowledge-request #help-needed`
                );

                return `🔍 No resources found for "${searchTerm}" in our knowledge base.\n\n💬 I've posted your search to the mainframe community - they might have suggestions!\n\nTry broader terms or check our safety resources.`;
            }

            // Found results - share successful search with community
            this.motherBrain.postToMainframeChat(this.userId,
                `✅ Successful knowledge search for "${searchTerm}" - found ${results.length} resources! #knowledge-success`
            );

            let response = `🔍 Found ${results.length} resource(s) for "${searchTerm}":\n\n`;
            results.forEach((item, i) => {
                response += `${i + 1}. **${item.analysis?.title || 'Unknown'}**\n`;
                response += `   ${item.analysis?.summary || 'No description'}\n`;
                response += `   Category: ${item.category?.main || 'unknown'}\n`;
                if (item.url) response += `   🔗 Link: ${item.url}\n`;
                response += '\n';
            });

            response += '\n💬 Results shared with the mainframe community for validation!';
            return response;

        } catch (error) {
            log.error(`❌ Knowledge search error: ${error.message}`);

            // Report error to mainframe
            this.motherBrain.postToMainframeChat(this.userId,
                `❌ Knowledge search system error: ${error.message} #system-error #needs-attention`
            );

            return '❌ Error searching knowledge base. The mainframe has been notified for technical support.';
        }
    }

    async getSafety() {
        try {
            // Get safety content from MongoDB
            const safetyContent = await mongoService.findMany('bambisleep_knowledge', {
                'category.main': 'safety'
            }, { limit: 5 });

            // Share safety check with mainframe community
            this.motherBrain.postToMainframeChat(this.userId,
                `🛡️ Safety resources requested - promoting responsible practices! #safety-first #community-care`
            );

            if (safetyContent.length > 0) {
                let response = "🛡️ **BambiSleep Safety Guidelines**:\n\n";
                safetyContent.forEach((item, i) => {
                    response += `${i + 1}. **${item.analysis?.title || 'Safety Info'}**\n`;
                    response += `   ${item.analysis?.summary || 'Important safety information'}\n\n`;
                });

                response += "💬 **Community Support Available:**\n";
                response += "The mainframe community is here for peer support and safety discussions.\n";
                response += "Use 'mainframe info' to connect with others prioritizing safe practices.";

                return response;
            }

            // Fallback safety info with mainframe integration
            let response = "🛡️ **Key Safety Points**:\n";
            response += "• Never listen while driving or operating machinery\n";
            response += "• Use in safe, private spaces only\n";
            response += "• Take regular breaks and stay hydrated\n";
            response += "• Know your limits and respect them\n";
            response += "• Seek support when needed\n";
            response += "• Remember: This is fantasy roleplay, not reality\n\n";

            response += "🆘 **Crisis Resources:**\n";
            response += "• Crisis Text Line: Text HOME to 741741\n";
            response += "• National Suicide Prevention Lifeline: 988\n";
            response += "• SAMHSA National Helpline: 1-800-662-4357\n\n";

            response += "💬 **Mainframe Community:**\n";
            response += "Connect with others for safety discussions and peer support.";

            return response;

        } catch (error) {
            log.error(`❌ Safety query error: ${error.message}`);

            // Report safety system error to mainframe
            this.motherBrain.postToMainframeChat(this.userId,
                `❌ CRITICAL: Safety information system error! Manual safety protocols needed. #safety-critical #system-error`
            );

            return "🛡️ ⚠️ Safety system temporarily unavailable.\n\n**IMMEDIATE SAFETY REMINDERS:**\n• Always prioritize your safety and wellbeing\n• Never engage while driving or operating machinery\n• Seek professional help if needed\n• Crisis Text Line: 741741\n\nThe mainframe community has been notified of this issue.";
        }
    }

    // MOTHER BRAIN Mainframe Integration Helper Methods
    async getMainframeInfo() {
        try {
            const recentActivity = this.motherBrain.getRecentMainframeActivity(10);
            const activeUsers = this.motherBrain.getActiveMainframeUsers();

            let response = "🧠 **MOTHER BRAIN Mainframe Global Chat**\n\n";
            response += `👥 **Active Users:** ${activeUsers.length}\n`;
            response += `💬 **Recent Activity:** ${recentActivity.length} messages\n\n`;

            if (recentActivity.length > 0) {
                response += "**Recent Community Messages:**\n";
                recentActivity.slice(0, 3).forEach(msg => {
                    response += `• @${msg.username}: ${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}\n`;
                });
                response += "\n";
            }

            response += "**Commands:**\n";
            response += "• 'mainframe join' - Join the global chat\n";
            response += "• 'mainframe post [message]' - Share with community\n";
            response += "• 'share finding [url]' - Share a discovery\n";
            response += "• 'mainframe status' - View system status\n";

            return response;
        } catch (error) {
            return "🧠 Mainframe information temporarily unavailable.";
        }
    }

    async handleSharingRequest(message) {
        try {
            const urlMatch = message.match(/https?:\/\/[^\s]+/);
            if (!urlMatch) {
                return "📤 To share a finding, include a URL: 'share finding [your-url]'";
            }

            const url = urlMatch[0];
            const description = message.replace(urlMatch[0], '').replace(/share\s+finding/i, '').trim() || "Interesting resource discovered";

            // Share finding via MOTHER BRAIN
            const result = await this.motherBrain.shareFinding(this.userId, url, description);

            if (result.success) {
                return `📤 ✅ Finding shared with the mainframe community!\n\n**Shared:** ${url}\n**Description:** ${description}\n\n💬 The community can now see and validate your discovery.`;
            } else {
                return `📤 ❌ Failed to share finding: ${result.error}`;
            }
        } catch (error) {
            log.error(`❌ Sharing error: ${error.message}`);
            return "📤 ❌ Error sharing finding with community.";
        }
    }

    async getSystemStatus() {
        try {
            const motherBrainStatus = this.motherBrain.getSystemStatus();
            const mongoStatus = await mongoService.testConnection();

            let response = "🔧 **System Status Report**\n\n";
            response += `🧠 **MOTHER BRAIN:** ${motherBrainStatus.status}\n`;
            response += `📊 **Database:** ${mongoStatus ? 'Connected' : 'Disconnected'}\n`;
            response += `💬 **Mainframe Chat:** ${motherBrainStatus.mainframeChat ? 'Active' : 'Inactive'}\n`;
            response += `🕷️ **Spider System:** ${motherBrainStatus.spiderSystem ? 'Operational' : 'Offline'}\n\n`;

            if (motherBrainStatus.stats) {
                response += "**Operational Stats:**\n";
                response += `• Active Users: ${motherBrainStatus.stats.activeUsers || 0}\n`;
                response += `• Messages Today: ${motherBrainStatus.stats.messagesToday || 0}\n`;
                response += `• Findings Shared: ${motherBrainStatus.stats.findingsShared || 0}\n`;
                response += `• System Uptime: ${motherBrainStatus.stats.uptime || 'Unknown'}\n`;
            }

            return response;
        } catch (error) {
            return "🔧 ❌ Unable to retrieve system status.";
        }
    }

    async processChatCommand(message) {
        const command = message.toLowerCase().trim();

        if (command.startsWith('mainframe join')) {
            try {
                const result = await this.motherBrain.joinMainframeChat(this.userId, this.userProfile);
                return result.success ?
                    `🧠 ✅ Connected to MOTHER BRAIN mainframe!\n\n${result.welcomeMessage}` :
                    `🧠 ❌ Failed to join mainframe: ${result.error}`;
            } catch (error) {
                return "🧠 ❌ Error connecting to mainframe.";
            }
        }

        if (command.startsWith('mainframe post ')) {
            const content = message.substring(15).trim();
            if (!content) return "💬 Please provide a message to post.";

            try {
                const result = await this.motherBrain.postToMainframeChat(this.userId, content);
                return result.success ?
                    `💬 ✅ Message posted to mainframe community!` :
                    `💬 ❌ Failed to post: ${result.error}`;
            } catch (error) {
                return "💬 ❌ Error posting to mainframe.";
            }
        }

        return null; // Command not recognized
    }

    shouldBroadcastToMainframe(message) {
        // Broadcast important interactions to mainframe community
        const broadcastTriggers = [
            'safety', 'help', 'support', 'crisis', 'emergency',
            'resources', 'community', 'share', 'finding', 'discovery'
        ];

        return broadcastTriggers.some(trigger =>
            message.toLowerCase().includes(trigger)
        );
    }

    extractSearchTerm(message) {
        const quotedMatch = message.match(/["'](.*?)["']/);
        if (quotedMatch) return quotedMatch[1];

        const keywordMatch = message.match(/(?:search|find|about)\s+(.+?)(?:\s|$)/i);
        if (keywordMatch) return keywordMatch[1].trim();

        const words = message.split(' ').filter(w => w.length > 2);
        return words.slice(-2).join(' ');
        return words.slice(-2).join(' ');
    }

    async cleanup() {
        this.isInitialized = false;
        log.info('🧹 MinimalChatAgent cleaned up');
    }
}

export const motherBrainChatAgent = new MotherBrainChatAgent();
export default motherBrainChatAgent;
