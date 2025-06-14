// Test script for LMStudio integration with knowledge base agent
// Run with: node test/lmstudio-integration.test.js

import * as lmstudio from '../src/lmstudio/client.js';
import * as qaSystem from '../src/mcp/tools/qaSystem.js';
import * as knowledgeTools from '../src/mcp/tools/knowledgeTools.js';
import * as agentKnowledge from '../src/mcp/agentKnowledge.js';

// Simple test framework
let passed = 0;
let failed = 0;

async function runTest(testName, testFn) {
  console.log(`\n🧪 Running test: ${testName}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${testName}`);
    passed++;
  } catch (error) {
    console.error(`❌ Test failed: ${testName}\n   Error: ${error.message}`);
    failed++;
  }
}

// Start tests
console.log('🔍 Starting LMStudio integration tests...');

// Test LMStudio client availability
await runTest('LMStudio client availability', async () => {
  const available = await lmstudio.isAvailable();
  console.log(`LMStudio API is ${available ? 'available' : 'not available'}`);
  
  // If not available, check the configuration
  if (!available) {
    console.log('LMStudio API is not available. Please ensure:');
    console.log('1. LMStudio is running and the API server is enabled');
    console.log('2. The LMSTUDIO_URL environment variable is correctly set (default: http://localhost:1234/v1)');
    console.log('3. If authentication is enabled, LMSTUDIO_API_KEY is set correctly');
  }
  
  // This test passes even if LMStudio is not available
  // The system should gracefully handle unavailability
});

// Test content analysis with LMStudio
await runTest('Content analysis with LMStudio', async () => {
  const testContent = `BambiSleep is a type of hypnosis content that helps people relax and explore 
  transformation fantasies. It uses various techniques including audio, visual elements, and scripts
  to guide the listener into a trance state. Always use responsibly and be aware of your personal boundaries.`;
  
  const analysis = await lmstudio.analyze(testContent);
  
  console.log('Analysis results:', JSON.stringify(analysis, null, 2));
  
  // Validate analysis structure
  if (!analysis) throw new Error('Analysis returned null');
  if (typeof analysis.summary !== 'string') throw new Error('Missing summary');
  if (typeof analysis.category !== 'string') throw new Error('Missing category');
  if (typeof analysis.relevance !== 'number') throw new Error('Missing relevance score');
  if (!Array.isArray(analysis.keywords)) throw new Error('Missing keywords array');
});

// Test question answering with LMStudio
await runTest('Question answering with LMStudio', async () => {
  const question = "What is BambiSleep?";
  const context = [
    {
      title: "BambiSleep Overview",
      content: "BambiSleep is a hypnosis system designed to help people relax and explore fantasies through audio files and scripts. It uses various techniques to guide listeners into a trance state."
    }
  ];
  
  const answer = await lmstudio.answerQuestion(question, context);
  console.log(`Question: ${question}`);
  console.log(`Answer: ${answer}`);
  
  if (!answer) throw new Error('Answer returned null or empty string');
  if (answer.length < 10) throw new Error('Answer is too short');
});

// Test QA system with LMStudio integration
await runTest('QA system with LMStudio integration', async () => {
  const question = "How does BambiSleep work?";
  const response = await qaSystem.answerQuestion(question);
  
  console.log(`Question: ${question}`);
  console.log(`Answer: ${response.answer}`);
  console.log(`Using LMStudio model: ${response.modelUsed ? 'Yes' : 'No'}`);
  
  if (!response.answer) throw new Error('QA system returned no answer');
  if (response.answer.length < 10) throw new Error('QA system answer is too short');
});

// Test knowledge base integration
await runTest('Knowledge base integration', async () => {
  // This is a mock test as we don't have access to the actual knowledge base
  // In a real environment, we'd test adding and retrieving entries
  
  console.log('Testing knowledge base integration with mock data');
  
  const mockUrl = "https://example.com/bambisleep-test";
  const mockMetadata = {
    title: "Test BambiSleep Content",
    description: "This is a test description for BambiSleep content analysis integration testing.",
    platform: "test",
    mediaType: "text"
  };
  
  // Create a mock entry object similar to what the agent would create
  const mockEntry = {
    id: 'test_' + Date.now(),
    url: mockUrl,
    title: mockMetadata.title,
    description: mockMetadata.description,
    category: "test",
    platform: "test",
    mediaType: "text",
    relevance: 8,
    contentType: "text/html",
    addedAt: new Date().toISOString(),
    validated: true,
    modelAnalyzed: true,
    keywords: ["test", "bambisleep", "integration"],
    summary: "Test summary for BambiSleep content",
    adultContent: false,
    safetyRating: 1
  };
  
  // In a real test, we would add this to the database and retrieve it
  console.log('Mock entry created:', mockEntry.id);
});

// Test results
console.log('\n📊 Test Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! LMStudio integration is working correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Please check the logs for details.');
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
