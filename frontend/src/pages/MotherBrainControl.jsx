import React, { useState, useEffect } from 'react';
import { Terminal, Play, Square, BarChart3, Settings, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ErrorBoundary } from '../components';
import { motherBrainService } from '../services/motherBrainService.js';
import styles from './MotherBrainControl.module.css';

const MotherBrainControl = () => {
    const [systemStatus, setSystemStatus] = useState('offline');
    const [activeOperation, setActiveOperation] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [crawlProgress, setCrawlProgress] = useState({
        current: 0,
        total: 0,
        rate: 0,
        eta: null
    });

    const [config, setConfig] = useState({
        maxConcurrentRequests: 3,
        maxConcurrentPerHost: 1,
        defaultCrawlDelay: 2000,
        useAIAnalysis: true,
        maxPages: 50,
        maxDepth: 3,
        includeCommunity: true
    });

    const [seedUrls, setSeedUrls] = useState([
        'https://bambisleep.info/Main_Page',
        'https://bambisleep.info/Beginner%27s_Files',
        'https://bambisleep.info/Safety_and_Consent'
    ]);

    const operations = [
        {
            id: 'initialize',
            name: 'Initialize MOTHER BRAIN',
            description: 'Boot up the ethical spider crawler system',
            icon: <Play size={20} />,
            action: 'mother-brain-initialize',
            category: 'system',
            requiresConfig: true
        },
        {
            id: 'status',
            name: 'System Status',
            description: 'Get real-time MOTHER BRAIN metrics and health',
            icon: <BarChart3 size={20} />,
            action: 'mother-brain-status',
            category: 'monitor',
            requiresConfig: false
        },
        {
            id: 'crawl',
            name: 'Custom Crawl',
            description: 'Execute targeted crawl with custom parameters',
            icon: <Terminal size={20} />,
            action: 'mother-brain-crawl',
            category: 'crawl',
            requiresConfig: true
        },
        {
            id: 'quick-bambi',
            name: 'Quick Bambi Crawl',
            description: 'Fast BambiSleep knowledge discovery',
            icon: <CheckCircle size={20} />,
            action: 'mother-brain-quick-bambi-crawl',
            category: 'bambi',
            requiresConfig: false
        },
        {
            id: 'shutdown',
            name: 'Shutdown System',
            description: 'Gracefully shutdown MOTHER BRAIN',
            icon: <Square size={20} />,
            action: 'mother-brain-shutdown',
            category: 'system',
            requiresConfig: false
        }
    ];

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setOperationLogs(prev => [...prev.slice(-19), { message, type, timestamp }]);
    };

    const executeOperation = async (operation) => {
        if (activeOperation) {
            addLog(`⚠️ Operation ${activeOperation} still running`, 'warning');
            return;
        }

        setActiveOperation(operation.id);
        addLog(`🔥 Starting ${operation.name}...`, 'info');

        try {
            let result;
            
            // Use specialized MOTHER BRAIN service methods
            switch (operation.id) {
                case 'initialize':
                    result = await motherBrainService.initialize(buildOperationParams(operation).config);
                    break;
                
                case 'status':
                    result = await motherBrainService.getStatus();
                    break;
                
                case 'crawl':
                    const crawlParams = buildOperationParams(operation);
                    result = await motherBrainService.executeCrawl(crawlParams.seedUrls, crawlParams.options);
                    break;
                
                case 'quick-bambi':
                    result = await motherBrainService.quickBambiCrawl(buildOperationParams(operation));
                    break;
                
                case 'shutdown':
                    result = await motherBrainService.shutdown();
                    break;
                
                default:
                    throw new Error(`Unknown operation: ${operation.id}`);
            }
            
            if (result.success) {
                addLog(`✅ ${result.message || `${operation.name} completed successfully`}`, 'success');
                
                // Update system status based on operation result
                updateSystemStatusFromResult(operation.id, result);
                
                // Handle crawl operations with real progress data
                if (operation.id === 'crawl' || operation.id === 'quick-bambi') {
                    handleCrawlResult(result);
                }
                
            } else {
                throw new Error(result.error || 'Operation failed');
            }
            
        } catch (error) {
            const errorMsg = error.message || 'Unknown error occurred';
            addLog(`❌ ${operation.name} failed: ${errorMsg}`, 'error');
            
            // Update system status on error
            if (operation.id === 'initialize') {
                setSystemStatus('error');
            }
        } finally {
            setActiveOperation(null);
        }
    };

    const getOperationStatus = (operationId) => {
        if (operationId === 'initialize' && systemStatus === 'offline') return 'ready';
        if (operationId === 'shutdown' && systemStatus === 'offline') return 'disabled';
        if (operationId === 'status') return 'ready';
        if (['crawl', 'quick-bambi'].includes(operationId) && systemStatus === 'offline') return 'disabled';
        return 'ready';
    };

    const updateSeedUrl = (index, value) => {
        const newUrls = [...seedUrls];
        newUrls[index] = value;
        setSeedUrls(newUrls);
    };

    const addSeedUrl = () => {
        setSeedUrls([...seedUrls, 'https://']);
    };

    const removeSeedUrl = (index) => {
        setSeedUrls(seedUrls.filter((_, i) => i !== index));
    };

    // Build operation parameters from UI state
    const buildOperationParams = (operation) => {
        const baseParams = {};
        
        if (operation.requiresConfig) {
            baseParams.config = {
                maxConcurrentRequests: config.maxConcurrentRequests,
                maxConcurrentPerHost: config.maxConcurrentPerHost,
                defaultCrawlDelay: config.defaultCrawlDelay,
                useAIAnalysis: config.useAIAnalysis
            };
        }
        
        // Add operation-specific parameters
        switch (operation.id) {
            case 'crawl':
                return {
                    ...baseParams,
                    seedUrls: seedUrls.filter(url => url.startsWith('http')),
                    options: {
                        maxPages: config.maxPages,
                        maxDepth: config.maxDepth,
                        timeout: 600000,
                        followExternalLinks: true
                    }
                };
            case 'quick-bambi':
                return {
                    includeCommunity: config.includeCommunity,
                    maxPages: config.maxPages
                };
            default:
                return baseParams;
        }
    };

    // Update system status based on service result
    const updateSystemStatusFromResult = (operationId, result) => {
        switch (operationId) {
            case 'initialize':
                if (result.success) {
                    setSystemStatus('online');
                    if (result.instanceId) {
                        addLog(`🆔 Instance ID: ${result.instanceId}`, 'info');
                    }
                }
                break;
            
            case 'shutdown':
                if (result.success) {
                    setSystemStatus('offline');
                }
                break;
            
            case 'status':
                if (result.status) {
                    setSystemStatus(result.status);
                }
                break;
        }
    };

    // Handle crawl operation result with real progress data
    const handleCrawlResult = (result) => {
        if (result.results) {
            const { pagesProcessed, entriesStored, sessionDuration } = result.results;
            
            addLog(`📊 Processed ${pagesProcessed || 0} pages, stored ${entriesStored || 0} entries in ${sessionDuration || 0}s`, 'info');
            
            if (result.sessionId) {
                addLog(`🕷️ Session ID: ${result.sessionId}`, 'info');
            }
        }
        
        if (result.knowledgeExpanded) {
            addLog(`🧠 BambiSleep knowledge base expanded!`, 'success');
        }
        
        // Reset progress after showing real results
        setCrawlProgress({ current: 0, total: 0, rate: 0, eta: null });
    };

    // Check system status on component mount and periodically
    useEffect(() => {
        const checkSystemStatus = async () => {
            try {
                const result = await motherBrainService.getStatus();
                
                if (result.success) {
                    setSystemStatus(result.status);
                    
                    // Log any important status information
                    if (result.serverInfo?.instanceId && result.serverInfo.instanceId !== systemInfo?.instanceId) {
                        addLog(`🆔 Connected to instance: ${result.serverInfo.instanceId}`, 'info');
                    }
                } else {
                    setSystemStatus('error');
                }
            } catch (error) {
                setSystemStatus('offline');
            }
        };

        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 30000); // Check every 30s
        
        return () => clearInterval(interval);
    }, []);

    return (
        <ErrorBoundary>
            <div className={styles.controlPage}>
                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <Terminal size={48} />
                        <div>
                            <h1>🔥 MOTHER BRAIN Control Panel</h1>
                            <p>Direct system control and monitoring interface</p>
                        </div>
                    </div>

                    <div className={`${styles.statusBadge} ${styles[systemStatus]}`}>
                        <div className={styles.statusDot}></div>
                        {systemStatus.toUpperCase()}
                    </div>
                </header>

                <div className={styles.controlGrid}>
                    {/* Operation Controls */}
                    <section className={styles.operationsPanel}>
                        <h2>🕷️ System Operations</h2>
                        <div className={styles.operationsList}>
                            {operations.map((operation) => {
                                const status = getOperationStatus(operation.id);
                                return (
                                    <div key={operation.id} className={styles.operationItem}>
                                        <div className={styles.operationInfo}>
                                            <div className={styles.operationHeader}>
                                                {operation.icon}
                                                <h3>{operation.name}</h3>
                                            </div>
                                            <p>{operation.description}</p>
                                            <code>{operation.action}</code>
                                        </div>
                                        <button
                                            onClick={() => executeOperation(operation)}
                                            disabled={status === 'disabled' || activeOperation === operation.id}
                                            className={`${styles.operationButton} ${styles[status]}`}
                                        >
                                            {activeOperation === operation.id ? (
                                                <>
                                                    <Clock size={16} />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    {operation.icon}
                                                    Execute
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Configuration Panel */}
                    <section className={styles.configPanel}>
                        <h2>⚙️ System Configuration</h2>

                        <div className={styles.configSection}>
                            <h3>Crawler Settings</h3>
                            <div className={styles.configGrid}>
                                <label>
                                    Max Concurrent Requests
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={config.maxConcurrentRequests}
                                        onChange={(e) => setConfig({ ...config, maxConcurrentRequests: parseInt(e.target.value) })}
                                    />
                                </label>
                                <label>
                                    Max Per Host
                                    <input
                                        type="number"
                                        min="1"
                                        max="3"
                                        value={config.maxConcurrentPerHost}
                                        onChange={(e) => setConfig({ ...config, maxConcurrentPerHost: parseInt(e.target.value) })}
                                    />
                                </label>
                                <label>
                                    Crawl Delay (ms)
                                    <input
                                        type="number"
                                        min="1000"
                                        max="10000"
                                        step="500"
                                        value={config.defaultCrawlDelay}
                                        onChange={(e) => setConfig({ ...config, defaultCrawlDelay: parseInt(e.target.value) })}
                                    />
                                </label>
                                <label>
                                    Max Pages
                                    <input
                                        type="number"
                                        min="1"
                                        max="200"
                                        value={config.maxPages}
                                        onChange={(e) => setConfig({ ...config, maxPages: parseInt(e.target.value) })}
                                    />
                                </label>
                            </div>

                            <div className={styles.configToggles}>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={config.useAIAnalysis}
                                        onChange={(e) => setConfig({ ...config, useAIAnalysis: e.target.checked })}
                                    />
                                    <span>AI Analysis</span>
                                </label>
                                <label className={styles.toggle}>
                                    <input
                                        type="checkbox"
                                        checked={config.includeCommunity}
                                        onChange={(e) => setConfig({ ...config, includeCommunity: e.target.checked })}
                                    />
                                    <span>Include Community Sources</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.configSection}>
                            <h3>Seed URLs</h3>
                            <div className={styles.seedUrls}>
                                {seedUrls.map((url, index) => (
                                    <div key={index} className={styles.seedUrlItem}>
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => updateSeedUrl(index, e.target.value)}
                                            placeholder="https://example.com"
                                        />
                                        {seedUrls.length > 1 && (
                                            <button
                                                onClick={() => removeSeedUrl(index)}
                                                className={styles.removeUrl}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addSeedUrl} className={styles.addUrl}>
                                    + Add URL
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Progress Monitoring */}
                {crawlProgress.total > 0 && (
                    <section className={styles.progressPanel}>
                        <h3>🔄 Crawl Progress</h3>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${crawlProgress.current}%` }}
                            ></div>
                        </div>
                        <div className={styles.progressStats}>
                            <span>Progress: {crawlProgress.current}%</span>
                            <span>Rate: {crawlProgress.rate} pages/sec</span>
                            {crawlProgress.eta && <span>ETA: {crawlProgress.eta}s</span>}
                        </div>
                    </section>
                )}

                {/* Operation Logs */}
                <section className={styles.logsPanel}>
                    <h2>📊 Operation Logs</h2>
                    <div className={styles.logContainer}>
                        {operationLogs.length === 0 ? (
                            <p className={styles.noLogs}>No operations executed yet</p>
                        ) : (
                            operationLogs.map((log, index) => (
                                <div key={index} className={`${styles.logEntry} ${styles[log.type]}`}>
                                    <span className={styles.logTime}>[{log.timestamp}]</span>
                                    <span className={styles.logMessage}>{log.message}</span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </ErrorBoundary>
    );
};

export default MotherBrainControl;
