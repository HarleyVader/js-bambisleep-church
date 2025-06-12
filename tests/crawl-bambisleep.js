/**
 * 🎭 Bambisleep.info Crawler Script
 * Uses the LMStudio MCP Worker to ethically crawl bambisleep.info
 */

const LMStudioWorker = require('../src/mcp/lmstudioWorker');
const fs = require('fs').promises;
const path = require('path');

async function crawlBambisleepInfo() {
    console.log('🎭 Starting Bambisleep.info Crawl with Poetic Precision');
    console.log('═══════════════════════════════════════════════════════');
      const worker = new LMStudioWorker({
        model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0',
        baseUrl: 'http://192.168.0.69:7777'
    });try {
        // Initialize the worker
        console.log('\n📚 Initializing LMStudio worker...');
        await worker.initialize();
        console.log('✅ Worker initialized successfully');
        
        // URLs to crawl from bambisleep.info
        const urlsToCrawl = [
            'https://bambisleep.info/',
            'https://bambisleep.info/Bambi_Sleep_FAQ',
            'https://bambisleep.info/BS,_Consent,_And_You',
            'https://bambisleep.info/Triggers',
            'https://bambisleep.info/Beginner%27s_Files',
            'https://bambisleep.info/File_Transcripts',
            'https://bambisleep.info/Session_index',
            'https://bambisleep.info/Dominating_Bambi',
            'https://bambisleep.info/Third_Party_Files',
            'https://bambisleep.info/Third_Party_Triggers',
            'https://bambisleep.info/Advanced_Playlists'
        ];

        const crawlResults = [];
        const foundLinks = new Set();

        // Crawl each URL
        for (const url of urlsToCrawl) {
            console.log(`\n🕷️ Crawling: ${url}`);
            
            try {
                const result = await worker.handleToolCall('ethical_crawl', {
                    url,
                    respectRobots: true,
                    maxDepth: 1
                });
                
                if (result.status === 'success') {
                    console.log(`✅ Success: ${result.metadata.metadata.title}`);
                    crawlResults.push({
                        url,
                        title: result.metadata.metadata.title,
                        description: result.metadata.metadata.description,
                        links: result.metadata.metadata.links,
                        images: result.metadata.metadata.images,
                        bambisleepContent: result.metadata.metadata.bambisleepContent,
                        crawledAt: new Date().toISOString()
                    });
                    
                    // Collect unique links for further exploration
                    result.metadata.metadata.links.forEach(link => {
                        if (link.includes('bambisleep')) {
                            foundLinks.add(link);
                        }
                    });
                } else {
                    console.log(`❌ Failed: ${result.message}`);
                }
                
                // Respectful delay between requests
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`💥 Error crawling ${url}:`, error.message);
            }
        }

        // Save results to data files
        console.log('\n💾 Saving crawl results to data files...');
        
        // Convert results to links format
        const linksData = crawlResults.map((result, index) => ({
            id: index + 1,
            title: result.title,
            url: result.url,
            description: result.description,
            type: 'website',
            theme: 'official',
            submittedBy: 'LMStudio-MCP-Worker',
            submittedAt: result.crawledAt,
            upvotes: 0,
            downvotes: 0,
            metadata: {
                images: result.images,
                bambisleepContent: result.bambisleepContent,
                linkCount: result.links.length
            }
        }));

        // Save to links.json
        const linksPath = path.join(__dirname, '../data/links.json');
        await fs.writeFile(linksPath, JSON.stringify(linksData, null, 2));
        console.log(`📝 Saved ${linksData.length} links to ${linksPath}`);

        // Generate sitemap
        console.log('\n🗺️ Generating sitemap...');
        const sitemapResult = await worker.handleToolCall('build_sitemap', {
            domain: 'bambisleep.info',
            format: 'json'
        });
        
        if (sitemapResult.status === 'generated') {
            const sitemapPath = path.join(__dirname, '../data/bambisleep-sitemap.json');
            await fs.writeFile(sitemapPath, JSON.stringify(sitemapResult.sitemap, null, 2));
            console.log(`🗺️ Saved sitemap to ${sitemapPath}`);
        }

        // Catalog bambisleep content
        console.log('\n📦 Cataloging bambisleep content...');
        const catalogResults = [];
        
        for (const url of urlsToCrawl.slice(0, 3)) { // Limit to first few for demo
            const catalogResult = await worker.handleToolCall('catalog_bambisleep', {
                url,
                contentTypes: ['files', 'images', 'videos', 'audios', 'hypnos']
            });
            
            if (catalogResult.status === 'cataloged') {
                catalogResults.push(catalogResult);
            }
        }

        // Save catalog
        if (catalogResults.length > 0) {
            const catalogPath = path.join(__dirname, '../data/bambisleep-catalog.json');
            await fs.writeFile(catalogPath, JSON.stringify(catalogResults, null, 2));
            console.log(`📦 Saved content catalog to ${catalogPath}`);
        }

        // Final status
        console.log('\n📊 Final crawler status:');
        const status = worker.getStatus();
        console.log(JSON.stringify(status, null, 2));
        
        console.log('\n🎭 Summary:');
        console.log(`├── URLs crawled: ${status.visitedUrls}`);
        console.log(`├── Sitemap entries: ${status.sitemapEntries}`);
        console.log(`├── Files found: ${status.bambisleepCatalog.files}`);
        console.log(`├── Images found: ${status.bambisleepCatalog.images}`);
        console.log(`├── Videos found: ${status.bambisleepCatalog.videos}`);
        console.log(`├── Audios found: ${status.bambisleepCatalog.audios}`);
        console.log(`└── Hypnos found: ${status.bambisleepCatalog.hypnos}`);
        
        console.log('\n✨ Bambisleep.info crawl completed with poetic precision!');
        console.log('═══════════════════════════════════════════════════════');
          } catch (error) {
        console.error('💥 Crawl failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the crawler
if (require.main === module) {
    crawlBambisleepInfo();
}

module.exports = crawlBambisleepInfo;
