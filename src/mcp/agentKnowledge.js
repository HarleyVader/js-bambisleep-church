// MCP Agent - Clean, minimal, modern
import { addKnowledge } from './tools/knowledgeTools.js';
import LMStudioClient from '../lmstudio/client.js';

const lmStudio = new LMStudioClient();

/**
 * Uses LMStudio to generate content and adds it to the knowledgebase.
 * @param {Object} params
 * @param {string} params.prompt - Prompt for LMStudio
 * @param {string} params.title - Title for the knowledge entry
 * @param {string} [params.category] - Optional category
 * @param {string[]} [params.tags] - Optional tags
 */
export async function agentAddKnowledge({ prompt, title, category, tags }) {
  const content = await lmStudio.generateCompletion(prompt);
  if (!content) throw new Error('LMStudio failed to generate content');
  return await addKnowledge({ content, title, category, tags });
}
