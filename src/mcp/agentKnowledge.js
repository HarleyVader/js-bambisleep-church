// MCP Agent - Full Rebuild
import { addKnowledge } from './tools/knowledgeTools.js';
import LMStudioClient from '../lmstudio/client.js';

const lmStudio = new LMStudioClient();

export async function agentAddKnowledge({ prompt, title, category, tags }) {
  const content = await lmStudio.generateCompletion(prompt);
  if (!content) throw new Error('LMStudio failed to generate content');
  return await addKnowledge({ content, title, category, tags });
}
