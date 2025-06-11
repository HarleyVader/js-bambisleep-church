/**
 * Example usage of the standalone MCP server
 * Demonstrates URL fetching and data management
 */

const SimpleMcpClient = require('../src/mcp/simpleMcpClient');

async function demonstrateUsage() {
    const client = new SimpleMcpClient();
    
    try {
        console.log('Connecting to MCP server...');
        await client.connect();
        console.log('✓ Connected!\n');

        // 1. List available tools
        console.log('=== Available Tools ===');
        const tools = await client.listTools();
        tools.tools.forEach(tool => {
            console.log(`- ${tool.name}: ${tool.description}`);
        });
        console.log();

        // 2. List available resources
        console.log('=== Available Resources ===');
        const resources = await client.listResources();
        resources.resources.forEach(resource => {
            console.log(`- ${resource.uri}: ${resource.description}`);
        });
        console.log();

        // 3. Read current links data
        console.log('=== Current Links Data ===');
        const linksData = await client.readDataFile('links');
        console.log(`Found ${linksData.count} links`);
        if (linksData.data.length > 0) {
            console.log('Recent links:');
            linksData.data.slice(-3).forEach(link => {
                console.log(`  - ${link.title || link.url}`);
            });
        }
        console.log();

        // 4. Fetch a URL and extract data
        console.log('=== Fetching URL ===');
        const urlResult = await client.fetchUrl('https://httpbin.org/json', {
            extractData: true
        });
        console.log(`Fetched: ${urlResult.url}`);
        console.log(`Status: ${urlResult.statusCode}`);
        console.log(`Content length: ${urlResult.length} bytes`);
        if (urlResult.extractedData) {
            console.log(`Extracted title: ${urlResult.extractedData.title}`);
        }
        console.log();

        // 5. Add a new link to the data
        console.log('=== Adding New Link ===');
        const newLink = {
            id: 'demo-' + Date.now(),
            title: 'Demo Link from MCP',
            url: 'https://httpbin.org/json',
            type: 'website',
            description: 'A test link added via MCP server',
            timestamp: new Date().toISOString(),
            votes: { up: 0, down: 0 }
        };

        const writeResult = await client.writeDataFile('links', newLink, 'append');
        console.log(`✓ Added new link (total: ${writeResult.count})`);
        console.log();

        // 6. Read the updated data
        console.log('=== Updated Links Data ===');
        const updatedLinks = await client.readDataFile('links');
        console.log(`Now have ${updatedLinks.count} links`);
        const lastLink = updatedLinks.data[updatedLinks.data.length - 1];
        console.log(`Last added: ${lastLink.title}`);
        console.log();

        // 7. Demonstrate URL processing
        console.log('=== Processing URL Content ===');
        const htmlContent = '<html><head><title>Test Page</title><meta name="description" content="A test page"></head><body>Hello World</body></html>';
        const processed = await client.processUrlContent(htmlContent, 'http://example.com', 'metadata');
        console.log('Processed content:');
        console.log(`  Title: ${processed.extractedData.title}`);
        console.log(`  Description: ${processed.extractedData.description}`);
        console.log(`  Type: ${processed.extractedData.type}`);
        console.log();

        console.log('=== Demo Complete ===');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.disconnect();
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateUsage().catch(console.error);
}

module.exports = { demonstrateUsage };
