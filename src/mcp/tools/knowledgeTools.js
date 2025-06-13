// Knowledgebase MCP Tools - Full Rebuild
import KnowledgeStorage from '../../knowledge/storage.js';
import LMStudioClient from '../../lmstudio/client.js';

const storage = new KnowledgeStorage();
const lmStudio = new LMStudioClient();

export async function addKnowledge({ content, title, category, tags }) {
  const metadata = { title, category, tags };
  const result = await storage.addEntry(content, metadata);
  return { success: true, id: result.id, message: 'Knowledge entry added' };
}

export async function searchKnowledge({ query }) {
  const results = await storage.searchEntries(query);
  return { results };
}

export async function listKnowledge() {
  const entries = await storage.listEntries();
  return { entries };
}

export async function getKnowledge({ id }) {
  const entry = await storage.getEntry(id);
  return { entry };
}

export async function updateKnowledge({ id, content, metadata }) {
  const updated = await storage.updateEntry(id, content, metadata);
  return { updated };
}

export async function deleteKnowledge({ id }) {
  await storage.deleteEntry(id);
  return { deleted: true };
}
