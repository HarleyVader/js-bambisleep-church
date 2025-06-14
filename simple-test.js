// Simple test to check if the agentKnowledge module can be imported
try {
  console.log('Attempting to import agentKnowledge...');
  import('./src/mcp/agentKnowledge.js').then(() => {
    console.log('✅ Import successful!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  });
} catch (error) {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
}
