// Test script specifically for bambisleep.info agent crawling

import 'dotenv/config';
import { crawlAndAnalyze } from './src/mcp/agentKnowledge.js';
import axios from 'axios';

async function testBambiSleepAgent() {
  console.log('🌙 BAMBI SLEEP AGENT TEST');
  console.log('='.repeat(50));
  
  const bambiUrl = 'https://bambisleep.info';
  
  // Test 1: Check current knowledge base
  console.log('\n📋 Current Knowledge Base Status:');
  try {
    const listResponse = await axios.get('http://localhost:9999/knowledge/list');
    const bambiEntries = listResponse.data.filter(item => 
      item.url.includes('bambisleep') || item.title.toLowerCase().includes('bambi')
    );
    console.log(`✅ Found ${bambiEntries.length} Bambi Sleep entries in knowledge base`);
    bambiEntries.forEach(entry => {
      console.log(`   - ${entry.title} (${entry.url})`);
    });
  } catch (error) {
    console.log('❌ Error checking knowledge base:', error.message);
  }
  
  // Test 2: Run agent on bambisleep.info
  console.log('\n🤖 Running Agent on bambisleep.info:');
  try {
    console.log(`📡 Crawling: ${bambiUrl}`);
    const startTime = Date.now();
    
    const result = await crawlAndAnalyze(bambiUrl);
    const endTime = Date.now();
    
    if (result.error) {
      console.log(`❌ Agent Error: ${result.message}`);
    } else {
      console.log(`✅ Success! Title: "${result.title}"`);
      console.log(`⏱️  Crawl time: ${endTime - startTime}ms`);
    }
  } catch (error) {
    console.log(`💥 Agent Exception: ${error.message}`);
  }
  
  // Test 3: Verify updated knowledge base
  console.log('\n📋 Updated Knowledge Base:');
  try {
    const listResponse = await axios.get('http://localhost:9999/knowledge/list');
    const bambiEntries = listResponse.data.filter(item => 
      item.url.includes('bambisleep') || item.title.toLowerCase().includes('bambi')
    );
    console.log(`✅ Now have ${bambiEntries.length} Bambi Sleep entries`);
    
    // Show the most recent entry
    const mostRecent = listResponse.data[listResponse.data.length - 1];
    if (mostRecent && mostRecent.url === bambiUrl) {
      console.log(`🆕 Latest entry: "${mostRecent.title}" (ID: ${mostRecent.id})`);
    }
  } catch (error) {
    console.log('❌ Error checking updated knowledge base:', error.message);
  }
  
  // Test 4: Search for bambisleep content
  console.log('\n🔍 Testing Search for Bambi Sleep:');
  try {
    const searchResponse = await axios.get('http://localhost:9999/knowledge/search?q=bambi');
    console.log(`✅ Search results: ${searchResponse.data.length} matches`);
    searchResponse.data.forEach(item => {
      console.log(`   📄 ${item.title} - ${item.url}`);
    });
  } catch (error) {
    console.log('❌ Search error:', error.message);
  }
  
  // Test 5: Check bambisleep.info accessibility
  console.log('\n🌐 Testing bambisleep.info accessibility:');
  try {
    const response = await axios.head('https://bambisleep.info');
    console.log(`✅ bambisleep.info is accessible (Status: ${response.status})`);
  } catch (error) {
    console.log(`❌ bambisleep.info accessibility issue: ${error.message}`);
  }
  
  console.log('\n🏁 Bambi Sleep Agent Test Completed!');
  console.log('='.repeat(50));
}

testBambiSleepAgent().catch(console.error);
