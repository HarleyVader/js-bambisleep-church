import React, { useState, useEffect } from 'react';
import { Zap, Shield, Brain, Activity, Target, AlertTriangle } from 'lucide-react';
import { ErrorBoundary } from '../components';
import { mcpService } from '../services/api.js';
import styles from './MotherBrainPage.module.css';

const MotherBrainPage = () => {
    const [systemStatus, setSystemStatus] = useState('checking');
    const [crawlStats, setCrawlStats] = useState({
        totalRequests: 0,
        successfulRequests: 0,
        respectfulBlocks: 0,
        activeCrawlers: 0,
        queuedUrls: 0
    });
    const [systemInfo, setSystemInfo] = useState({
        instanceId: '',
        uptime: 0,
        operations: 0,
        threatLevel: 'LOOKS SCARY BUT COMPLETELY HARMLESS',
        motto: 'Ethical Power, Maximum Respect'
    });

    const motherBrainFeatures = [
        {
            icon: <Shield size={24} />,
            title: 'Ethical Compliance',
            description: 'Honors robots.txt, respects crawl-delay, follows legal protocols',
            status: 'active'
        },
        {
            icon: <Zap size={24} />,
            title: 'Minigun Performance',
            description: 'High-speed concurrent crawling with intelligent rate limiting',
            status: 'active'
        },
        {
            icon: <Brain size={24} />,
            title: 'AI Analysis',
            description: 'Intelligent content extraction and knowledge categorization',
            status: 'active'
        },
        {
            icon: <Activity size={24} />,
            title: 'Real-time Monitoring',
            description: 'Live metrics, respectfulness scoring, and queue health tracking',
            status: 'active'
        },
        {
            icon: <Target size={24} />,
            title: 'Smart Prioritization',
            description: 'BambiSleep-focused URL discovery and content relevance scoring',
            status: 'active'
        }
    ];

    const crawlOperations = [
        {
            name: 'Initialize MOTHER BRAIN',
            description: 'Boot up the ethical spider crawler system',
            action: 'mother-brain-initialize',
            icon: <Zap size={20} />,
            category: 'system'
        },
        {
            name: 'Execute Custom Crawl',
            description: 'Run targeted crawl with custom parameters',
            action: 'mother-brain-crawl',
            icon: <Activity size={20} />,
            category: 'crawl'
        },
        {
            name: 'Quick Bambi Crawl',
            description: 'Fast focused crawl of BambiSleep resources',
            action: 'mother-brain-quick-bambi-crawl',
            icon: <Target size={20} />,
            category: 'bambi'
        },
        {
            name: 'System Status',
            description: 'Get comprehensive MOTHER BRAIN status and metrics',
            action: 'mother-brain-status',
            icon: <Activity size={20} />,
            category: 'monitor'
        },
        {
            name: 'Graceful Shutdown',
            description: 'Safely shutdown MOTHER BRAIN system',
            action: 'mother-brain-shutdown',
            icon: <AlertTriangle size={20} />,
            category: 'system'
        }
    ];

    const ethicalPrinciples = [
        'Honors Robots Exclusion Protocol (robots.txt)',
        'Respects per-host crawl-delay settings',
        'Implements exponential backoff on errors',
        'Recognizes meta robots and X-Robots-Tag headers',
        'Maintains clear User-Agent identification',
        'Follows legal and terms of service requirements',
        'Uses content-type filtering and size limits',
        'Provides comprehensive error handling'
    ];

    // Fetch real system status and metrics
    const fetchSystemStatus = async () => {
        try {
            const statusResponse = await mcpService.callTool('mother-brain-status');
            
            if (statusResponse.result?.content?.[0]?.text) {
                const responseText = statusResponse.result.content[0].text;
                
                // Parse system status
                if (responseText.includes('OPERATIONAL')) {
                    setSystemStatus('online');
                } else if (responseText.includes('not initialized')) {
                    setSystemStatus('offline');
                } else if (responseText.includes('Active Crawlers')) {
                    setSystemStatus('crawling');
                }
                
                // Parse real metrics
                const totalRequestsMatch = responseText.match(/Total Requests[:\s]*(\d+)/);
                const successfulMatch = responseText.match(/Successful[:\s]*(\d+)/);
                const respectfulBlocksMatch = responseText.match(/Respectful Blocks[:\s]*(\d+)/);
                const activeCrawlersMatch = responseText.match(/Active Crawlers[:\s]*(\d+)/);
                const queuedUrlsMatch = responseText.match(/Queued URLs[:\s]*(\d+)/);
                
                if (totalRequestsMatch || successfulMatch || respectfulBlocksMatch || activeCrawlersMatch || queuedUrlsMatch) {
                    setCrawlStats({
                        totalRequests: totalRequestsMatch ? parseInt(totalRequestsMatch[1]) : 0,
                        successfulRequests: successfulMatch ? parseInt(successfulMatch[1]) : 0,
                        respectfulBlocks: respectfulBlocksMatch ? parseInt(respectfulBlocksMatch[1]) : 0,
                        activeCrawlers: activeCrawlersMatch ? parseInt(activeCrawlersMatch[1]) : 0,
                        queuedUrls: queuedUrlsMatch ? parseInt(queuedUrlsMatch[1]) : 0
                    });
                }
                
                // Parse system info
                const instanceIdMatch = responseText.match(/Instance ID[:\s]*([^\n\r]+)/);
                const uptimeMatch = responseText.match(/Instance Uptime[:\s]*(\d+)s/);
                const operationsMatch = responseText.match(/Operations Performed[:\s]*(\d+)/);
                const threatLevelMatch = responseText.match(/Threat Level[:\s]*([^\n\r]+)/);
                const mottoMatch = responseText.match(/Motto[:\s]*([^\n\r]+)/);
                
                setSystemInfo(prev => ({
                    instanceId: instanceIdMatch ? instanceIdMatch[1].trim() : prev.instanceId,
                    uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : prev.uptime,
                    operations: operationsMatch ? parseInt(operationsMatch[1]) : prev.operations,
                    threatLevel: threatLevelMatch ? threatLevelMatch[1].trim() : prev.threatLevel,
                    motto: mottoMatch ? mottoMatch[1].trim() : prev.motto
                }));
            }
        } catch (error) {
            console.error('Failed to fetch system status:', error);
            setSystemStatus('error');
        }
    };

    // Real-time updates with actual system data
    useEffect(() => {
        fetchSystemStatus();
        
        const interval = setInterval(() => {
            fetchSystemStatus();
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const getOperationColor = (category) => {
        switch (category) {
            case 'system': return 'var(--accent-danger)';
            case 'crawl': return 'var(--secondary-purple)';
            case 'bambi': return 'var(--accent-success)';
            case 'monitor': return 'var(--accent-warning)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <ErrorBoundary>
            <div className={styles.motherBrainPage}>
                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <Zap size={48} />
                        <div>
                            <h1>🔥 MOTHER BRAIN 🔫🕷️</h1>
                            <p className={styles.subtitle}>Ethical Minigun Spider Crawler System</p>
                            <p className={styles.motto}>"{systemInfo.threatLevel}"</p>
                            {systemInfo.instanceId && (
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                    Instance: {systemInfo.instanceId} | Operations: {systemInfo.operations}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={styles.statusIndicator}>
                        <div className={`${styles.statusDot} ${styles[systemStatus]}`}></div>
                        <span>System {systemStatus.toUpperCase()}</span>
                    </div>
                </header>

                {/* Real-time Stats Dashboard */}
                <section className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <h3>Total Requests</h3>
                        <div className={styles.statValue}>{crawlStats.totalRequests.toLocaleString()}</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Success Rate</h3>
                        <div className={styles.statValue}>
                            {crawlStats.totalRequests > 0
                                ? Math.floor((crawlStats.successfulRequests / crawlStats.totalRequests) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Active Crawlers</h3>
                        <div className={styles.statValue}>{crawlStats.activeCrawlers}</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Queued URLs</h3>
                        <div className={styles.statValue}>{crawlStats.queuedUrls}</div>
                    </div>
                    <div className={styles.statCard}>
                        <h3>Respectful Blocks</h3>
                        <div className={styles.statValue}>{crawlStats.respectfulBlocks}</div>
                    </div>
                </section>

                {/* Core Features */}
                <section className={styles.featuresSection}>
                    <h2>🔫 Core Capabilities</h2>
                    <div className={styles.featuresGrid}>
                        {motherBrainFeatures.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.featureIcon}>{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <div className={`${styles.featureStatus} ${styles[feature.status]}`}>
                                    {feature.status.toUpperCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Crawl Operations */}
                <section className={styles.operationsSection}>
                    <h2>🕷️ Crawl Operations</h2>
                    <div className={styles.operationsGrid}>
                        {crawlOperations.map((operation, index) => (
                            <div
                                key={index}
                                className={styles.operationCard}
                                style={{ borderLeftColor: getOperationColor(operation.category) }}
                            >
                                <div className={styles.operationHeader}>
                                    {operation.icon}
                                    <h3>{operation.name}</h3>
                                </div>
                                <p>{operation.description}</p>
                                <div className={styles.operationFooter}>
                                    <code>{operation.action}</code>
                                    <span className={styles.operationCategory}>
                                        {operation.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Ethical Compliance */}
                <section className={styles.ethicsSection}>
                    <h2>🛡️ Ethical Compliance Framework</h2>
                    <div className={styles.ethicsGrid}>
                        <div className={styles.ethicsCard}>
                            <h3>Legal & Respectful</h3>
                            <ul className={styles.ethicsList}>
                                {ethicalPrinciples.slice(0, 4).map((principle, index) => (
                                    <li key={index}>
                                        <Shield size={16} />
                                        {principle}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className={styles.ethicsCard}>
                            <h3>Technical Safeguards</h3>
                            <ul className={styles.ethicsList}>
                                {ethicalPrinciples.slice(4).map((principle, index) => (
                                    <li key={index}>
                                        <Shield size={16} />
                                        {principle}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* System Architecture */}
                <section className={styles.architectureSection}>
                    <h2>🧠 System Architecture</h2>
                    <div className={styles.architectureGrid}>
                        <div className={styles.architectureCard}>
                            <h3>Spider Engine</h3>
                            <p>High-performance HTTP client with intelligent request routing and concurrent processing</p>
                        </div>
                        <div className={styles.architectureCard}>
                            <h3>Ethical Layer</h3>
                            <p>Robots.txt compliance, politeness controls, and legal framework enforcement</p>
                        </div>
                        <div className={styles.architectureCard}>
                            <h3>Content Processor</h3>
                            <p>HTML parsing, content extraction, metadata analysis, and structured data handling</p>
                        </div>
                        <div className={styles.architectureCard}>
                            <h3>Knowledge Store</h3>
                            <p>MongoDB integration with AI analysis, categorization, and searchable knowledge base</p>
                        </div>
                    </div>
                </section>

                <footer className={styles.footer}>
                    <p>🔥 MOTHER BRAIN combines minigun-level technical capabilities with maximum ethical standards 🕷️</p>
                </footer>
            </div>
        </ErrorBoundary>
    );
};

export default MotherBrainPage;
