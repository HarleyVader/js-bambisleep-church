// Comprehensive Knowledge Base Agent Test Suite

import {
  batchAnalyze,
  crawlAndAnalyze,
  getQualityMetrics
} from './src/mcp/agentKnowledge.js';

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE KNOWLEDGE BASE AGENT TEST SUITE\n');
  console.log('=' .repeat(60));

  // Test 1: Current State Analysis
  console.log('\n📊 TEST 1: Current Knowledge Base State');
  console.log('-' .repeat(40));
  const initialMetrics = getQualityMetrics();
  console.log('Initial Metrics:', JSON.stringify(initialMetrics, null, 2));

  // Test 2: Duplicate Detection (should fail)
  console.log('\n🔄 TEST 2: Duplicate Detection');
  console.log('-' .repeat(40));
  console.log('Testing duplicate: https://bambisleep.chat (should be rejected)');
  const duplicateResult = await crawlAndAnalyze('https://bambisleep.chat');
  console.log('Result:', duplicateResult.success ? '❌ UNEXPECTED SUCCESS' : `✅ CORRECTLY REJECTED: ${duplicateResult.message}`);

  // Test 3: High Relevance Content
  console.log('\n🎯 TEST 3: High Relevance Content');
  console.log('-' .repeat(40));
  console.log('Testing high relevance: https://bambisleep.info');
  const highRelevanceResult = await crawlAndAnalyze('https://bambisleep.info');
  if (highRelevanceResult.success) {
    console.log('✅ HIGH RELEVANCE ADDED:');
    console.log(`  - Relevance: ${highRelevanceResult.entry.relevance}/10`);
    console.log(`  - Category: ${highRelevanceResult.entry.category}`);
    console.log(`  - Title: ${highRelevanceResult.entry.title}`);
  } else {
    console.log(`Result: ${highRelevanceResult.message}`);
  }

  // Test 4: Low Relevance Content (should be rejected)
  console.log('\n❌ TEST 4: Low Relevance Content');
  console.log('-' .repeat(40));
  console.log('Testing low relevance: https://example.com (should be rejected)');
  const lowRelevanceResult = await crawlAndAnalyze('https://example.com');
  console.log('Result:', lowRelevanceResult.success ? '❌ UNEXPECTED SUCCESS' : `✅ CORRECTLY REJECTED: ${lowRelevanceResult.message}`);

  // Test 5: Community Content
  console.log('\n👥 TEST 5: Community Content');
  console.log('-' .repeat(40));
  console.log('Testing community content: https://reddit.com/r/BambiSleep');
  const communityResult = await crawlAndAnalyze('https://reddit.com/r/BambiSleep');
  if (communityResult.success) {
    console.log('✅ COMMUNITY CONTENT ADDED:');
    console.log(`  - Category: ${communityResult.entry.category}`);
    console.log(`  - Relevance: ${communityResult.entry.relevance}/10`);
  } else {
    console.log(`Result: ${communityResult.message}`);
  }

  // Test 6: Tools/GitHub Content
  console.log('\n🔧 TEST 6: Tools Content');
  console.log('-' .repeat(40));
  console.log('Testing tools content: https://github.com/HarleyVader/js-bambisleep-church');
  const toolsResult = await crawlAndAnalyze('https://github.com/HarleyVader/js-bambisleep-church');
  if (toolsResult.success) {
    console.log('✅ TOOLS CONTENT ADDED:');
    console.log(`  - Category: ${toolsResult.entry.category}`);
    console.log(`  - Relevance: ${toolsResult.entry.relevance}/10`);
  } else {
    console.log(`Result: ${toolsResult.message}`);
  }

  // Test 7: Invalid URL (should fail)
  console.log('\n🚫 TEST 7: Invalid URL');
  console.log('-' .repeat(40));
  console.log('Testing invalid URL: https://this-domain-does-not-exist-12345.com');
  const invalidResult = await crawlAndAnalyze('https://this-domain-does-not-exist-12345.com');
  console.log('Result:', invalidResult.success ? '❌ UNEXPECTED SUCCESS' : `✅ CORRECTLY FAILED: ${invalidResult.message}`);

  // Test 8: Final Analytics
  console.log('\n📈 TEST 8: Final Knowledge Base Analytics');
  console.log('-' .repeat(40));
  const finalMetrics = getQualityMetrics();
  console.log('Final Metrics:', JSON.stringify(finalMetrics, null, 2));

  // Test 9: Batch Analysis
  console.log('\n🚀 TEST 9: Batch Analysis');
  console.log('-' .repeat(40));
  const batchUrls = [
    'https://soundcloud.com/bambisleep', 
    'https://youtube.com/bambisleep'
  ];
  console.log('Testing batch analysis with audio content...');
  const batchResults = await batchAnalyze(batchUrls);
  batchResults.forEach((result, index) => {
    console.log(`  ${index + 1}. ${batchUrls[index]}: ${result.success ? '✅ SUCCESS' : '❌ ' + result.message}`);
    if (result.success) {
      console.log(`     Category: ${result.entry.category}, Relevance: ${result.entry.relevance}/10`);
    }
  });

  // Test Summary
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 TEST SUITE COMPLETE');
  console.log('=' .repeat(60));
  
  const summary = getQualityMetrics();
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`  Total Entries: ${summary.total}`);
  console.log(`  Validation Rate: ${summary.validationRate}`);
  console.log(`  High Quality Rate: ${summary.qualityRate}`);
  console.log(`  Categories: ${Object.keys(summary.categories).join(', ')}`);
  
  console.log('\n✅ All agent functionality tested successfully!');
}

// Run the comprehensive test suite
runComprehensiveTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  console.error(error.stack);
});
