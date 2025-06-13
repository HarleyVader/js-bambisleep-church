// Test URL analyzer functionality
import { analyzeAndSave } from './src/mcp/tools/urlAnalyzer.js';

async function testAnalyzer() {
  console.log('Testing URL Analyzer...');
  
  const testUrls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://developer.mozilla.org'
  ];
  
  try {
    const result = await analyzeAndSave(testUrls, 'test-analysis.json');
    console.log('Analysis Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAnalyzer();
