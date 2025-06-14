// Test adding a new bambisleep.info URL to verify the fix
import { crawlAndAnalyze } from './src/mcp/agentKnowledge.js';

console.log('Testing with a new bambisleep.info URL...');

const testUrl = 'https://bambisleep.info/Beginner%27s_Files';

crawlAndAnalyze(testUrl).then(result => {
  console.log('\n=== RESULT ===');
  console.log('Success:', result.success);
  console.log('Message:', result.message);
  if (result.entry) {
    console.log('Added Entry:', result.entry.title);
    console.log('Category:', result.entry.category);
    console.log('Relevance:', result.entry.relevance);
  }
  console.log('\n=== END ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
