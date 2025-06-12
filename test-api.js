#!/usr/bin/env node
/**
 * 💖 AI Girlfriend Agent API Test
 * Tests the web API endpoints
 */

const http = require('http');
const app = require('./src/app'); // Assuming the Express app is exported

async function testAPI() {
    console.log('💖 Testing AI Girlfriend Agent API');
    console.log('═══════════════════════════════════════');
    
    // Start server on a test port
    const server = app.listen(3001, () => {
        console.log('📡 Test server started on port 3001');
    });
    
    try {
        await testParseUrls();
        await testGenerateIframes();
        console.log('\n🎉 All API tests passed!');
    } catch (error) {
        console.error('\n💥 API tests failed:', error.message);
    } finally {
        server.close();
    }
}

async function testParseUrls() {
    console.log('\n🔍 Testing URL parsing API...');
    
    const data = JSON.stringify({
        urls: [
            'https://example.com/page?utm_source=google&campaign=test',
            'https://bambisleep.info/content?v=123',
            'https://site.com/file.php?session=abc&token=xyz'
        ]
    });
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/ai-girlfriend/parse-urls',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    console.log('✅ URL parsing response:', result.success);
                    console.log(`   Total URLs: ${result.summary?.total || 0}`);
                    console.log(`   With arguments: ${result.summary?.withArguments || 0}`);
                    console.log(`   Bambisleep URLs: ${result.summary?.bambisleepUrls || 0}`);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function testGenerateIframes() {
    console.log('\n🎬 Testing iframe generation API...');
    
    const data = JSON.stringify({
        urls: [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.instagram.com/p/ABC123/',
            'https://twitter.com/user/status/123456789'
        ]
    });
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/ai-girlfriend/generate-iframes',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    console.log('✅ Iframe generation response:', result.success);
                    console.log(`   Generated iframes: ${result.count || 0}`);
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

if (require.main === module) {
    testAPI().catch(console.error);
}
