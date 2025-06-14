// Comprehensive system test for BambiSleepChurch

import axios from 'axios';
import { crawlAndAnalyze } from './src/mcp/agentKnowledge.js';
import { analyze } from './src/lmstudio/client.js';

async function runSystemTest() {
  console.log('🚀 COMPREHENSIVE SYSTEM TEST - BambiSleepChurch');
  console.log('='.repeat(60));
  
  // Test 1: Web Server
  console.log('\n📡 Testing Web Server...');
  try {
    const webResponse = await axios.get('http://localhost:8888');
    console.log('✅ Web server responding (Status:', webResponse.status, ')');
  } catch (error) {
    console.log('❌ Web server error:', error.message);
  }
  
  // Test 2: MCP Server Endpoints
  console.log('\n🔧 Testing MCP Server Endpoints...');
  try {
    // Test knowledge list
    const listResponse = await axios.get('http://localhost:3001/knowledge/list');
    console.log('✅ Knowledge list:', listResponse.data.length, 'entries');
    
    // Test knowledge search
    const searchResponse = await axios.get('http://localhost:3001/knowledge/search?q=bambi');
    console.log('✅ Knowledge search results:', searchResponse.data.length, 'matches');
    
    // Test getting specific knowledge
    if (listResponse.data.length > 0) {
      const getResponse = await axios.get(`http://localhost:3001/knowledge/get/${listResponse.data[0].id}`);
      console.log('✅ Knowledge get:', getResponse.data.title || 'Retrieved successfully');
    }
  } catch (error) {
    console.log('❌ MCP server error:', error.message);
  }
  
  // Test 3: Agent Functionality
  console.log('\n🤖 Testing Agent Functionality...');
  try {
    const testUrl = 'https://www.npmjs.com/package/express';
    const result = await crawlAndAnalyze(testUrl);
    if (result.error) {
      console.log('❌ Agent error:', result.message);
    } else {
      console.log('✅ Agent crawled:', result.title);
    }
  } catch (error) {
    console.log('❌ Agent exception:', error.message);
  }
  
  // Test 4: LM Studio Client
  console.log('\n🧠 Testing LM Studio Client...');
  try {
    const analysisResult = await analyze('This is a test text for analysis');
    console.log('✅ LM Studio analysis:', analysisResult.summary);
  } catch (error) {
    console.log('❌ LM Studio error:', error.message);
  }
  
  // Test 5: Environment Configuration
  console.log('\n⚙️  Environment Configuration:');
  console.log('  - Web Server Port:', process.env.PORT || '(default)');
  console.log('  - MCP Server Port:', process.env.MCP_PORT || '(default)');
  console.log('  - Server Host:', process.env.SERVER || '(default)');
  console.log('  - LM Studio Server:', process.env.LMS_SERVER || '(not set)');
  console.log('  - LM Studio Port:', process.env.LMS_PORT || '(not set)');
  console.log('  - MCP Transport:', process.env.MCP_TRANSPORT || '(not set)');
  
  console.log('\n🏁 System test completed!');
  console.log('='.repeat(60));
}

// Load environment variables
import 'dotenv/config';

runSystemTest().catch(console.error);
