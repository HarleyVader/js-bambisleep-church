import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

class AgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.conversations = new Map();
    this.loadPredefinedAgents();
  }  loadPredefinedAgents() {
    // Load predefined agents from JSON files
    const agentConfigs = [
      'agent-crawler.json',
      'agent-analyzer.json', 
      'agent-kb.json'
    ];

    agentConfigs.forEach(configFile => {
      try {
        const fullPath = path.resolve(process.cwd(), configFile);
        
        if (fs.existsSync(fullPath)) {
          const config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          
          // Check if agent already exists
          const existingAgent = Array.from(this.agents.values())
            .find(agent => agent.name === config.name);
          
          if (!existingAgent) {
            const agent = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              name: config.name,
              description: config.description || '',
              prompt: config.prompt || '',
              tools: config.tools || [],
              created: new Date().toISOString(),
              status: 'idle',
              predefined: true
            };
            
            this.agents.set(agent.id, agent);
            console.log(`Loaded predefined agent: ${agent.name}`);
          }
        }
      } catch (error) {
        console.warn(`Could not load predefined agent from ${configFile}:`, error.message);
      }
    });
  }

  createAgent(config) {
    const agent = {
      id: Date.now().toString(),
      name: config.name,
      description: config.description || '',
      prompt: config.prompt || '',
      tools: config.tools || [],
      created: new Date().toISOString(),
      status: 'idle'
    };
    
    this.agents.set(agent.id, agent);
    this.emit('agentCreated', agent);
    return agent;
  }

  getAgent(id) {
    return this.agents.get(id);
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  promptAgent(agentId, message, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    const conversation = {
      id: Date.now().toString(),
      agentId,
      message,
      context,
      timestamp: new Date().toISOString(),
      response: `Agent ${agent.name} processing: ${message}`
    };

    this.conversations.set(conversation.id, conversation);
    this.emit('agentPrompted', conversation);
    return conversation;
  }

  sendAgentMessage(fromAgentId, toAgentId, message) {
    const fromAgent = this.agents.get(fromAgentId);
    const toAgent = this.agents.get(toAgentId);
    
    if (!fromAgent || !toAgent) throw new Error('Agent not found');

    const communication = {
      id: Date.now().toString(),
      from: fromAgentId,
      to: toAgentId,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    this.emit('agentCommunication', communication);
    return communication;
  }

  getAgentConversations(agentId) {
    return Array.from(this.conversations.values())
      .filter(conv => conv.agentId === agentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getAgentStats(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const conversations = this.getAgentConversations(agentId);
    const totalInteractions = conversations.length;
    const avgResponseTime = conversations.length > 0 ? 
      conversations.reduce((sum, conv) => sum + (conv.responseTime || 0.01), 0) / conversations.length : 0;

    return {
      totalInteractions,
      avgResponseTime: avgResponseTime.toFixed(3),
      status: agent.status,
      created: agent.created,
      uptime: this.calculateUptime(agent.created),
      lastActive: conversations.length > 0 ? conversations[0].timestamp : agent.created
    };
  }

  calculateUptime(created) {
    const now = new Date();
    const createdDate = new Date(created);
    const uptimeMs = now - createdDate;
    const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

export default new AgentManager();
