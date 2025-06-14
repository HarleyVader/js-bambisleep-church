// Quick test script to debug the crawling issue with improved categorization
import { crawlAndAnalyze, batchAnalyze } from './src/mcp/agentKnowledge.js';

console.log('Testing bambisleep.info URL analysis with improved categorization...');

// Test a few URLs to see the categorization working
const testUrls = [
  'https://bambisleep.info/Bambi_Sleep_FAQ',
  'https://bambisleep.info/Bambi_Sleep_Playlist',
  'https://bambisleep.info/Bambi_Sleep_FAQ' // Duplicate to test duplicate detection
];

console.log('\n=== Single URL Test ===');
crawlAndAnalyze(testUrls[0]).then(result => {
  console.log('First URL result:', JSON.stringify(result, null, 2));
  
  console.log('\n=== Batch Analysis Test ===');
  return batchAnalyze(testUrls);
}).then(results => {
  console.log('\n=== BATCH RESULTS ===');
  
  const successful = results.filter(r => r.success).length;
  const duplicates = results.filter(r => r.duplicate).length;
  const errors = results.filter(r => r.error && !r.duplicate).length;
  
  console.log(`📊 SUMMARY: ${successful} new, ${duplicates} duplicates, ${errors} errors`);
  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✅ NEW' : result.duplicate ? '⚠️ DUPLICATE' : '❌ ERROR';
    console.log(`${index + 1}. ${status} - ${result.url} - ${result.message || 'Success'}`);
  });
  
  console.log('\n=== END ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
