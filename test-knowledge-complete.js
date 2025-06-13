// Test script for knowledge tools
import KnowledgeStorage from './src/knowledge/storage.js';

const storage = new KnowledgeStorage();

async function testKnowledgeSystem() {
  console.log('Testing Knowledge System...\n');

  try {
    // Test 1: Add knowledge
    console.log('1. Adding knowledge entry...');
    const result1 = await storage.addEntry(
      'This is a test knowledge entry about MCP servers and knowledge management.',
      { title: 'Test Entry', category: 'testing' }
    );
    console.log('✅ Added:', result1);

    // Test 2: Get knowledge
    console.log('\n2. Retrieving knowledge entry...');
    const entry = await storage.getEntry(result1.id);
    console.log('✅ Retrieved:', { id: entry.id, title: entry.metadata.title });

    // Test 3: Update knowledge
    console.log('\n3. Updating knowledge entry...');
    const result2 = await storage.updateEntry(
      result1.id,
      'Updated content about MCP servers with more details.',
      { title: 'Updated Test Entry', category: 'updated-testing' }
    );
    console.log('✅ Updated:', result2);

    // Test 4: Search knowledge
    console.log('\n4. Searching knowledge...');
    const searchResults = await storage.searchEntries('MCP');
    console.log('✅ Search results:', searchResults.length, 'entries found');

    // Test 5: List all knowledge
    console.log('\n5. Listing all knowledge...');
    const allEntries = await storage.listEntries();
    console.log('✅ Total entries:', allEntries.length);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testKnowledgeSystem();
