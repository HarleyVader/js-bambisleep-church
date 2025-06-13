// In-memory agent task state (for demo; replace with persistent store for production)
const agentTasks = [
  {
    id: 'knowledge-base-builder',
    title: 'Knowledge Base Builder',
    description: 'Crawling, analyzing, and building the knowledge base from URLs.',
    status: 'Idle',
    completion: 0,
    toolName: 'knowledge',
    logs: [],
    errors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRun: null,
    subtasks: []
  },
  {
    id: 'url-metadata-updater',
    title: 'URL Metadata Updater',
    description: 'Updating metadata for all known URLs.',
    status: 'Idle',
    completion: 0,
    toolName: 'urlUpdater',
    logs: [],
    errors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRun: null,
    subtasks: []
  }
];

export function getAgentTasks() {
  return agentTasks;
}

export function updateAgentTask(id, updates) {
  const task = agentTasks.find(t => t.id === id);
  if (task) {
    Object.assign(task, updates);
  }
}

export default {
  getAgentTasks,
  updateAgentTask
};
