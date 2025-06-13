// URL Updater utility for integrating crawled URLs with the frontend
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

// Convert analysis results to frontend-compatible format
export function convertAnalysisToUrls(analysisResult) {
    const urls = [];
    
    if (analysisResult.allResults) {
        analysisResult.allResults.forEach(result => {
            if (result.status === 'success' && result.metadata) {
                const url = {
                    url: result.url,
                    title: result.metadata.title || result.url,
                    description: result.metadata.description || '',
                    type: result.metadata.type || 'website',
                    platform: extractPlatformFromUrl(result.url),
                    metadata: result.metadata
                };
                urls.push(url);
            }
        });
    }
    
    return urls;
}

// Extract platform name from URL
function extractPlatformFromUrl(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        const platformDomains = {
            'youtube.com': 'youtube',
            'youtu.be': 'youtube',
            'soundcloud.com': 'soundcloud',
            'vimeo.com': 'vimeo',
            'patreon.com': 'patreon',
            'reddit.com': 'reddit',
            'twitter.com': 'twitter',
            'x.com': 'twitter',
            'spotify.com': 'spotify',
            'bandcamp.com': 'bandcamp',
            'pornhub.com': 'pornhub',
            'xvideos.com': 'xvideos',
            'ko-fi.com': 'ko-fi',
            'onlyfans.com': 'onlyfans',
            'twitch.tv': 'twitch',
            'dailymotion.com': 'dailymotion',
            'anchor.fm': 'anchor',
            'subscribestar.com': 'subscribestar',
            'gumroad.com': 'gumroad',
            'etsy.com': 'etsy',
            'xhamster.com': 'xhamster',
            'dropbox.com': 'dropbox',
            'mega.nz': 'mega',
            'drive.google.com': 'google-drive'
        };

        // Check for exact match
        if (platformDomains[hostname]) {
            return platformDomains[hostname];
        }

        // Check for subdomain matches
        for (const [domain, platform] of Object.entries(platformDomains)) {
            if (hostname.endsWith(domain)) {
                return platform;
            }
        }

        return 'website';
    } catch (e) {
        return 'website';
    }
}

// Save URLs to a JSON file that can be imported into the frontend
export async function saveUrlsForFrontend(urls, filename = null) {
    try {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `crawled-urls-${timestamp}.json`;
        }

        const outputPath = join(process.cwd(), 'data', 'analysis', filename);
        
        const frontendData = urls.map(url => ({
            id: `crawled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: url.url,
            title: url.title,
            description: url.description,
            type: url.type,
            platform: url.platform,
            addedAt: new Date().toISOString()
        }));

        await writeFile(outputPath, JSON.stringify(frontendData, null, 2), 'utf8');
        
        return {
            status: 'success',
            filename,
            path: outputPath,
            count: urls.length,
            platforms: [...new Set(urls.map(u => u.platform))],
            savedAt: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
}

// Generate JavaScript code to add URLs to frontend
export function generateFrontendUpdateScript(urls) {
    const jsCode = `
// Auto-generated script to add crawled URLs to frontend
// Copy and paste this into the browser console on the index page

const urlsToAdd = ${JSON.stringify(urls, null, 2)};

console.log('Adding', urlsToAdd.length, 'URLs to frontend...');
const result = window.urlUpdater.addUrls(urlsToAdd);
console.log('Added URLs:', result);
`;

    return jsCode;
}

// Complete workflow: analyze -> convert -> save for frontend
export async function analyzeAndPrepareForFrontend(analysisResult, filename = null) {
    try {
        // Convert analysis to URL format
        const urls = convertAnalysisToUrls(analysisResult);
        
        if (urls.length === 0) {
            return {
                status: 'warning',
                message: 'No URLs found in analysis result'
            };
        }

        // Save for frontend import
        const saveResult = await saveUrlsForFrontend(urls, filename);
        
        if (saveResult.status === 'error') {
            return saveResult;
        }

        // Generate update script
        const script = generateFrontendUpdateScript(urls);
        const scriptFilename = filename ? filename.replace('.json', '.js') : `update-script-${new Date().toISOString().replace(/[:.]/g, '-')}.js`;
        const scriptPath = join(process.cwd(), 'data', 'analysis', scriptFilename);
        
        await writeFile(scriptPath, script, 'utf8');

        return {
            status: 'success',
            urls: saveResult,
            script: {
                filename: scriptFilename,
                path: scriptPath
            },
            summary: {
                totalUrls: urls.length,
                platforms: saveResult.platforms,
                instructions: 'Run the generated script in browser console or import JSON manually'
            }
        };
    } catch (error) {
        return {
            status: 'error',
            error: error.message
        };
    }
}
