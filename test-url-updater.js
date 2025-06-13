// Test script for URL updater functionality
import { analyzeUrls } from './src/mcp/tools/urlAnalyzer.js';
import { analyzeAndPrepareForFrontend, generateFrontendUpdateScript } from './src/utils/urlUpdater.js';

// Sample URLs for testing
const testUrls = [
    'https://youtube.com/watch?v=sample1',
    'https://soundcloud.com/example/track',
    'https://patreon.com/creator1',
    'https://reddit.com/r/bambisleep',
    'https://twitter.com/hypnouser'
];

async function testUrlUpdater() {
    console.log('🧪 Testing URL Updater functionality...\n');
    
    try {
        // Step 1: Analyze URLs
        console.log('📊 Step 1: Analyzing URLs...');
        const analysis = await analyzeUrls(testUrls);
        
        if (analysis.status === 'error') {
            console.error('❌ Analysis failed:', analysis.error);
            return;
        }
        
        console.log(`✅ Analyzed ${analysis.statistics.totalUrls} URLs`);
        console.log(`   - Successful: ${analysis.statistics.successful}`);
        console.log(`   - Failed: ${analysis.statistics.failed}`);
        console.log(`   - Domains: ${analysis.statistics.domains.join(', ')}\n`);
        
        // Step 2: Prepare for frontend
        console.log('🔄 Step 2: Preparing for frontend integration...');
        const frontendResult = await analyzeAndPrepareForFrontend(analysis, 'test-urls.json');
        
        if (frontendResult.status === 'error') {
            console.error('❌ Frontend preparation failed:', frontendResult.error);
            return;
        }
        
        console.log('✅ Frontend files generated:');
        console.log(`   - JSON file: ${frontendResult.urls.filename}`);
        console.log(`   - Script file: ${frontendResult.script.filename}`);
        console.log(`   - Total URLs: ${frontendResult.summary.totalUrls}`);
        console.log(`   - Platforms: ${frontendResult.summary.platforms.join(', ')}\n`);
        
        // Step 3: Generate browser console script
        console.log('🖥️  Step 3: Browser console script:');
        console.log('Copy and paste the following into your browser console on the index page:\n');
        
        // Create a simple test script for immediate use
        const simpleScript = `
// Simple test URLs for immediate testing
const testUrls = [
    {
        url: 'https://youtube.com/watch?v=test123',
        title: 'Test Bambi Sleep Video',
        type: 'video'
    },
    {
        url: 'https://soundcloud.com/test/audio',
        title: 'Test Bambi Audio Track',
        type: 'audio'
    },
    {
        url: 'https://patreon.com/testcreator',
        title: 'Test Creator Page',
        type: 'creator'
    }
];

console.log('Adding test URLs...');
window.urlUpdater.addUrls(testUrls);
console.log('Test URLs added! Check the display.');`;
        
        console.log(simpleScript);
        console.log('\n📝 Instructions:');
        console.log('1. Open the website in your browser');
        console.log('2. Open browser developer tools (F12)');
        console.log('3. Go to Console tab');
        console.log('4. Paste the script above and press Enter');
        console.log('5. The new URLs should appear in the platform categories');
        console.log('\n🧹 To clear test data: window.urlUpdater.clearUrls()');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testUrlUpdater();
