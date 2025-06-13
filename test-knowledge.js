// Simple test for knowledge tools
import { searchKnowledge, addKnowledge, listKnowledge } from './src/mcp/tools/knowledgeTools.js';

async function testKnowledgeTools() {
  console.log('Testing Knowledge Tools...\n');
  
  try {
    // Test adding knowledge
    console.log('1. Adding knowledge entry...');
    const addResult = await addKnowledge({
      content: 'This is a test knowledge entry about Bambi Sleep meditation techniques.',
      title: 'Bambi Sleep Basics',
      category: 'meditation'
    });
    console.log(addResult);
    
    // Test listing knowledge
    console.log('\n2. Listing all knowledge entries...');
    const listResult = await listKnowledge();
    console.log(listResult);
    
    // Test searching knowledge
    console.log('\n3. Searching for "Bambi"...');
    const searchResult = await searchKnowledge({ query: 'Bambi' });
    console.log(searchResult);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testKnowledgeTools();
