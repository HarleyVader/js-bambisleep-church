// BambiSleep Content Discovery Agent
// Specialized agent for detecting and cataloging bambisleep content across all media types

class BambiSleepDiscoveryAgent {
    constructor() {
        this.detectionPatterns = {
            bambisleep: [
                'bambi sleep', 'bambisleep', 'bambi', 'bimbo', 'feminization',
                'hypnosis', 'sissy', 'transformation', 'subliminal', 'conditioning',
                'princess', 'doll', 'pink', 'giggly', 'ditzy', 'bubble'
            ],
            contentTypes: {
                scripts: ['.txt', '.pdf', '.doc', 'script', 'hypnosis', 'induction'],
                audio: ['.mp3', '.wav', '.m4a', '.flac', 'audio', 'sound', 'voice'],
                videos: ['.mp4', '.webm', '.avi', 'video', 'visual', 'training'],
                images: ['.jpg', '.png', '.gif', '.webp', 'image', 'pic', 'photo'],
                subliminals: ['subliminal', 'binaural', 'frequency', 'hidden', 'background']
            }
        };
        
        this.discoveryStats = {
            totalScanned: 0,
            bambisleepFound: 0,
            contentByType: {
                scripts: 0,
                audio: 0,
                videos: 0,
                images: 0,
                subliminals: 0
            },
            confidenceScores: []
        };
        
        this.currentScan = null;
        this.initialized = false;
    }

    async initialize() {
        console.log('🌙 Initializing BambiSleep Discovery Agent...');
        
        // Test MCP connection
        await this.testMcpConnection();
        
        // Setup UI handlers
        this.setupUIHandlers();
        
        // Initialize detection algorithms
        await this.initializeDetectionAlgorithms();
        
        this.initialized = true;
        this.updateDetectionStatus('Ready for BambiSleep content discovery', 'ready');
        
        console.log('✅ BambiSleep Discovery Agent initialized');
    }

    async testMcpConnection() {
        try {
            const response = await fetch('/api/mcp/status');
            if (response.ok) {
                this.logMessage('🔗 MCP Server: Connected and ready');
                return true;
            } else {
                this.logMessage('⚠️ MCP Server: Connection issues detected');
                return false;
            }
        } catch (error) {
            this.logMessage('❌ MCP Server: Connection failed - ' + error.message);
            return false;
        }
    }

