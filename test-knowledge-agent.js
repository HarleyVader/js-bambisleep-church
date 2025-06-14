// Test script for Knowledge Base Agent

import { batchAnalyze, crawlAndAnalyze, getQualityMetrics } from './src/mcp/agentKnowledge.js';

async function testAgent() {
  console.log('🤖 Testing Knowledge Base Agent...\n');

  // Test basic functionality without network calls
  const { getQualityMetrics } = await import('./src/mcp/agentKnowledge.js');
  
  console.log('� Current Quality Metrics:');
  const metrics = getQualityMetrics();
  console.log(metrics);

  console.log('\n✅ Basic agent testing complete!');
  console.log('💡 Agent features available:');
  console.log('  - Content relevance scoring (0-10)');
  console.log('  - Automatic categorization (official, audio, guides, community, tools)');
  console.log('  - URL validation and metadata extraction');
  console.log('  - Duplicate detection');
  console.log('  - Quality analytics');
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAgent().catch(console.error);
}

export { testAgent };
