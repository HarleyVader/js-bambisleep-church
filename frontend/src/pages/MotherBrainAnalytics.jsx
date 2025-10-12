import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Globe, Database, Clock, Users, Shield, Zap } from 'lucide-react';
import { ErrorBoundary } from '../components';
import styles from './MotherBrainAnalytics.module.css';

const MotherBrainAnalytics = () => {
    const [timeRange, setTimeRange] = useState('24h');
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState({
        overview: {
            totalPages: 15847,
            successRate: 94.2,
            respectfulnessScore: 98.7,
            activeCrawlers: 3,
            avgResponseTime: 1.2,
            dataDiscovered: 2.3
        },
        crawlStats: {
            hostsVisited: 127,
            robotsTxtRespected: 100,
            crawlDelaysHonored: 100,
            backoffTriggered: 23,
            errorRate: 5.8
        },
        contentAnalysis: {
            bambiContent: 45,
            safetyContent: 12,
            communityContent: 38,
            technicalContent: 15,
            beginnerContent: 22
        },
        performance: {
            requestsPerSecond: 2.4,
            concurrentConnections: 3,
            queueHealth: 92,
            memoryUsage: 156,
            uptime: '7d 14h 32m'
        }
    });

    const metrics = [
        {
            title: 'Total Pages Crawled',
            value: analytics.overview.totalPages.toLocaleString(),
            icon: <Globe size={24} />,
            color: 'var(--secondary-purple)',
            trend: '+12.5%'
        },
        {
            title: 'Success Rate',
            value: `${analytics.overview.successRate}%`,
            icon: <TrendingUp size={24} />,
            color: 'var(--accent-success)',
            trend: '+0.8%'
        },
        {
            title: 'Respectfulness Score',
            value: `${analytics.overview.respectfulnessScore}%`,
            icon: <Shield size={24} />,
            color: 'var(--accent-success)',
            trend: '+0.3%'
        },
        {
            title: 'Active Crawlers',
            value: analytics.overview.activeCrawlers.toString(),
            icon: <Zap size={24} />,
            color: 'var(--accent-danger)',
            trend: 'stable'
        },
        {
            title: 'Avg Response Time',
            value: `${analytics.overview.avgResponseTime}s`,
            icon: <Clock size={24} />,
            color: 'var(--accent-warning)',
            trend: '-0.2s'
        },
        {
            title: 'Data Discovered',
            value: `${analytics.overview.dataDiscovered} GB`,
            icon: <Database size={24} />,
            color: 'var(--secondary-purple)',
            trend: '+0.8 GB'
        }
    ];

    const ethicalMetrics = [
        { label: 'Robots.txt Respected', value: analytics.crawlStats.robotsTxtRespected, max: 100, color: 'var(--accent-success)' },
        { label: 'Crawl-delay Honored', value: analytics.crawlStats.crawlDelaysHonored, max: 100, color: 'var(--accent-success)' },
        { label: 'Respectfulness Score', value: analytics.overview.respectfulnessScore, max: 100, color: 'var(--accent-success)' },
        { label: 'Queue Health', value: analytics.performance.queueHealth, max: 100, color: 'var(--secondary-purple)' }
    ];

    const contentCategories = [
        { name: 'BambiSleep Content', value: analytics.contentAnalysis.bambiContent, color: 'var(--accent-danger)' },
        { name: 'Community Content', value: analytics.contentAnalysis.communityContent, color: 'var(--secondary-purple)' },
        { name: 'Safety Resources', value: analytics.contentAnalysis.safetyContent, color: 'var(--accent-success)' },
        { name: 'Beginner Content', value: analytics.contentAnalysis.beginnerContent, color: 'var(--accent-warning)' },
        { name: 'Technical Docs', value: analytics.contentAnalysis.technicalContent, color: 'var(--text-muted)' }
    ];

    const recentActivity = [
        { time: '14:32', event: 'Started crawl of bambisleep.info/FAQ', status: 'success', pages: 12 },
        { time: '14:28', event: 'Respected crawl-delay for reddit.com', status: 'ethical', pages: 0 },
        { time: '14:25', event: 'Discovered 15 new BambiSleep resources', status: 'discovery', pages: 15 },
        { time: '14:22', event: 'Triggered backoff for slow host', status: 'warning', pages: 0 },
        { time: '14:18', event: 'Completed safety content analysis', status: 'success', pages: 8 },
        { time: '14:15', event: 'Honored robots.txt exclusion', status: 'ethical', pages: 0 },
        { time: '14:12', event: 'Found community discussion thread', status: 'discovery', pages: 23 }
    ];

    const hostStats = [
        { host: 'bambisleep.info', pages: 4521, success: 97.2, avgDelay: 2.1 },
        { host: 'reddit.com', pages: 3847, success: 89.4, avgDelay: 3.5 },
        { host: 'github.com', pages: 2156, success: 98.9, avgDelay: 1.8 },
        { host: 'bambisleep.fandom.com', pages: 1923, success: 94.6, avgDelay: 2.3 },
        { host: 'wiki.bambi-sleep.com', pages: 1687, success: 96.1, avgDelay: 2.0 }
    ];

    const tabs = [
        { id: 'overview', name: 'Overview', icon: <BarChart3 size={20} /> },
        { id: 'ethical', name: 'Ethics', icon: <Shield size={20} /> },
        { id: 'content', name: 'Content', icon: <Database size={20} /> },
        { id: 'performance', name: 'Performance', icon: <Zap size={20} /> }
    ];

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setAnalytics(prev => ({
                ...prev,
                overview: {
                    ...prev.overview,
                    totalPages: prev.overview.totalPages + Math.floor(Math.random() * 10),
                    activeCrawlers: Math.max(1, Math.min(5, prev.overview.activeCrawlers + (Math.random() > 0.5 ? 1 : -1)))
                }
            }));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const getActivityIcon = (status) => {
        switch (status) {
            case 'success': return <TrendingUp size={16} />;
            case 'ethical': return <Shield size={16} />;
            case 'discovery': return <Globe size={16} />;
            case 'warning': return <Clock size={16} />;
            default: return <BarChart3 size={16} />;
        }
    };

    const getActivityColor = (status) => {
        switch (status) {
            case 'success': return 'var(--accent-success)';
            case 'ethical': return 'var(--accent-success)';
            case 'discovery': return 'var(--secondary-purple)';
            case 'warning': return 'var(--accent-warning)';
            default: return 'var(--text-muted)';
        }
    };

    return (
        <ErrorBoundary>
            <div className={styles.analyticsPage}>
                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <BarChart3 size={48} />
                        <div>
                            <h1>📊 MOTHER BRAIN Analytics</h1>
                            <p>Real-time crawler metrics and ethical compliance monitoring</p>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value)}
                            className={styles.timeSelect}
                        >
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>
                </header>

                {/* Key Metrics */}
                <section className={styles.metricsGrid}>
                    {metrics.map((metric, index) => (
                        <div key={index} className={styles.metricCard}>
                            <div className={styles.metricHeader}>
                                <div className={styles.metricIcon} style={{ color: metric.color }}>
                                    {metric.icon}
                                </div>
                                <span className={styles.metricTrend}>{metric.trend}</span>
                            </div>
                            <div className={styles.metricValue}>{metric.value}</div>
                            <div className={styles.metricTitle}>{metric.title}</div>
                        </div>
                    ))}
                </section>

                {/* Tabs */}
                <nav className={styles.tabNav}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <div className={styles.overviewGrid}>
                            <div className={styles.activityPanel}>
                                <h3>🔄 Recent Activity</h3>
                                <div className={styles.activityList}>
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className={styles.activityItem}>
                                            <div 
                                                className={styles.activityIcon}
                                                style={{ color: getActivityColor(activity.status) }}
                                            >
                                                {getActivityIcon(activity.status)}
                                            </div>
                                            <div className={styles.activityDetails}>
                                                <span className={styles.activityTime}>{activity.time}</span>
                                                <span className={styles.activityEvent}>{activity.event}</span>
                                                {activity.pages > 0 && (
                                                    <span className={styles.activityPages}>
                                                        {activity.pages} pages
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.hostStatsPanel}>
                                <h3>🌐 Host Statistics</h3>
                                <div className={styles.hostTable}>
                                    <div className={styles.hostHeader}>
                                        <span>Host</span>
                                        <span>Pages</span>
                                        <span>Success</span>
                                        <span>Delay</span>
                                    </div>
                                    {hostStats.map((host, index) => (
                                        <div key={index} className={styles.hostRow}>
                                            <span className={styles.hostName}>{host.host}</span>
                                            <span>{host.pages.toLocaleString()}</span>
                                            <span className={styles.successRate}>{host.success}%</span>
                                            <span>{host.avgDelay}s</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ethical' && (
                        <div className={styles.ethicalGrid}>
                            <div className={styles.ethicalPanel}>
                                <h3>🛡️ Ethical Compliance</h3>
                                <div className={styles.ethicalMetrics}>
                                    {ethicalMetrics.map((metric, index) => (
                                        <div key={index} className={styles.ethicalMetric}>
                                            <div className={styles.ethicalLabel}>
                                                <span>{metric.label}</span>
                                                <span>{metric.value}%</span>
                                            </div>
                                            <div className={styles.ethicalBar}>
                                                <div 
                                                    className={styles.ethicalFill}
                                                    style={{ 
                                                        width: `${(metric.value / metric.max) * 100}%`,
                                                        backgroundColor: metric.color
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.compliancePanel}>
                                <h3>📋 Compliance Details</h3>
                                <div className={styles.complianceList}>
                                    <div className={styles.complianceItem}>
                                        <Shield size={20} />
                                        <span>Robots.txt files processed: 127</span>
                                    </div>
                                    <div className={styles.complianceItem}>
                                        <Clock size={20} />
                                        <span>Crawl-delay directives honored: 89</span>
                                    </div>
                                    <div className={styles.complianceItem}>
                                        <Users size={20} />
                                        <span>User-Agent identification: Clear</span>
                                    </div>
                                    <div className={styles.complianceItem}>
                                        <TrendingUp size={20} />
                                        <span>Backoff events triggered: 23</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className={styles.contentGrid}>
                            <div className={styles.contentPanel}>
                                <h3>📚 Content Categories</h3>
                                <div className={styles.contentChart}>
                                    {contentCategories.map((category, index) => (
                                        <div key={index} className={styles.contentBar}>
                                            <div className={styles.contentLabel}>
                                                <span>{category.name}</span>
                                                <span>{category.value}%</span>
                                            </div>
                                            <div className={styles.contentBarFill}>
                                                <div 
                                                    className={styles.contentFill}
                                                    style={{ 
                                                        width: `${category.value}%`,
                                                        backgroundColor: category.color
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.discoveryPanel}>
                                <h3>🔍 Discovery Insights</h3>
                                <div className={styles.discoveryStats}>
                                    <div className={styles.discoveryStat}>
                                        <Database size={24} />
                                        <div>
                                            <div className={styles.discoveryValue}>2,847</div>
                                            <div className={styles.discoveryLabel}>Unique Resources</div>
                                        </div>
                                    </div>
                                    <div className={styles.discoveryStat}>
                                        <Globe size={24} />
                                        <div>
                                            <div className={styles.discoveryValue}>167</div>
                                            <div className={styles.discoveryLabel}>External Links</div>
                                        </div>
                                    </div>
                                    <div className={styles.discoveryStat}>
                                        <Shield size={24} />
                                        <div>
                                            <div className={styles.discoveryValue}>45</div>
                                            <div className={styles.discoveryLabel}>Safety Pages</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'performance' && (
                        <div className={styles.performanceGrid}>
                            <div className={styles.performancePanel}>
                                <h3>⚡ System Performance</h3>
                                <div className={styles.performanceMetrics}>
                                    <div className={styles.performanceItem}>
                                        <div className={styles.performanceLabel}>Requests/Second</div>
                                        <div className={styles.performanceValue}>{analytics.performance.requestsPerSecond}</div>
                                    </div>
                                    <div className={styles.performanceItem}>
                                        <div className={styles.performanceLabel}>Concurrent Connections</div>
                                        <div className={styles.performanceValue}>{analytics.performance.concurrentConnections}</div>
                                    </div>
                                    <div className={styles.performanceItem}>
                                        <div className={styles.performanceLabel}>Memory Usage</div>
                                        <div className={styles.performanceValue}>{analytics.performance.memoryUsage} MB</div>
                                    </div>
                                    <div className={styles.performanceItem}>
                                        <div className={styles.performanceLabel}>System Uptime</div>
                                        <div className={styles.performanceValue}>{analytics.performance.uptime}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default MotherBrainAnalytics;