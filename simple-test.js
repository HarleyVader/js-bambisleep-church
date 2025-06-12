const AIGirlfriendAgent = require('./src/agents/aiGirlfriendAgent');

console.log('💖 Simple AI Girlfriend Agent Test');
console.log('Type of import:', typeof AIGirlfriendAgent);

try {
    const agent = new AIGirlfriendAgent({
        maxDepth: 1,
        maxPages: 5,
        crawlDelay: 500
    });
    
    console.log('✅ Agent created successfully');
    
    // Test URL argument parsing
    const testUrl = 'https://example.com/page?utm_source=test&v=123';
    const args = agent.parseUrlArguments(testUrl);
    console.log('URL arguments:', args);
    
    // Test platform detection
    const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const platform = agent.detectPlatform(youtubeUrl);
    console.log('Detected platform:', platform);
    
    // Test iframe generation
    if (platform) {
        const iframe = agent.generatePlatformIframe(youtubeUrl, platform);
        console.log('Generated iframe:', iframe ? 'Yes' : 'No');
    }
    
    console.log('🎉 All basic tests passed!');
    
} catch (error) {
    console.error('💥 Error:', error.message);
    console.error(error.stack);
}