    setupUIHandlers() {
        const form = document.getElementById('bambisleepDiscoveryForm');
        const urlsInput = document.getElementById('discoveryUrls');
        const startButton = document.getElementById('startDiscoveryButton');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.startDiscovery();
        });

        // Real-time URL analysis
        urlsInput.addEventListener('input', () => {
            this.analyzeUrlsPreview();
        });
    }

    async initializeDetectionAlgorithms() {
        // Initialize AI-powered content detection
        this.logMessage('🧠 Loading BambiSleep detection patterns...');
        
        // Setup confidence scoring
        this.confidenceWeights = {
            titleMatch: 0.3,
            descriptionMatch: 0.25,
            urlMatch: 0.2,
            contentMatch: 0.15,
            metadataMatch: 0.1
        };
        
        this.logMessage('✅ Detection algorithms ready');
    }

    analyzeUrlsPreview() {
        const urls = document.getElementById('discoveryUrls').value
            .split('\n')
            .filter(url => url.trim())
            .map(url => url.trim());

        if (urls.length === 0) {
            this.updateDetectionStatus('Enter URLs to begin analysis', 'waiting');
            return;
        }

        // Quick pattern matching for preview
        let bambisleepIndicators = 0;
        
        urls.forEach(url => {
            const urlLower = url.toLowerCase();
            if (this.detectionPatterns.bambisleep.some(pattern => 
                urlLower.includes(pattern))) {
                bambisleepIndicators++;
            }
        });

        const confidence = Math.min((bambisleepIndicators / urls.length) * 100, 100);
        this.updateDetectionStatus(
            `${urls.length} URLs loaded • ${bambisleepIndicators} potential BambiSleep sources`,
            'analyzing',
            confidence
        );
    }

    async startDiscovery() {
        if (!this.initialized) {
            await this.initialize();
        }

        const urls = document.getElementById('discoveryUrls').value
            .split('\n')
            .filter(url => url.trim())
            .map(url => url.trim());

        if (urls.length === 0) {
            this.showError('Please enter at least one URL to analyze');
            return;
        }

        // Get selected content types
        const contentTypes = this.getSelectedContentTypes();
          this.logMessage(`🚀 Starting BambiSleep discovery scan of ${urls.length} URLs`);
        this.updateDetectionStatus('Initializing deep content analysis...', 'scanning');

        // Reset stats
        this.resetDiscoveryStats();

        // Show progress section
        this.showProgressSection();
        
        // Show progression bar if available
        if (typeof window.progressionManager !== 'undefined') {
            window.progressionManager.show();
            
            // Initialize progression with URLs
            urls.forEach(url => {
                window.progressionManager.addDomain(url, 'cued');
            });
            
            window.progressionManager.update(urls.length, urls.length, 0);
        }

        try {
            await this.performDeepDiscovery(urls, contentTypes);
        } catch (error) {
            this.logMessage(`❌ Discovery failed: ${error.message}`);
            this.showError('Discovery scan failed: ' + error.message);
        }
    }

    getSelectedContentTypes() {
        const types = [];
        if (document.getElementById('detectScripts').checked) types.push('scripts');
        if (document.getElementById('detectAudio').checked) types.push('audio');
        if (document.getElementById('detectVideos').checked) types.push('videos');
        if (document.getElementById('detectImages').checked) types.push('images');
        if (document.getElementById('detectSubliminals').checked) types.push('subliminals');
        return types;
    }

    async performDeepDiscovery(urls, contentTypes) {
        const totalUrls = urls.length;
        let processedUrls = 0;        for (const url of urls) {
            try {
                this.updateScanProgress(processedUrls, totalUrls, `Analyzing: ${url}`);
                
                // Update progression bar if available
                if (typeof window.progressionManager !== 'undefined') {
                    window.progressionManager.updateCurrent(url);
                    window.progressionManager.update(totalUrls, totalUrls - processedUrls, processedUrls);
                }
                
                const result = await this.analyzeSingleUrl(url, contentTypes);
                
                if (result.isBambiSleep) {
                    this.discoveryStats.bambisleepFound++;
                    this.logMessage(`🌙 BambiSleep content detected: ${url} (${result.confidence}% confidence)`);
                    
                    // Categorize by content type
                    result.contentTypes.forEach(type => {
                        this.discoveryStats.contentByType[type]++;
                    });

                    // Save to knowledge base via MCP
                    await this.saveToBambiSleepKnowledgeBase(result);
                } else {
                    this.logMessage(`⚪ No BambiSleep content: ${url}`);
                }                this.discoveryStats.totalScanned++;
                processedUrls++;
                
                // Mark URL as done in progression bar
                if (typeof window.progressionManager !== 'undefined') {
                    // Update the domain entry to show completion
                    const domainData = window.progressionManager.domains?.get?.(url);
                    if (domainData && domainData.element) {
                        const statusEl = domainData.element.querySelector('.domain-status');
                        if (statusEl) {
                            statusEl.textContent = '✅'; // Done
                        }
                    }
                }

            } catch (error) {
                this.logMessage(`💥 Error analyzing ${url}: ${error.message}`);
                processedUrls++;
            }

            // Update progress
            this.updateScanProgress(processedUrls, totalUrls, 'Analysis complete');
        }

        // Show final results
        this.showDiscoveryResults();
        this.updateDetectionStatus('Discovery scan complete', 'complete', 100);
    }

    async analyzeSingleUrl(url, contentTypes) {
        // Call MCP server for deep analysis
        const response = await fetch('/api/mcp/bambisleep-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                contentTypes: contentTypes,
                detectionPatterns: this.detectionPatterns
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }

        const result = await response.json();
        return this.calculateBambiSleepConfidence(result);
    }

    calculateBambiSleepConfidence(analysisResult) {
        let confidence = 0;
        const weights = this.confidenceWeights;

        // Title analysis
        if (analysisResult.title) {
            const titleMatches = this.countPatternMatches(analysisResult.title);
            confidence += (titleMatches / this.detectionPatterns.bambisleep.length) * weights.titleMatch * 100;
        }

        // Description analysis
        if (analysisResult.description) {
            const descMatches = this.countPatternMatches(analysisResult.description);
            confidence += (descMatches / this.detectionPatterns.bambisleep.length) * weights.descriptionMatch * 100;
        }

        // URL analysis
        const urlMatches = this.countPatternMatches(analysisResult.url);
        confidence += (urlMatches / this.detectionPatterns.bambisleep.length) * weights.urlMatch * 100;

        // Content analysis (if available)
        if (analysisResult.content) {
            const contentMatches = this.countPatternMatches(analysisResult.content);
            confidence += (contentMatches / this.detectionPatterns.bambisleep.length) * weights.contentMatch * 100;
        }

        // Metadata analysis
        if (analysisResult.metadata) {
            const metadataText = JSON.stringify(analysisResult.metadata);
            const metaMatches = this.countPatternMatches(metadataText);
            confidence += (metaMatches / this.detectionPatterns.bambisleep.length) * weights.metadataMatch * 100;
        }

        // Determine content types
        const detectedTypes = this.detectContentTypes(analysisResult);

        return {
            ...analysisResult,
            confidence: Math.min(confidence, 100),
            isBambiSleep: confidence >= 15, // Minimum 15% confidence threshold
            contentTypes: detectedTypes,
            bambisleepPatterns: this.extractMatchedPatterns(analysisResult)
        };
    }

    countPatternMatches(text) {
        if (!text) return 0;
        const textLower = text.toLowerCase();
        return this.detectionPatterns.bambisleep.filter(pattern => 
            textLower.includes(pattern.toLowerCase())
        ).length;
    }

    detectContentTypes(analysisResult) {
        const types = [];
        const url = analysisResult.url.toLowerCase();
        const title = (analysisResult.title || '').toLowerCase();
        const description = (analysisResult.description || '').toLowerCase();

        // Check each content type
        Object.entries(this.detectionPatterns.contentTypes).forEach(([type, patterns]) => {
            const hasTypeIndicators = patterns.some(pattern => 
                url.includes(pattern) || title.includes(pattern) || description.includes(pattern)
            );
            
            if (hasTypeIndicators) {
                types.push(type);
            }
        });

        return types.length > 0 ? types : ['general'];
    }

    extractMatchedPatterns(analysisResult) {
        const allText = [
            analysisResult.url,
            analysisResult.title,
            analysisResult.description,
            analysisResult.content
        ].filter(Boolean).join(' ').toLowerCase();

        return this.detectionPatterns.bambisleep.filter(pattern =>
            allText.includes(pattern.toLowerCase())
        );
    }

    async saveToBambiSleepKnowledgeBase(result) {
        try {
            await fetch('/api/mcp/bambisleep-save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'discovery',
                    data: result,
                    timestamp: new Date().toISOString(),
                    agent: 'bambisleep-discovery'
                })
            });
        } catch (error) {
            this.logMessage(`⚠️ Failed to save to knowledge base: ${error.message}`);
        }
    }

    // UI Update Methods
    updateDetectionStatus(message, status, confidence = null) {
        const statusElement = document.getElementById('detectionConfidence');
        if (statusElement) {
            statusElement.textContent = confidence ? `${Math.round(confidence)}% Confidence` : message;
            statusElement.className = `detector-confidence ${status}`;
        }
    }

    updateScanProgress(current, total, message) {
        const percent = (current / total) * 100;
        
        // Update progress bar if exists
        const progressBar = document.getElementById('discoveryProgressBar');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }

        // Update progress text
        const progressText = document.getElementById('discoveryProgressText');
        if (progressText) {
            progressText.textContent = `${current}/${total} URLs • ${message}`;
        }

        this.logMessage(`📊 Progress: ${current}/${total} (${Math.round(percent)}%) - ${message}`);
    }

    showProgressSection() {
        const progressSection = document.getElementById('discoveryProgress');
        if (progressSection) {
            progressSection.style.display = 'block';
        }
    }

    showDiscoveryResults() {
        const stats = this.discoveryStats;
        this.logMessage(`\n🎉 BambiSleep Discovery Complete!`);
        this.logMessage(`📊 Total URLs scanned: ${stats.totalScanned}`);
        this.logMessage(`🌙 BambiSleep content found: ${stats.bambisleepFound}`);
        this.logMessage(`📜 Scripts: ${stats.contentByType.scripts}`);
        this.logMessage(`🎵 Audio: ${stats.contentByType.audio}`);
        this.logMessage(`🎬 Videos: ${stats.contentByType.videos}`);
        this.logMessage(`🖼️ Images: ${stats.contentByType.images}`);
        this.logMessage(`🌀 Subliminals: ${stats.contentByType.subliminals}`);

        // Show results in UI
        this.displayResultsGrid();
    }

    displayResultsGrid() {
        // Implementation for showing discovered content in a grid
        const resultsContainer = document.getElementById('discoveryResults');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            // Add results display logic here
        }
    }

    resetDiscoveryStats() {
        this.discoveryStats = {
            totalScanned: 0,
            bambisleepFound: 0,
            contentByType: {
                scripts: 0,
                audio: 0,
                videos: 0,
                images: 0,
                subliminals: 0
            },
            confidenceScores: []
        };
    }

    logMessage(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logContainer = document.getElementById('discoveryLog');
        
        if (logContainer) {
            logContainer.innerHTML += `[${timestamp}] ${message}\n`;
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        
        console.log(`[BambiSleep Agent] ${message}`);
    }

    showError(message) {
        const errorContainer = document.getElementById('discoveryErrors');
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
            setTimeout(() => {
                errorContainer.innerHTML = '';
            }, 5000);
        }
    }
}

// Initialize the agent when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bambiSleepAgent = new BambiSleepDiscoveryAgent();
    window.bambiSleepAgent.initialize();
});
