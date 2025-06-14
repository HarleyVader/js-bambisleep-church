// Minimal test for agent.js
const agent = require('./agent');

console.log('Files:', agent.listFiles());
console.log('Echo:', agent.echo('Hello MCP!'));
console.log('Prompt:', agent.summarizeFilePrompt('example.txt'));
// Uncomment to test file reading (ensure file exists):
// console.log('File contents:', agent.readFile('example.txt'));
