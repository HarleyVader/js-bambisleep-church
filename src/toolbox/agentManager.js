import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

class AgentManager extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.conversations = new Map();
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
    const agent = this.agents.get(id);
    if (agent) {
      // Add conversation history to agent object
      const agentConversations = Array.from(this.conversations.values())
        .filter(conv => conv.agentId === id)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      return {
        ...agent,
        conversations: agentConversations
      };
    }
    return agent;
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }
  promptAgent(agentId, message, context = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error('Agent not found');

    const startTime = Date.now();
    
    // Update agent status to working
    agent.status = 'working';
    this.agents.set(agentId, agent);

    // Simulate processing time
    const processingTime = Math.random() * 100 + 50; // 50-150ms
    
    setTimeout(() => {
      const endTime = Date.now();
      const responseTime = (endTime - startTime) / 1000; // in seconds

      const conversation = {
        id: Date.now().toString(),
        agentId,
        prompt: message,
        context,
        timestamp: new Date().toISOString(),
        response: `Agent ${agent.name} processing: ${message}`,
        responseTime: responseTime.toFixed(2) + 's'
      };

      this.conversations.set(conversation.id, conversation);
      
      // Update agent status back to idle
      agent.status = 'idle';
      this.agents.set(agentId, agent);
      
      this.emit('agentPrompted', conversation);
    }, processingTime);

    const conversation = {
      id: Date.now().toString(),
      agentId,
      prompt: message,
      context,
      timestamp: new Date().toISOString(),
      response: `Agent ${agent.name} processing: ${message}`,
      responseTime: '0.01s'
    };

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
  // Initialize with existing agent configurations
  initializeFromConfigs() {
    try {
      // Load predefined agents
      const agentConfigs = [
        'agent-crawler.json',
        'agent-analyzer.json', 
        'agent-kb.json'
      ];
      
      agentConfigs.forEach(configFile => {
        try {
          const configPath = path.join(process.cwd(), configFile);
          if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const agent = {
              id: config.name.toLowerCase().replace(/\s+/g, '-'),
              name: config.name,
              description: config.description,
              prompt: config.prompt,
              tools: config.tools || [],
              created: new Date().toISOString(),
              status: 'idle'
            };
            
            // Only add if not already exists
            if (!this.agents.has(agent.id)) {
              this.agents.set(agent.id, agent);
            }
          }
        } catch (error) {
          console.warn(`Could not load agent config ${configFile}:`, error.message);
        }
      });
    } catch (error) {
      console.warn('Could not initialize predefined agents:', error.message);
    }  }
}

export default new AgentManager();
