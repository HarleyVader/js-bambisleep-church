import { EventEmitter } from 'events';

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
}

export default new AgentManager();
