// Clear knowledge base script
import { cleanKnowledgeBase, getQualityMetrics } from './src/mcp/agentKnowledge.js';

console.log('🗑️ Clearing knowledge base...');

// Check current state
const currentMetrics = getQualityMetrics();
console.log(`Current entries: ${currentMetrics.total}`);

// Clear the database using the built-in cleanup function
const result = await cleanKnowledgeBase();

if (result.success) {
  console.log('✅ Knowledge base cleared successfully!');
  console.log(`Summary: ${result.summary.originalCount} → ${result.summary.finalCount} entries`);
  console.log(`Removed: ${result.summary.totalRemoved} (${result.summary.duplicatesRemoved} duplicates, ${result.summary.invalidRemoved} invalid, ${result.summary.archivedCount} archived)`);
} else {
  console.log('❌ Failed to clear knowledge base:', result.error);
}

// Verify final state
const finalMetrics = getQualityMetrics();
console.log(`Final entries: ${finalMetrics.total}`);

process.exit(0);
