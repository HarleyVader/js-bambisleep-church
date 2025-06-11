/**
 * Complete MCP Integration Demo
 * Shows URL fetching, data processing, and file integration
 */

const SimpleMcpClient = require('../src/mcp/simpleMcpClient');

async function completeMcpDemo() {
    const client = new SimpleMcpClient();
    
    try {
        console.log('🚀 Starting Complete MCP Integration Demo\n');
        
        // Connect to server
        console.log('1. Connecting to MCP server...');
        await client.connect();
        console.log('   ✓ Connected successfully!\n');

        // List capabilities
        console.log('2. Server Capabilities:');
        const tools = await client.listTools();
        console.log(`   📋 Tools available: ${tools.tools.length}`);
        tools.tools.forEach(tool => console.log(`      - ${tool.name}`));
        
        const resources = await client.listResources();
        console.log(`   📂 Resources available: ${resources.resources.length}`);
        resources.resources.forEach(resource => console.log(`      - ${resource.uri}`));
        console.log();

        // Read current data state
        console.log('3. Current Data State:');
        const linksData = await client.readDataFile('links');
        const commentsData = await client.readDataFile('comments');
        const creatorsData = await client.readDataFile('creators');
        const votesData = await client.readDataFile('votes');
        
        console.log(`   📊 Links: ${linksData.count} entries`);
        console.log(`   💬 Comments: ${commentsData.count} entries`);
        console.log(`   👥 Creators: ${creatorsData.count} entries`);
        console.log(`   🗳️  Votes: ${votesData.count} entries\n`);

        // Demonstrate URL fetching with different types
        console.log('4. URL Fetching & Processing:');
        
        // Fetch a simple website
        console.log('   🌐 Fetching example.com...');
        const webResult = await client.fetchUrl('http://example.com', {
            extractData: true
        });
        console.log(`      Status: ${webResult.statusCode}`);
        console.log(`      Title: ${webResult.extractedData.title}`);
        console.log(`      Type: ${webResult.extractedData.type}`);

        // Fetch JSON data
        console.log('   📡 Fetching JSON data...');
        const jsonResult = await client.fetchUrl('https://httpbin.org/json', {
            extractData: true
        });
        console.log(`      Status: ${jsonResult.statusCode}`);
        console.log(`      Content type detected: ${jsonResult.extractedData.type}`);
        console.log();

        // Process content manually
        console.log('5. Content Processing:');
        const htmlContent = `
            <html>
                <head>
                    <title>Test YouTube Video</title>
                    <meta name="description" content="A test video for demonstration">
                </head>
                <body>
                    <h1>YouTube Content</h1>
                    <video src="test.mp4"></video>
                </body>
            </html>
        `;
        
        const processed = await client.processUrlContent(
            htmlContent, 
            'https://youtube.com/watch?v=test123', 
            'link'
        );
        console.log(`   🎬 Processed YouTube-style content:`);
        console.log(`      Title: ${processed.extractedData.title}`);
        console.log(`      Description: ${processed.extractedData.description}`);
        console.log(`      Detected type: ${processed.extractedData.type}`);
        console.log();

        // Add new content to data files
        console.log('6. Data File Integration:');
        
        // Add a new link
        const newLink = {
            id: 'mcp-demo-' + Date.now(),
            title: 'MCP Demo Link',
            url: 'https://example.com/mcp-demo',
            type: 'website',
            description: 'A link added via MCP server demonstration',
            timestamp: new Date().toISOString(),
            votes: { up: 0, down: 0 },
            metadata: {
                addedVia: 'mcp-server',
                demo: true
            }
        };

        const linkResult = await client.writeDataFile('links', newLink, 'append');
        console.log(`   ➕ Added new link (total: ${linkResult.count})`);

        // Add a comment for the link
        const newComment = {
            id: 'comment-mcp-' + Date.now(),
            linkId: newLink.id,
            text: 'This is a test comment added via the MCP server!',
            timestamp: new Date().toISOString(),
            metadata: {
                addedVia: 'mcp-server'
            }
        };

        const commentResult = await client.writeDataFile('comments', newComment, 'append');
        console.log(`   💬 Added new comment (total: ${commentResult.count})`);

        // Add creator info
        const newCreator = {
            id: 'creator-mcp-' + Date.now(),
            name: 'MCP Demo Creator',
            description: 'A creator added via MCP server',
            links: [newLink.id],
            metadata: {
                addedVia: 'mcp-server',
                verified: false
            }
        };

        const creatorResult = await client.writeDataFile('creators', newCreator, 'append');
        console.log(`   👤 Added new creator (total: ${creatorResult.count})`);

        // Demonstrate filtering
        console.log('\n7. Data Filtering:');
        const mcpLinks = await client.readDataFile('links', { 
            'metadata.addedVia': 'mcp-server' 
        });
        console.log(`   🔍 Found ${mcpLinks.data.length} MCP-added links`);
        
        console.log('\n8. Resource Access:');
        const linkResource = await client.readResource('data://links');
        console.log(`   📋 Resource data length: ${linkResource.contents[0].text.length} characters`);

        console.log('\n✅ Complete MCP Integration Demo Finished!');
        console.log('\n📊 Final Statistics:');
        const finalLinks = await client.readDataFile('links');
        const finalComments = await client.readDataFile('comments');
        const finalCreators = await client.readDataFile('creators');
        
        console.log(`   Links: ${finalLinks.count} (+${finalLinks.count - linksData.count})`);
        console.log(`   Comments: ${finalComments.count} (+${finalComments.count - commentsData.count})`);
        console.log(`   Creators: ${finalCreators.count} (+${finalCreators.count - creatorsData.count})`);

        console.log('\n🎉 MCP Server is fully functional and integrated!');

    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        console.error(error.stack);
    } finally {
        setTimeout(() => {
            client.disconnect();
            process.exit(0);
        }, 2000);
    }
}

if (require.main === module) {
    completeMcpDemo();
}

module.exports = { completeMcpDemo };
