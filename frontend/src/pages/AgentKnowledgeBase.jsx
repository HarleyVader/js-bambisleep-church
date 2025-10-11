import React, { useState, useEffect, useRef } from 'react';
import {
    Search,
    Globe,
    Database,
    Brain,
    Activity,
    Play,
    Pause,
    RefreshCw,
    Download,
    Upload,
    Filter,
    BarChart3,
    Settings,
    Zap,
    Target,
    Layers,
    BookOpen,
    AlertCircle,
    CheckCircle,
    Clock,
    TrendingUp
} from 'lucide-react';
import styles from './AgentKnowledgeBase.module.css';
import { mcpService, knowledgeBaseService } from '@services/api';
import { LoadingSpinner, ErrorMessage } from '@components';

const AgentKnowledgeBase = () => {
    // System State
    const [systemStatus, setSystemStatus] = useState({
        crawler: 'unknown',
        agentic: 'unknown',
        mongodb: 'unknown',
        lmstudio: 'unknown'
    });

    // Knowledge Base State
    const [knowledgeBase, setKnowledgeBase] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSearching, setIsSearching] = useState(false);

    // Crawler State
    const [crawlerUrls, setCrawlerUrls] = useState(['']);
    const [crawlerStatus, setCrawlerStatus] = useState('idle');
    const [crawlerResults, setCrawlerResults] = useState([]);
    const [crawlerProgress, setCrawlerProgress] = useState(0);

    // Agentic System State
    const [agenticStatus, setAgenticStatus] = useState('idle');
    const [agenticStats, setAgenticStats] = useState({
        totalProcessed: 0,
        categorized: 0,
        analyzed: 0,
        organized: 0
    });
    const [learningPaths, setLearningPaths] = useState([]);

    // System Configuration
    const [config, setConfig] = useState({
        crawlDepth: 2,
        maxPages: 50,
        autoAnalyze: true,
        autoOrganize: true,
        storeResults: true
    });

    const [activeTab, setActiveTab] = useState('dashboard');
    const logRef = useRef(null);
    const [systemLogs, setSystemLogs] = useState([]);

    // Categories for knowledge organization
    const categories = [
        'all', 'official', 'community', 'scripts', 'safety',
        'guides', 'resources', 'research', 'discussions'
    ];

    useEffect(() => {
        initializeSystem();
        const interval = setInterval(updateSystemStatus, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setSystemLogs(prev => [...prev.slice(-99), { // Keep last 100 logs
            timestamp,
            message,
            type
        }]);
    };

    const initializeSystem = async () => {
        addLog('🚀 Initializing Agent Knowledge Base System...', 'info');

        try {
            // Initialize all systems
            const mcpStatus = await mcpService.getStatus();

            if (mcpStatus.status === 'operational') {
                addLog('✅ MCP Server connected', 'success');

                // Initialize agentic system
                const agenticInit = await knowledgeBaseService.initializeAgentic();
                if (agenticInit.result) {
                    addLog('✅ Agentic Knowledge Builder initialized', 'success');
                    setAgenticStatus('ready');
                }                // Load existing knowledge base
                await loadKnowledgeBase();

                // Update system status
                await updateSystemStatus();

            } else {
                addLog('❌ MCP Server unavailable', 'error');
            }
        } catch (error) {
            addLog(`❌ System initialization failed: ${error.message}`, 'error');
        }
    };

    const updateSystemStatus = async () => {
        try {
            const [mcpStatus, agenticStats] = await Promise.allSettled([
                knowledgeBaseService.getMcpStatus(),
                knowledgeBaseService.getAgenticStats()
            ]);

            setSystemStatus({
                crawler: mcpStatus.status === 'fulfilled' ? 'online' : 'offline',
                agentic: agenticStats.status === 'fulfilled' ? 'online' : 'offline',
                mongodb: mcpStatus.status === 'fulfilled' ? 'online' : 'offline',
                lmstudio: mcpStatus.status === 'fulfilled' ? 'online' : 'offline'
            });

            if (agenticStats.status === 'fulfilled' && agenticStats.value?.result) {
                const statsData = JSON.parse(agenticStats.value.result.content[0].text);
                if (statsData.success) {
                    setAgenticStats(statsData.stats);
                }
            }
        } catch (error) {
            addLog(`⚠️ Status update failed: ${error.message}`, 'warning');
        }
    };

    const loadKnowledgeBase = async () => {
        try {
            addLog('📚 Loading knowledge base...', 'info');

            // Get MongoDB collections for knowledge data
            const collections = await mcpService.callTool('mongodb-list-collections', {
                database: 'bambisleep-church'
            });

            if (collections.result) {
                const data = JSON.parse(collections.result.content[0].text);
                if (data.success) {
                    addLog(`📊 Found ${data.collections.length} collections`, 'info');
                }
            }

            // Load existing knowledge entries
            const knowledge = await mcpService.callTool('search-knowledge', {
                query: '',
                limit: 20 // Fixed: was 100, max allowed is 20
            });

            if (knowledge.result) {
                // Parse knowledge data if available
                setKnowledgeBase([]);
                addLog('📚 Knowledge base loaded', 'success');
            } else if (knowledge.error) {
                addLog(`⚠️ Knowledge search failed: ${knowledge.error.message}`, 'warning');
            }

        } catch (error) {
            addLog(`❌ Failed to load knowledge base: ${error.message}`, 'error');
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        addLog(`🔍 Searching for: "${searchQuery}"`, 'info');

        try {
            const searchParams = {
                query: searchQuery,
                limit: 20
            };

            if (selectedCategory !== 'all') {
                searchParams.category = selectedCategory;
            }

            const result = await mcpService.callTool('search-knowledge', searchParams);

            if (result.result) {
                const content = result.result.content[0].text;
                setSearchResults([{ content, timestamp: new Date() }]);
                addLog(`✅ Search completed: found results`, 'success');
            } else if (result.error) {
                addLog(`❌ Search failed: ${result.error.message}`, 'error');
                setSearchResults([]);
            }
        } catch (error) {
            addLog(`❌ Search failed: ${error.message}`, 'error');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const startCrawling = async () => {
        if (crawlerStatus === 'running') return;

        setCrawlerStatus('running');
        setCrawlerProgress(0);
        setCrawlerResults([]);

        const validUrls = crawlerUrls.filter(url => url.trim());
        addLog(`🕷️ Starting crawl of ${validUrls.length} URLs...`, 'info');

        try {
            for (let i = 0; i < validUrls.length; i++) {
                const url = validUrls[i].trim();
                addLog(`🌐 Crawling: ${url}`, 'info');

                const result = await mcpService.callTool('crawler-single-url', {
                    url,
                    storeResults: config.storeResults,
                    timeout: 60000, // Increased to 60 seconds
                    collection: 'crawl_results'
                });

                if (result.result) {
                    const crawlData = JSON.parse(result.result.content[0].text);
                    setCrawlerResults(prev => [...prev, crawlData]);
                    addLog(`✅ Crawled: ${url}`, 'success');
                } else if (result.error) {
                    const errorMsg = result.error.message || 'Unknown error';
                    addLog(`❌ Failed to crawl ${url}: ${errorMsg}`, 'error');
                } else {
                    addLog(`❌ Failed to crawl: ${url}`, 'error');
                }

                setCrawlerProgress(((i + 1) / validUrls.length) * 100);
            }

            addLog('🎉 Crawling completed!', 'success');

            // Auto-analyze if enabled
            if (config.autoAnalyze) {
                await startAgenticAnalysis();
            }

        } catch (error) {
            addLog(`❌ Crawling failed: ${error.message}`, 'error');
        } finally {
            setCrawlerStatus('idle');
        }
    };

    const startAgenticAnalysis = async () => {
        setAgenticStatus('analyzing');
        addLog('🤖 Starting agentic analysis...', 'info');

        try {
            // Start the agentic building process
            const buildResult = await mcpService.callTool('agentic-start-building', {
                sources: ['crawl_results'],
                autoOrganize: config.autoOrganize,
                maxItems: config.maxPages
            });

            if (buildResult.result) {
                const data = JSON.parse(buildResult.result.content[0].text);
                if (data.success) {
                    addLog('✅ Agentic analysis started', 'success');

                    // Monitor progress
                    monitorAgenticProgress();
                }
            } else if (buildResult.error) {
                addLog(`❌ Agentic analysis failed: ${buildResult.error.message}`, 'error');
                setAgenticStatus('error');
            }
        } catch (error) {
            addLog(`❌ Agentic analysis failed: ${error.message}`, 'error');
            setAgenticStatus('error');
        }
    };

    const monitorAgenticProgress = async () => {
        const checkProgress = async () => {
            try {
                const stats = await mcpService.callTool('agentic-get-stats');
                if (stats.result) {
                    const data = JSON.parse(stats.result.content[0].text);
                    if (data.success) {
                        setAgenticStats(data.stats);

                        if (data.stats.status === 'completed') {
                            setAgenticStatus('completed');
                            addLog('🎉 Agentic analysis completed!', 'success');
                            await loadKnowledgeBase();
                            return;
                        }
                    }
                }

                // Continue monitoring if still running
                if (agenticStatus === 'analyzing') {
                    setTimeout(checkProgress, 5000);
                }
            } catch (error) {
                addLog(`⚠️ Progress check failed: ${error.message}`, 'warning');
            }
        };

        checkProgress();
    };

    const generateLearningPath = async (topic) => {
        try {
            addLog(`🎓 Generating learning path for: ${topic}`, 'info');

            const result = await mcpService.callTool('agentic-get-learning-path', {
                topic,
                maxItems: 10
            });

            if (result.result) {
                const data = JSON.parse(result.result.content[0].text);
                if (data.success) {
                    setLearningPaths(prev => [...prev, data.learningPath]);
                    addLog('✅ Learning path generated', 'success');
                }
            }
        } catch (error) {
            addLog(`❌ Learning path generation failed: ${error.message}`, 'error');
        }
    };

    const addCrawlerUrl = () => {
        setCrawlerUrls(prev => [...prev, '']);
    };

    const updateCrawlerUrl = (index, value) => {
        setCrawlerUrls(prev => prev.map((url, i) => i === index ? value : url));
    };

    const removeCrawlerUrl = (index) => {
        setCrawlerUrls(prev => prev.filter((_, i) => i !== index));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': case 'ready': case 'completed': return 'var(--accent-success)';
            case 'running': case 'analyzing': return 'var(--primary)';
            case 'offline': case 'error': return 'var(--accent)';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'online': case 'ready': case 'completed': return <CheckCircle size={16} />;
            case 'running': case 'analyzing': return <RefreshCw size={16} className={styles.spinning} />;
            case 'offline': case 'error': return <AlertCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const renderDashboard = () => (
        <div className={styles.dashboard}>
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Database />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{knowledgeBase.length}</div>
                        <div className={styles.statLabel}>Knowledge Items</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Activity />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{agenticStats.totalProcessed}</div>
                        <div className={styles.statLabel}>Processed Items</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Globe />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{crawlerResults.length}</div>
                        <div className={styles.statLabel}>Crawled Pages</div>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Brain />
                    </div>
                    <div className={styles.statContent}>
                        <div className={styles.statValue}>{learningPaths.length}</div>
                        <div className={styles.statLabel}>Learning Paths</div>
                    </div>
                </div>
            </div>

            <div className={styles.systemStatus}>
                <h3>System Status</h3>
                <div className={styles.statusGrid}>
                    {Object.entries(systemStatus).map(([service, status]) => (
                        <div key={service} className={styles.statusItem}>
                            <span className={styles.statusIcon} style={{ color: getStatusColor(status) }}>
                                {getStatusIcon(status)}
                            </span>
                            <span className={styles.statusLabel}>{service}</span>
                            <span className={styles.statusValue} style={{ color: getStatusColor(status) }}>
                                {status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderKnowledgeSearch = () => (
        <div className={styles.searchSection}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
                <div className={styles.searchInputGroup}>
                    <Search size={20} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search knowledge base..."
                        className={styles.searchInput}
                    />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={styles.categorySelect}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        disabled={isSearching}
                        className={styles.searchButton}
                    >
                        {isSearching ? <RefreshCw size={16} className={styles.spinning} /> : 'Search'}
                    </button>
                </div>
            </form>

            <div className={styles.searchResults}>
                {searchResults.map((result, index) => (
                    <div key={index} className={styles.resultCard}>
                        <pre className={styles.resultContent}>{result.content}</pre>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCrawler = () => (
        <div className={styles.crawlerSection}>
            <div className={styles.crawlerControls}>
                <h3>Web Crawler</h3>

                <div className={styles.urlInputs}>
                    {crawlerUrls.map((url, index) => (
                        <div key={index} className={styles.urlInputGroup}>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => updateCrawlerUrl(index, e.target.value)}
                                placeholder="https://example.com"
                                className={styles.urlInput}
                            />
                            <button
                                onClick={() => removeCrawlerUrl(index)}
                                className={styles.removeUrlButton}
                                disabled={crawlerUrls.length === 1}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button onClick={addCrawlerUrl} className={styles.addUrlButton}>
                        + Add URL
                    </button>
                </div>

                <div className={styles.crawlerActions}>
                    <button
                        onClick={startCrawling}
                        disabled={crawlerStatus === 'running'}
                        className={styles.startCrawlButton}
                    >
                        {crawlerStatus === 'running' ? (
                            <>
                                <RefreshCw size={16} className={styles.spinning} />
                                Crawling...
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                Start Crawling
                            </>
                        )}
                    </button>
                </div>

                {crawlerStatus === 'running' && (
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progress}
                            style={{ width: `${crawlerProgress}%` }}
                        />
                    </div>
                )}
            </div>

            <div className={styles.crawlerResults}>
                <h4>Crawl Results ({crawlerResults.length})</h4>
                {crawlerResults.map((result, index) => (
                    <div key={index} className={styles.crawlResultCard}>
                        <div className={styles.crawlResultHeader}>
                            <Globe size={16} />
                            <span className={styles.crawlUrl}>{result.url || `Result ${index + 1}`}</span>
                        </div>
                        <div className={styles.crawlResultContent}>
                            <pre>{JSON.stringify(result, null, 2).slice(0, 500)}...</pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAgentic = () => (
        <div className={styles.agenticSection}>
            <div className={styles.agenticControls}>
                <h3>Agentic Knowledge Builder</h3>

                <div className={styles.agenticStatus}>
                    <span className={styles.statusIcon} style={{ color: getStatusColor(agenticStatus) }}>
                        {getStatusIcon(agenticStatus)}
                    </span>
                    <span>Status: {agenticStatus}</span>
                </div>

                <div className={styles.agenticStats}>
                    <div className={styles.statRow}>
                        <span>Total Processed:</span>
                        <span>{agenticStats.totalProcessed}</span>
                    </div>
                    <div className={styles.statRow}>
                        <span>Categorized:</span>
                        <span>{agenticStats.categorized}</span>
                    </div>
                    <div className={styles.statRow}>
                        <span>Analyzed:</span>
                        <span>{agenticStats.analyzed}</span>
                    </div>
                    <div className={styles.statRow}>
                        <span>Organized:</span>
                        <span>{agenticStats.organized}</span>
                    </div>
                </div>

                <div className={styles.agenticActions}>
                    <button
                        onClick={startAgenticAnalysis}
                        disabled={agenticStatus === 'analyzing'}
                        className={styles.startAnalysisButton}
                    >
                        {agenticStatus === 'analyzing' ? (
                            <>
                                <RefreshCw size={16} className={styles.spinning} />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Brain size={16} />
                                Start Analysis
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => generateLearningPath('BambiSleep Basics')}
                        className={styles.generatePathButton}
                    >
                        <Target size={16} />
                        Generate Learning Path
                    </button>
                </div>
            </div>

            <div className={styles.learningPaths}>
                <h4>Learning Paths ({learningPaths.length})</h4>
                {learningPaths.map((path, index) => (
                    <div key={index} className={styles.learningPathCard}>
                        <div className={styles.pathHeader}>
                            <BookOpen size={16} />
                            <span>{path.topic || `Learning Path ${index + 1}`}</span>
                        </div>
                        <div className={styles.pathContent}>
                            <pre>{JSON.stringify(path, null, 2).slice(0, 300)}...</pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLogs = () => (
        <div className={styles.logsSection}>
            <div className={styles.logsHeader}>
                <h3>System Logs</h3>
                <button
                    onClick={() => setSystemLogs([])}
                    className={styles.clearLogsButton}
                >
                    Clear Logs
                </button>
            </div>
            <div className={styles.logsContainer} ref={logRef}>
                {systemLogs.map((log, index) => (
                    <div key={index} className={`${styles.logEntry} ${styles[log.type]}`}>
                        <span className={styles.logTime}>{log.timestamp}</span>
                        <span className={styles.logMessage}>{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Agent Knowledge Base</h1>
                <p className={styles.subtitle}>
                    Self-organizing, AI-powered knowledge discovery and management system
                </p>
            </header>

            <nav className={styles.tabNav}>
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
                    { id: 'search', label: 'Knowledge Search', icon: <Search size={16} /> },
                    { id: 'crawler', label: 'Web Crawler', icon: <Globe size={16} /> },
                    { id: 'agentic', label: 'Agentic Builder', icon: <Brain size={16} /> },
                    { id: 'logs', label: 'System Logs', icon: <Activity size={16} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main className={styles.content}>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'search' && renderKnowledgeSearch()}
                {activeTab === 'crawler' && renderCrawler()}
                {activeTab === 'agentic' && renderAgentic()}
                {activeTab === 'logs' && renderLogs()}
            </main>
        </div>
    );
};

export default AgentKnowledgeBase;
