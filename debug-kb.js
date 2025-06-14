// Debug script to check duplicate detection
import { loadDB } from './src/mcp/agentKnowledge.js';

const db = loadDB();
console.log('Current knowledge base entries:');
db.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry.title} - ${entry.url}`);
});

console.log('\nLooking for bambisleep.info entries...');
const bambiEntries = db.filter(entry => entry.url.includes('bambisleep.info'));
bambiEntries.forEach(entry => {
  console.log('\n--- Bambi Entry ---');
  console.log('URL:', entry.url);
  console.log('Title:', entry.title);
  console.log('Description:', entry.description.substring(0, 200) + '...');
});
