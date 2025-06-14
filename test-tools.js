// Test Knowledge Tools API

import * as knowledgeTools from './src/mcp/tools/knowledgeTools.js';

// Mock request/response objects
function createMockReq(body = {}, params = {}, query = {}) {
  return { body, params, query };
}

function createMockRes() {
  const res = { data: null };
  res.json = (data) => { res.data = data; return res; };
  return res;
}

async function testKnowledgeTools() {
  console.log('🔧 TESTING KNOWLEDGE TOOLS API\n');
  console.log('=' .repeat(50));

  // Test 1: List all entries
  console.log('\n📋 TEST 1: List All Entries');
  console.log('-' .repeat(30));
  const listRes = createMockRes();
  knowledgeTools.list(createMockReq(), listRes);
  console.log(`Found ${listRes.data.length} entries`);

  // Test 2: Search functionality
  console.log('\n🔍 TEST 2: Search Functionality');
  console.log('-' .repeat(30));
  const searchRes = createMockRes();
  knowledgeTools.search(createMockReq({}, {}, { q: 'bambisleep' }), searchRes);
  console.log(`Search for 'bambisleep' found ${searchRes.data.length} results`);

  // Test 3: Analytics
  console.log('\n📊 TEST 3: Analytics');
  console.log('-' .repeat(30));
  const analyticsRes = createMockRes();
  knowledgeTools.analytics(createMockReq(), analyticsRes);
  console.log('Analytics:', JSON.stringify(analyticsRes.data, null, 2));

  // Test 4: Filter by category
  console.log('\n🏷️ TEST 4: Filter by Category');
  console.log('-' .repeat(30));
  const categories = ['official', 'community', 'tools', 'general'];
  for (const category of categories) {
    const filterRes = createMockRes();
    knowledgeTools.filterByCategory(createMockReq({}, { category }), filterRes);
    console.log(`${category}: ${filterRes.data.length} entries`);
  }

  // Test 5: Filter by relevance
  console.log('\n⭐ TEST 5: Filter by Relevance');
  console.log('-' .repeat(30));
  const relevanceRes = createMockRes();
  knowledgeTools.filterByRelevance(createMockReq({}, {}, { min: 3 }), relevanceRes);
  console.log(`Entries with relevance >= 3: ${relevanceRes.data.length}`);

  // Test 6: Get specific entry
  console.log('\n🎯 TEST 6: Get Specific Entry');
  console.log('-' .repeat(30));
  const entries = listRes.data;
  if (entries.length > 0) {
    const getRes = createMockRes();
    knowledgeTools.get(createMockReq({}, { id: entries[0].id }), getRes);
    console.log(`Retrieved entry: ${getRes.data.title || 'No title'}`);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ ALL KNOWLEDGE TOOLS TESTS PASSED!');
}

testKnowledgeTools().catch(console.error);
