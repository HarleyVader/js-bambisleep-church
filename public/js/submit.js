// BambiSleep Content Discovery Agent Interface
// Simplified interface for the specialized bambisleep discovery agent

document.addEventListener('DOMContentLoaded', () => {
    // Initialize BambiSleep Discovery Agent
    if (typeof BambiSleepDiscoveryAgent !== 'undefined') {
        window.bambiSleepAgent = new BambiSleepDiscoveryAgent();
        window.bambiSleepAgent.initialize();
    } else {
        console.error('BambiSleep Discovery Agent not loaded');
    }
    
    // Legacy compatibility for any existing functionality
    setupLegacyFormHandlers();
});

function setupLegacyFormHandlers() {
    // Maintain compatibility with existing form elements
    const form = document.getElementById('bambisleepDiscoveryForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.bambiSleepAgent) {
                await window.bambiSleepAgent.startDiscovery();
            }
        });
    }
}

    const form = document.getElementById('unifiedSubmitForm');
    const urlInput = document.getElementById('url');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const submitButton = document.getElementById('submitButton');
    const urlValidation = document.getElementById('urlValidation');
    const metadataPreview = document.getElementById('metadataPreview');
    const metadataGrid = document.getElementById('metadataGrid');
    const qualityScore = document.getElementById('qualityScore');
    const messageContainer = document.getElementById('messageContainer');

    let validationTimeout;
    let currentMetadata = null;
    let isValidUrl = false;

    // URL input handler with debouncing
    urlInput.addEventListener('input', () => {
        clearTimeout(validationTimeout);
        const url = urlInput.value.trim();
        
        if (!url) {
            hideValidation();
            return;
        }

        // Basic URL format check
        try {
            new URL(url);
        } catch {
            showValidationState('invalid', 'Invalid URL format');
            return;
        }

        // Debounced metadata fetching
        validationTimeout = setTimeout(() => {
            validateAndFetchMetadata(url);
        }, 1000);
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!isValidUrl || !currentMetadata) {
            showMessage('Please enter a valid URL with detectable metadata', 'error');
            return;
        }

        await submitContent();
    });

    // Validate URL and fetch metadata
    async function validateAndFetchMetadata(url) {
        showValidationState('validating', 'Checking URL and extracting metadata...');
        
        try {
            const response = await fetch('/api/metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (response.ok) {
                const metadata = await response.json();
                
                // Validate metadata quality
                const validation = await validateMetadataQuality(metadata);
                
                if (validation.valid) {
                    currentMetadata = validation.metadata;
                    isValidUrl = true;
                    showValidationState('valid', `✓ Valid ${metadata.platform} ${metadata.type} detected`);
                    showMetadataPreview(validation.metadata, validation.score);
                    enableSubmission();
                    
                    // Auto-fill title and description if empty
                    if (!titleInput.value && metadata.title) {
                        titleInput.value = metadata.title;
                    }
                    if (!descriptionInput.value && metadata.description) {
                        descriptionInput.value = metadata.description;
                    }
                } else {
                    isValidUrl = false;
                    showValidationState('invalid', `✗ ${validation.reason}`);
                    hideMetadataPreview();
                    disableSubmission();
                }            } else {
                const error = await response.json();
                console.error('Metadata fetch failed with status:', response.status, error);
                isValidUrl = false;
                showValidationState('invalid', `✗ ${error.error || 'Failed to fetch metadata'}`);
                hideMetadataPreview();
                disableSubmission();
            }
        } catch (error) {
            console.error('Metadata validation error:', error);
            isValidUrl = false;
            showValidationState('invalid', '✗ Network error - please try again');
            hideMetadataPreview();
            disableSubmission();
        }
    }

    // Client-side metadata quality validation
    async function validateMetadataQuality(metadata) {
        if (!metadata) {
            return {
                valid: false,
                reason: 'No metadata could be extracted'
            };
        }

        // Check for essential components
        const hasTitle = metadata.title && 
                        metadata.title.length > 3 && 
                        !metadata.title.includes('Error') &&
                        metadata.title !== metadata.platform;

        const hasType = metadata.type && 
                       metadata.type !== 'link' && 
                       metadata.type !== 'webpage';

        const hasValidPlatform = metadata.platform && 
                               metadata.platform !== 'unknown' && 
                               metadata.platform !== 'generic';

        const hasCreatorInfo = metadata.uploader || 
                             metadata.author || 
                             extractCreatorFromUrl(urlInput.value);

        // Quality scoring
        let score = 0;
        if (hasTitle) score += 3;
        if (hasType) score += 2;
        if (hasValidPlatform) score += 2;
        if (hasCreatorInfo) score += 2;
        if (metadata.description && metadata.description.length > 10) score += 1;

        const minimumScore = 6;
        
        if (score < minimumScore) {
            const missingElements = [];
            if (!hasTitle) missingElements.push('meaningful title');
            if (!hasType) missingElements.push('content type');
            if (!hasValidPlatform) missingElements.push('recognized platform');
            if (!hasCreatorInfo) missingElements.push('creator/uploader info');

            return {
                valid: false,
                reason: `Insufficient metadata quality. Missing: ${missingElements.join(', ')}`,
                score: score
            };
        }

        // Add creator info if missing
        if (!hasCreatorInfo) {
            const extractedCreator = extractCreatorFromUrl(urlInput.value);
            if (extractedCreator) {
                metadata.uploader = extractedCreator;
            }
        }

        return {
            valid: true,
            score: score,
            metadata: metadata
        };
    }

    // Extract creator from URL patterns
    function extractCreatorFromUrl(url) {
        try {
            const patterns = [
                /patreon\.com\/([^\/\?]+)/,
                /ko-fi\.com\/([^\/\?]+)/,
                /youtube\.com\/(?:@|c\/|channel\/|user\/)([^\/\?]+)/,
                /soundcloud\.com\/([^\/\?]+)/,
                /vimeo\.com\/([^\/\?]+)/,
                /bambicloud\.com\/(?:user\/)?([^\/\?]+)/,
                /hypnotube\.com\/(?:user\/)?([^\/\?]+)/
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    return match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
            }
        } catch (error) {
            console.error('Error extracting creator:', error);
        }
        return null;
    }

    // Show validation state
    function showValidationState(state, message) {
        urlValidation.className = `url-validation ${state}`;
        urlValidation.innerHTML = state === 'validating' ? 
            '<div class="spinner"></div>' + message : 
            message;
        urlValidation.style.display = 'block';
    }

    // Hide validation
    function hideValidation() {
        urlValidation.style.display = 'none';
        hideMetadataPreview();
        disableSubmission();
    }

    // Show metadata preview
    function showMetadataPreview(metadata, score) {
        const platformIcon = getPlatformIcon(metadata.platform);
        
        metadataGrid.innerHTML = `
            <span class="metadata-label">Platform:</span>
            <span class="metadata-value">
                <span class="platform-badge">
                    ${platformIcon} ${metadata.platform}
                </span>
            </span>
            
            <span class="metadata-label">Type:</span>
            <span class="metadata-value">${metadata.type}</span>
            
            <span class="metadata-label">Title:</span>
            <span class="metadata-value">${metadata.title}</span>
            
            ${metadata.uploader ? `
                <span class="metadata-label">Creator:</span>
                <span class="metadata-value">${metadata.uploader}</span>
            ` : ''}
            
            ${metadata.description ? `
                <span class="metadata-label">Description:</span>
                <span class="metadata-value">${truncateText(metadata.description, 100)}</span>
            ` : ''}
            
            ${metadata.isEmbeddable ? `
                <span class="metadata-label">Features:</span>
                <span class="metadata-value">▶️ Playable in browser</span>
            ` : ''}
        `;

        // Quality score
        let scoreClass = 'low';
        if (score >= 8) scoreClass = 'high';
        else if (score >= 6) scoreClass = 'medium';
        
        qualityScore.className = `quality-score ${scoreClass}`;
        qualityScore.textContent = `Quality: ${score}/10`;

        metadataPreview.style.display = 'block';
    }

    // Hide metadata preview
    function hideMetadataPreview() {
        metadataPreview.style.display = 'none';
    }

    // Enable submission
    function enableSubmission() {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit Content';
    }

    // Disable submission
    function disableSubmission() {
        submitButton.disabled = true;
        submitButton.textContent = 'Enter valid URL to submit';
        isValidUrl = false;
        currentMetadata = null;
    }

    // Submit content
    async function submitContent() {
        submitButton.disabled = true;
        submitButton.innerHTML = '<div class="spinner"></div>Submitting...';
        
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: urlInput.value.trim(),
                    title: titleInput.value.trim() || null,
                    description: descriptionInput.value.trim() || null
                })
            });

            if (response.ok) {
                const result = await response.json();
                showMessage(
                    `✓ Content submitted successfully! Detected as ${result.platform} ${result.contentType} (Quality Score: ${result.qualityScore}/10)`,
                    'success'
                );
                
                // Reset form
                form.reset();
                hideValidation();
                currentMetadata = null;
                isValidUrl = false;
                
                // Redirect after success
                setTimeout(() => {
                    window.location.href = '/platforms';
                }, 2000);            } else {
                const error = await response.json();
                console.error('Submit failed with status:', response.status, error);
                showMessage(`✗ Submission failed: ${error.message || 'Unknown error'}`, 'error');
                if (error.details) {
                    console.error('Submission error details:', error.details);
                }
            }
        } catch (error) {
            console.error('Submit error:', error);
            showMessage('✗ Network error - please try again', 'error');
        } finally {
            enableSubmission();
        }
    }

    // Show message
    function showMessage(text, type) {
        messageContainer.innerHTML = `<div class="${type}-message">${text}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }

    // Get platform icon
    function getPlatformIcon(platform) {
        const icons = {
            'youtube': '📺',
            'soundcloud': '🎵',
            'vimeo': '🎬',
            'patreon': '💰',
            'bambicloud': '🌙',
            'hypnotube': '💫',
            'twitter': '🐦',
            'spotify': '🎶',
            'bandcamp': '🎼',
            'direct': '📁',
            'generic': '🌐'
        };
        return icons[platform] || '🔗';
    }

    // Truncate text
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }    // ===============================
    // CRAWL FETCH AGENT FUNCTIONALITY
    // ===============================
    
    const crawlForm = document.getElementById('crawlFetchForm');
    const crawlUrlsInput = document.getElementById('crawlUrls');
    const crawlSubmitButton = document.getElementById('crawlSubmitButton');
    const crawlProgress = document.getElementById('crawlProgress');
    const feedResults = document.getElementById('feedResults');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const crawlLog = document.getElementById('crawlLog');
    const feedContainer = document.querySelector('#feedResults .feed-container');
    const sitemapResults = document.getElementById('sitemapResults');
    const bambisleepStat = document.getElementById('bambisleepStat');

    let crawlData = [];
    let crawlReport = null;
    let isGridView = true;

    // Advanced mode toggle
    document.getElementById('enableAdvanced').addEventListener('change', (e) => {
        const advancedOptions = document.getElementById('advancedOptions');
        const autoIndex = document.getElementById('autoIndex');
        const generateSitemap = document.getElementById('generateSitemap');
        
        if (e.target.checked) {
            advancedOptions.style.display = 'block';
            autoIndex.checked = true;
            generateSitemap.checked = true;
        } else {
            advancedOptions.style.display = 'none';
            autoIndex.checked = false;
            generateSitemap.checked = false;
        }
    });

    // Sitemap tab switching
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('sitemap-tab')) {
            const tab = e.target.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.sitemap-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show corresponding view
            document.querySelectorAll('.sitemap-view').forEach(v => v.classList.remove('active'));
            document.getElementById(tab + 'View').classList.add('active');
        }
    });

    // Download sitemap
    document.getElementById('downloadSitemap').addEventListener('click', () => {
        if (crawlReport && crawlReport.sitemap) {
            downloadSitemapAsJSON();
        }
    });

    // Crawl form submission
    crawlForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await startCrawlOperation();
    });

    // View mode toggle
    document.getElementById('toggleViewMode').addEventListener('click', () => {
        isGridView = !isGridView;
        feedContainer.className = `feed-container ${isGridView ? 'grid-view' : 'list-view'}`;
        document.getElementById('toggleViewMode').textContent = isGridView ? '📄 List View' : '🔲 Grid View';
    });

    // Bulk submit
    document.getElementById('bulkSubmit').addEventListener('click', async () => {
        await bulkSubmitToFeed();
    });

    // Export feed
    document.getElementById('exportFeed').addEventListener('click', () => {
        exportCrawlResults();
    });    // URL filtering function to remove file extensions (not content)
    function filterUrlList(urls) {
        const fileExtensions = [
            '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
            '.xls', '.xlsx', '.csv', '.ppt', '.pptx',
            '.zip', '.rar', '.7z', '.tar', '.gz',
            '.mp3', '.wav', '.flac', '.m4a', '.ogg',
            '.mp4', '.avi', '.mkv', '.mov', '.wmv',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg',
            '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm'
        ];
        
        return urls.filter(url => {
            try {
                const urlObj = new URL(url.trim());
                const pathname = urlObj.pathname.toLowerCase();
                
                // Check if URL ends with a file extension
                const hasFileExtension = fileExtensions.some(ext => pathname.endsWith(ext));
                
                if (hasFileExtension) {
                    logCrawlMessage('Filtered file URL: ' + url);
                    return false;
                }
                
                return true;
            } catch (error) {
                logCrawlMessage('Invalid URL filtered: ' + url);
                return false;
            }
        });
    }

    // Extract domain from URL
    function extractDomainFromUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return 'Unknown Site';
        }
    }

    // Update URL status display
    function updateUrlStatus(status, data = {}) {
        const statusIndicator = document.querySelector('.agent-status-indicator');
        const statusText = document.getElementById('agentStatusText');
        
        if (statusIndicator && statusText) {
            // Update status indicator
            statusIndicator.className = 'agent-status-indicator';
            
            switch (status) {
                case 'filtering':
                    statusIndicator.classList.add('filtering');
                    statusText.textContent = 'Filtering URLs';
                    break;
                case 'crawling':
                    statusIndicator.classList.add('crawling');
                    statusText.textContent = 'Agent Tools Crawling';
                    break;
                case 'active':
                    statusIndicator.classList.add('active');
                    statusText.textContent = 'Processing';
                    break;
                case 'idle':
                default:
                    statusText.textContent = 'Idle';
                    break;
            }
            
            // Update current site display
            if (data.currentSite) {
                const siteEl = document.getElementById('currentSiteDisplay');
                if (siteEl) siteEl.textContent = data.currentSite;
            }
            
            // Update URL counts if provided
            if (data.foundUrls !== undefined) {
                const el = document.getElementById('foundUrlsCount');
                if (el) el.textContent = data.foundUrls;
            }
            if (data.filteredUrls !== undefined) {
                const el = document.getElementById('filteredUrlsCount');
                if (el) el.textContent = data.filteredUrls;
            }
            if (data.addedUrls !== undefined) {
                const el = document.getElementById('addedUrlsCount');
                if (el) el.textContent = data.addedUrls;
            }
            if (data.totalUrls !== undefined) {
                const el = document.getElementById('totalUrlsCount');
                if (el) el.textContent = data.totalUrls;
            }
            if (data.finishedUrls !== undefined) {
                const el = document.getElementById('finishedUrlsCount');
                if (el) el.textContent = data.finishedUrls;
            }
            if (data.remainingUrls !== undefined) {
                const el = document.getElementById('remainingUrlsCount');
                if (el) el.textContent = data.remainingUrls;
            }
            if (data.currentUrl) {
                const el = document.getElementById('currentUrlDisplay');
                if (el) el.textContent = data.currentUrl;
            }
        }
    }

    // Test MCP server connection
    async function testMcpConnection() {
        try {
            const response = await fetch('/api/mcp/status');
            if (response.ok) {
                logCrawlMessage('MCP Server: Connected and ready');
                return true;
            } else {
                logCrawlMessage('MCP Server: Warning - Not responding');
                return false;
            }
        } catch (error) {
            logCrawlMessage('MCP Server: Error - ' + error.message);
            return false;
        }
    }

    async function startCrawlOperation() {
        const rawUrls = crawlUrlsInput.value.trim().split('\n').filter(url => url.trim());
        
        if (rawUrls.length === 0) {
            showCrawlMessage('Please enter at least one URL to crawl', 'error');
            return;
        }        // Filter out file URLs (not content URLs)
        const filteredUrls = filterUrlList(rawUrls);
        const foundCount = rawUrls.length;
        const filteredCount = foundCount - filteredUrls.length;
        const addedCount = filteredUrls.length;

        // Extract primary site being crawled
        const primarySite = filteredUrls.length > 0 ? extractDomainFromUrl(filteredUrls[0]) : 'Unknown';

        // Update status display
        updateUrlStatus('filtering', {
            foundUrls: foundCount,
            filteredUrls: filteredCount,
            addedUrls: addedCount,
            totalUrls: addedCount,
            finishedUrls: 0,
            remainingUrls: addedCount,
            currentUrl: 'Initializing...',
            currentSite: primarySite
        });

        if (filteredUrls.length === 0) {
            showCrawlMessage('All URLs were filtered out (likely file downloads). Please provide content URLs like web pages, videos, or playlists.', 'error');
            updateUrlStatus('idle');
            return;
        }

        logCrawlMessage('URL Processing: Found ' + foundCount + ', Filtered ' + filteredCount + ', Processing ' + addedCount);

        // Test MCP connection first
        await testMcpConnection();

        const options = {
            respectRobots: document.getElementById('respectRobots').checked,
            extractMedia: document.getElementById('extractMedia').checked,
            followLinks: document.getElementById('followLinks').checked,
            maxResults: parseInt(document.getElementById('maxResults').value)
        };

        // Check if advanced mode is enabled
        const isAdvanced = document.getElementById('enableAdvanced').checked;
        
        if (isAdvanced) {
            options.maxDepth = parseInt(document.getElementById('maxDepth').value);
            options.maxPages = parseInt(document.getElementById('maxPages').value);
            options.crawlDelay = parseInt(document.getElementById('crawlDelay').value);
            options.autoIndex = document.getElementById('autoIndex').checked;
            options.generateSitemap = document.getElementById('generateSitemap').checked;
        }

        // Show progress and hide results
        crawlProgress.style.display = 'block';
        feedResults.style.display = 'none';
        crawlData = [];
        crawlReport = null;

        // Disable form
        crawlSubmitButton.disabled = true;
        crawlSubmitButton.innerHTML = '<div class="spinner"></div>' + 
            (isAdvanced ? 'Advanced Crawling...' : 'Crawling...');

        // Initialize stats tracking
        initializeCrawlStats(filteredUrls);

        try {
            if (isAdvanced) {
                await processAdvancedCrawl(filteredUrls, options);
            } else {
                await processCrawlBatch(filteredUrls, options);
            }
        } catch (error) {
            console.error('Crawl operation failed:', error);
            showCrawlMessage('Crawl operation failed: ' + error.message, 'error');        } finally {
            crawlSubmitButton.disabled = false;
            crawlSubmitButton.textContent = '🚀 Start Crawl & Generate Feed';
            finalizeCrawlStats();
        }
    }

    async function processAdvancedCrawl(urls, options) {
        updateProgress(0, 'Initializing advanced crawl...');
        logCrawlMessage('🚀 Starting advanced crawl with sitemap generation');
        logCrawlMessage(`📊 Settings: Depth=${options.maxDepth}, Pages=${options.maxPages}, Delay=${options.crawlDelay}ms`);

        try {
            const response = await fetch('/api/crawl-advanced', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: urls,
                    options: options
                })
            });

            if (response.ok) {
                const result = await response.json();
                crawlReport = result.crawlReport;
                
                // Extract items for display
                if (crawlReport.bambisleepContent) {
                    crawlData = crawlReport.bambisleepContent;
                }
                
                logCrawlMessage(`🗺️ Sitemap generated: ${crawlReport.summary.totalUrls} pages`);
                logCrawlMessage(`🌙 Bambisleep content: ${crawlReport.summary.bambisleepContent} items found`);
                
                if (result.autoIndexed > 0) {
                    logCrawlMessage(`📚 Auto-indexed: ${result.autoIndexed} items added to database`);
                }
                
                updateProgress(100, 'Advanced crawl complete!');
                displayAdvancedCrawlResults();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Advanced crawl failed');
            }
        } catch (error) {
            logCrawlMessage(`❌ Advanced crawl error: ${error.message}`);
            throw error;
        }
    }    async function processCrawlBatch(urls, options) {
        const totalUrls = urls.length;
        let completedUrls = 0;

        updateProgress(0, `Starting crawl of ${totalUrls} URLs...`);
        logCrawlMessage(`🚀 Starting batch crawl of ${totalUrls} URLs`);        for (const url of urls) {
            try {
                // Extract domain for current URL status
                const currentSite = extractDomainFromUrl(url);
                
                // Update current URL status
                updateUrlStatus('crawling', {
                    currentUrl: url,
                    currentSite: currentSite,
                    finishedUrls: completedUrls,
                    remainingUrls: totalUrls - completedUrls
                });

                logCrawlMessage(`🕷️ Crawling: ${url} (${currentSite})`);
                updateProgress((completedUrls / totalUrls) * 100, `Crawling ${currentSite}...`);

                const result = await crawlSingleUrl(url, options);
                  if (result.success) {
                    crawlData.push(...result.items);
                    logCrawlMessage(`✅ Found ${result.items.length} items from ${url}`);
                    updateCrawlStats(completedUrls + 1, result.items.length);
                } else {
                    logCrawlMessage(`❌ Failed to crawl ${url}: ${result.error}`);
                    updateCrawlStats(completedUrls + 1, 0);
                }

                completedUrls++;
                updateProgress((completedUrls / totalUrls) * 100, 
                    `Completed ${completedUrls}/${totalUrls} URLs`);                // Update finished URLs status with current site
                updateUrlStatus('crawling', {
                    currentSite: currentSite,
                    finishedUrls: completedUrls,
                    remainingUrls: totalUrls - completedUrls
                });

                // Respectful delay
                await new Promise(resolve => setTimeout(resolve, 1000));            } catch (error) {
                logCrawlMessage(`💥 Error crawling ${url}: ${error.message}`);
                completedUrls++;
                updateCrawlStats(completedUrls, 0);
                  // Update error status with current site
                updateUrlStatus('crawling', {
                    currentSite: currentSite,
                    finishedUrls: completedUrls,
                    remainingUrls: totalUrls - completedUrls
                });
            }
        }        // Complete - set to idle status
        updateUrlStatus('idle', {
            currentUrl: 'Crawl completed',
            currentSite: 'All sites processed',
            finishedUrls: completedUrls,
            remainingUrls: 0
        });

        updateProgress(100, `Crawl completed! Found ${crawlData.length} items`);
        logCrawlMessage(`🎉 Crawl completed with ${crawlData.length} total items found`);

        if (crawlData.length > 0) {
            displayCrawlResults();
        } else {
            showCrawlMessage('No items were found from the crawled URLs', 'error');
        }
    }

    async function crawlSingleUrl(url, options) {
        try {
            // For demonstration, we'll use the enhanced fetch multiple endpoint
            const response = await fetch('/api/crawl-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: [url],
                    options: options
                })
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    items: result.items || []
                };
            } else {
                const error = await response.json();
                return {
                    success: false,
                    error: error.message || 'Failed to crawl URL'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };        }
    }

    function displayCrawlResults() {
        // Update stats
        document.getElementById('totalFound').textContent = crawlData.length;
        document.getElementById('mediaCount').textContent = crawlData.filter(item => 
            ['video', 'audio', 'image'].includes(item.type)).length;
        document.getElementById('platformCount').textContent = 
            new Set(crawlData.map(item => item.platform)).size;

        // Generate feed cards
        feedContainer.innerHTML = '';
        crawlData.forEach((item, index) => {
            const card = createMediaCard(item, index);
            feedContainer.appendChild(card);
        });

        // Show results
        feedResults.style.display = 'block';
        
        // Scroll to results
        feedResults.scrollIntoView({ behavior: 'smooth' });
    }

    function displayAdvancedCrawlResults() {
        // Update basic stats
        document.getElementById('totalFound').textContent = crawlData.length;
        document.getElementById('mediaCount').textContent = crawlData.filter(item => 
            ['video', 'audio', 'image'].includes(item.type)).length;
        document.getElementById('platformCount').textContent = 
            new Set(crawlData.map(item => item.platform)).size;

        // Show bambisleep stats if available
        if (crawlReport.summary.bambisleepContent > 0) {
            bambisleepStat.style.display = 'block';
            document.getElementById('bambisleepCount').textContent = crawlReport.summary.bambisleepContent;
        }

        // Show sitemap visualization if sitemap was generated
        if (crawlReport.sitemap) {
            sitemapResults.style.display = 'block';
            document.getElementById('downloadSitemap').style.display = 'inline-block';
            displaySitemapVisualization();
        }

        // Generate feed cards
        feedContainer.innerHTML = '';
        crawlData.forEach((item, index) => {
            const card = createMediaCard(item, index);
            feedContainer.appendChild(card);
        });

        // Show results
        feedResults.style.display = 'block';
        
        // Scroll to results
        feedResults.scrollIntoView({ behavior: 'smooth' });
    }

    function displaySitemapVisualization() {
        // Display hierarchy view
        displayHierarchyView();
        
        // Display link tree stats
        displayLinkTreeView();
        
        // Display domain analysis
        displayDomainAnalysis();
    }

    function displayHierarchyView() {
        const hierarchy = crawlReport.sitemap;
        const container = document.getElementById('sitemapHierarchy');
        
        let html = '';
        for (const [domain, domainData] of Object.entries(hierarchy)) {
            html += `<div class="domain-item">`;
            html += `<div class="domain-header">`;
            html += `<strong>🌐 ${domain}</strong>`;
            html += `<span class="domain-stats">(${domainData.totalPages} pages)</span>`;
            html += `</div>`;
            
            // Show subdomains
            if (domainData.subdomains && Object.keys(domainData.subdomains).length > 0) {
                for (const [subdomain, subData] of Object.entries(domainData.subdomains)) {
                    html += `<div class="folder-tree">`;
                    html += `<strong>📁 ${subdomain}</strong>`;
                    html += displayPages(subData.pages);
                    html += displayFolders(subData.folders);
                    html += `</div>`;
                }
            }
            
            // Show root pages
            if (domainData.pages && domainData.pages.length > 0) {
                html += displayPages(domainData.pages);
            }
            
            // Show root folders
            if (domainData.folders && Object.keys(domainData.folders).length > 0) {
                html += displayFolders(domainData.folders);
            }
            
            html += `</div>`;
        }
        
        container.innerHTML = html;
    }

    function displayPages(pages) {
        if (!pages || pages.length === 0) return '';
        
        let html = '';
        pages.forEach(page => {
            html += `<div class="page-item">`;
            html += `<span class="page-title">📄 ${page.title}</span>`;
            if (page.metadata.bambisleepScore > 0) {
                html += `<span class="page-score bambisleep">${page.metadata.bambisleepScore}</span>`;
            }
            html += `</div>`;
        });
        return html;
    }

    function displayFolders(folders) {
        if (!folders || Object.keys(folders).length === 0) return '';
        
        let html = '';
        for (const [folderName, folderData] of Object.entries(folders)) {
            html += `<div class="folder-tree">`;
            html += `<strong>📁 ${folderName}</strong>`;
            html += displayPages(folderData.pages);
            html += displayFolders(folderData.folders);
            html += `</div>`;
        }
        return html;
    }

    function displayLinkTreeView() {
        if (!crawlReport.linkTreeStats) return;
        
        const stats = crawlReport.linkTreeStats;
        const statsContainer = document.getElementById('linkTreeStats');
        
        statsContainer.innerHTML = `
            <div class="link-stat-item">
                <span class="link-stat-number">${stats.totalNodes}</span>
                <span class="link-stat-label">Total Nodes</span>
            </div>
            <div class="link-stat-item">
                <span class="link-stat-number">${stats.internalLinks}</span>
                <span class="link-stat-label">Internal Links</span>
            </div>
            <div class="link-stat-item">
                <span class="link-stat-number">${stats.externalLinks}</span>
                <span class="link-stat-label">External Links</span>
            </div>
            <div class="link-stat-item">
                <span class="link-stat-number">${stats.orphanPages}</span>
                <span class="link-stat-label">Orphan Pages</span>
            </div>
            <div class="link-stat-item">
                <span class="link-stat-number">${stats.connectivityScore}%</span>
                <span class="link-stat-label">Connectivity</span>
            </div>
        `;
        
        // Display hub pages
        const vizContainer = document.getElementById('linkTreeVisualization');
        let hubHtml = '<h5>🌟 Hub Pages (Most Connected)</h5>';
        
        if (stats.hubPages && stats.hubPages.length > 0) {
            stats.hubPages.slice(0, 5).forEach(hub => {
                hubHtml += `
                    <div class="hub-page">
                        <div class="hub-page-title">${hub.url}</div>
                        <div class="hub-page-stats">
                            📤 ${hub.outboundCount} outbound • 📥 ${hub.inboundCount} inbound
                        </div>
                    </div>
                `;
            });
        } else {
            hubHtml += '<p>No hub pages found</p>';
        }
        
        vizContainer.innerHTML = hubHtml;
    }

    function displayDomainAnalysis() {
        if (!crawlReport.domainAnalysis) return;
        
        const analysis = crawlReport.domainAnalysis;
        const container = document.getElementById('domainAnalysis');
        
        let html = '<h5>🌐 Domain Analysis</h5>';
        
        for (const [domain, data] of Object.entries(analysis)) {
            html += `
                <div class="domain-item">
                    <div class="domain-header">
                        <strong>${domain}</strong>
                        <span class="domain-stats">${data.pageCount} pages</span>
                    </div>
                    <div class="domain-details">
                        <p>🌿 Subdomains: ${data.subdomains.length}</p>
                        <p>🌙 Bambisleep Pages: ${data.bambisleepPages}</p>
                        ${data.avgBambisleepScore > 0 ? `
                            <p>📊 Avg Bambisleep Score: ${data.avgBambisleepScore}</p>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    function downloadSitemapAsJSON() {
        const sitemapData = {
            generatedAt: new Date().toISOString(),
            crawlSummary: crawlReport.summary,
            sitemap: crawlReport.sitemap,
            linkTree: crawlReport.linkTree,
            domainAnalysis: crawlReport.domainAnalysis,
            bambisleepContent: crawlReport.bambisleepContent
        };
        
        const blob = new Blob([JSON.stringify(sitemapData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sitemap-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showCrawlMessage('🗺️ Sitemap downloaded successfully!', 'success');
    }

    function createMediaCard(item, index) {
        const card = document.createElement('div');
        card.className = `media-card ${item.type || 'content'}`;
        card.dataset.index = index;

        const platformIcon = getPlatformIcon(item.platform);
        
        // Create media player based on type
        let mediaPlayer = '';
        if (item.type === 'video' && item.embedUrl) {
            mediaPlayer = `
                <div class="media-player">
                    <iframe src="${item.embedUrl}" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                    </iframe>
                </div>
            `;
        } else if (item.type === 'audio' && item.embedUrl) {
            mediaPlayer = `
                <div class="media-player">
                    <audio controls>
                        <source src="${item.embedUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            `;
        } else if (item.type === 'image' && item.embedUrl) {
            mediaPlayer = `
                <div class="media-player">
                    <img src="${item.embedUrl}" alt="${item.title}" loading="lazy">
                </div>
            `;
        }

        card.innerHTML = `
            <div class="media-header">
                <div class="media-platform">
                    <span>${platformIcon}</span>
                    <span>${item.platform}</span>
                </div>
                <span class="media-type-badge">${item.type || 'content'}</span>
            </div>
            
            <h4 class="media-title">
                <a href="${item.url}" target="_blank">${item.title}</a>
            </h4>
            
            ${item.description ? `
                <p class="media-description">${item.description}</p>
            ` : ''}
            
            ${mediaPlayer}
            
            <div class="media-meta">
                <div class="media-info">
                    ${item.uploader ? `<span>👤 ${item.uploader}</span>` : ''}
                    ${item.duration ? `<span>⏱️ ${item.duration}</span>` : ''}
                </div>
                <div class="media-actions">
                    <button class="media-action-btn" onclick="selectForSubmission(${index})">
                        📤 Select
                    </button>
                    <button class="media-action-btn" onclick="previewItem(${index})">
                        👁️ Preview
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    function updateProgress(percent, message) {
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${Math.round(percent)}%`;
        progressText.textContent = message;
    }

    function logCrawlMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        crawlLog.innerHTML += `[${timestamp}] ${message}\n`;
        crawlLog.scrollTop = crawlLog.scrollHeight;
    }

    function showCrawlMessage(text, type) {
        const messageContainer = document.getElementById('crawlMessageContainer');
        messageContainer.innerHTML = `<div class="${type}-message">${text}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }

    async function bulkSubmitToFeed() {
        const selectedItems = crawlData.filter((item, index) => {
            const card = document.querySelector(`[data-index="${index}"]`);
            return card && card.querySelector('.media-action-btn.selected');
        });

        if (selectedItems.length === 0) {
            showCrawlMessage('Please select at least one item to submit', 'error');
            return;
        }

        try {
            const response = await fetch('/api/bulk-submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    items: selectedItems
                })
            });

            if (response.ok) {
                const result = await response.json();
                showCrawlMessage(`✅ Successfully submitted ${result.count} items to the community feed!`, 'success');
                
                // Redirect to feed after success
                setTimeout(() => {
                    window.location.href = '/feed';
                }, 2000);
            } else {
                const error = await response.json();
                showCrawlMessage(`❌ Failed to submit items: ${error.message}`, 'error');
            }
        } catch (error) {
            showCrawlMessage(`❌ Network error during submission: ${error.message}`, 'error');
        }
    }

    function exportCrawlResults() {
        const exportData = {
            crawlTimestamp: new Date().toISOString(),
            totalItems: crawlData.length,
            platforms: [...new Set(crawlData.map(item => item.platform))],
            contentTypes: [...new Set(crawlData.map(item => item.type))],
            items: crawlData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crawl-results-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showCrawlMessage(`📄 Exported ${crawlData.length} items to JSON file!`, 'success');
    }

    // Global functions for media card interactions
    window.selectForSubmission = function(index) {
        const card = document.querySelector(`[data-index="${index}"]`);
        const button = card.querySelector('.media-action-btn');
        
        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
            button.textContent = '📤 Select';
        } else {
            button.classList.add('selected');
            button.textContent = '✅ Selected';
        }
    };

    window.previewItem = function(index) {
        const item = crawlData[index];
        
        // Open URL in new tab for preview
        window.open(item.url, '_blank');
    };

    // Enhanced Stats Tracking
    let crawlStats = {
        totalUrls: 0,
        completedUrls: 0,
        newlyAddedItems: 0,
        startTime: null,
        estimatedEndTime: null,
        avgProcessingTime: 0
    };

    let statsUpdateInterval = null;

    function initializeCrawlStats(urls) {
        crawlStats = {
            totalUrls: urls.length,
            completedUrls: 0,
            newlyAddedItems: 0,
            startTime: Date.now(),
            estimatedEndTime: null,
            avgProcessingTime: 0
        };
        
        // Start timer updates
        statsUpdateInterval = setInterval(updateStatsDisplay, 1000);
        updateStatsDisplay();
    }

    function updateCrawlStats(completed, newItems) {
        crawlStats.completedUrls = completed;
        crawlStats.newlyAddedItems += newItems;
        
        // Calculate average processing time
        const elapsed = Date.now() - crawlStats.startTime;
        crawlStats.avgProcessingTime = elapsed / Math.max(completed, 1);
        
        // Estimate remaining time
        const remaining = crawlStats.totalUrls - completed;
        if (remaining > 0 && crawlStats.avgProcessingTime > 0) {
            crawlStats.estimatedEndTime = Date.now() + (remaining * crawlStats.avgProcessingTime);
        }
        
        updateStatsDisplay();
    }

    function updateStatsDisplay() {
        // Update completed count
        document.getElementById('completedCount').textContent = crawlStats.completedUrls;
        
        // Update newly added count
        document.getElementById('newlyAddedCount').textContent = crawlStats.newlyAddedItems;
        
        // Update remaining count
        const remaining = crawlStats.totalUrls - crawlStats.completedUrls;
        document.getElementById('remainingCount').textContent = remaining;
        
        // Update elapsed time
        const elapsed = Date.now() - crawlStats.startTime;
        document.getElementById('elapsedTimer').textContent = formatTime(elapsed);
        
        // Update estimated remaining time
        if (crawlStats.estimatedEndTime && remaining > 0) {
            const estimatedRemaining = crawlStats.estimatedEndTime - Date.now();
            document.getElementById('estimatedTimer').textContent = 
                estimatedRemaining > 0 ? formatTime(estimatedRemaining) : '00:00';
        } else {
            document.getElementById('estimatedTimer').textContent = remaining > 0 ? '--:--' : '00:00';
        }
        
        // Update progress percentage
        const percent = crawlStats.totalUrls > 0 ? (crawlStats.completedUrls / crawlStats.totalUrls) * 100 : 0;
        document.getElementById('progressTextOverlay').textContent = `${Math.round(percent)}%`;
        
        // Terminal output for stats
        logTerminalStats();
    }

    function formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function logTerminalStats() {
        if (crawlStats.totalUrls === 0) return;
        
        const elapsed = Date.now() - crawlStats.startTime;
        const percent = (crawlStats.completedUrls / crawlStats.totalUrls) * 100;
        const remaining = crawlStats.totalUrls - crawlStats.completedUrls;
        
        // Create progress bar for terminal
        const barLength = 30;
        const filledLength = Math.round((percent / 100) * barLength);
        const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        
        // Format terminal stats line
        const statsLine = `[${formatTime(elapsed)}] ` +
            `Completed: ${crawlStats.completedUrls} | ` +
            `New: ${crawlStats.newlyAddedItems} | ` +
            `[${progressBar}] ${Math.round(percent)}% | ` +
            `Remaining: ${remaining} | ` +
            `ETA: ${document.getElementById('estimatedTimer').textContent}`;
        
        // Only log if there's actual progress to avoid spam
        if (crawlStats.completedUrls > 0) {
            console.log(statsLine);
        }
    }

    function finalizeCrawlStats() {
        if (statsUpdateInterval) {
            clearInterval(statsUpdateInterval);
            statsUpdateInterval = null;
        }
        
        const finalElapsed = Date.now() - crawlStats.startTime;
        console.log(`\n🎉 Crawl Complete!`);
        console.log(`Total Time: ${formatTime(finalElapsed)}`);
        console.log(`URLs Processed: ${crawlStats.completedUrls}/${crawlStats.totalUrls}`);
        console.log(`Items Found: ${crawlStats.newlyAddedItems}`);
        console.log(`Avg Processing Time: ${formatTime(crawlStats.avgProcessingTime)}`);
    }
});
