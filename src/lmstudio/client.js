// LM Studio API client for knowledgebase operations
import config from '../config/server.js';

class LMStudioClient {
  constructor() {
    this.baseURL = config.lmstudio.baseURL;
    this.apiKey = config.lmstudio.apiKey;
    this.model = config.lmstudio.defaultModel;
  }

  async generateCompletion(prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('LM Studio client error:', error);
      return null;
    }
  }

  async testConnection() {
    try {
      const response = await this.generateCompletion('Hello', { maxTokens: 10 });
      return response !== null;
    } catch {
      return false;
    }
  }
}

export default LMStudioClient;
