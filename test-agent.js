// Test script for running the knowledge agent

import { crawlAndAnalyze } from './src/mcp/agentKnowledge.js';

async function testAgent() {
  console.log('🤖 Starting Knowledge Agent Test...');
  
  const testUrls = [
    'https://bambisleep.info',
    'https://example.com',
    'https://github.com/HarleyVader/js-bambisleep-church'
  ];
  
  for (const url of testUrls) {
    console.log(`\n📡 Crawling: ${url}`);
    try {
      const result = await crawlAndAnalyze(url);
      if (result.error) {
        console.log(`❌ Error: ${result.message}`);
      } else {
        console.log(`✅ Success: ${result.title}`);
      }
    } catch (error) {
      console.log(`💥 Exception: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Agent test completed!');
}

testAgent().catch(console.error);
