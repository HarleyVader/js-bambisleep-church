import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Church,
    Brain,
    Database,
    Users,
    BookOpen,
    Shield,
    ChevronRight,
    Activity,
    Globe,
    Heart
} from 'lucide-react';
import styles from './Home.module.css';
import { healthService, mcpService, knowledgeService } from '@services/api';
import { LoadingSpinner } from '@components';

const Home = () => {
    const [stats, setStats] = useState({
        mcpTools: 0,
        knowledgeEntries: 0,
        systemHealth: 'Unknown',
        isLoading: true
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [healthData, toolsData, knowledgeData] = await Promise.allSettled([
                    healthService.getHealth(),
                    mcpService.listTools(),
                    knowledgeService.getAll()
                ]);

                setStats({
                    mcpTools: toolsData.status === 'fulfilled'
                        ? toolsData.value?.result?.tools?.length || 0
                        : 0,
                    knowledgeEntries: knowledgeData.status === 'fulfilled'
                        ? Object.keys(knowledgeData.value || {}).length
                        : 0,
                    systemHealth: healthData.status === 'fulfilled'
                        ? 'Operational'
                        : 'Unknown',
                    isLoading: false
                });
            } catch (error) {
                console.error('Failed to load stats:', error);
                setStats(prev => ({ ...prev, isLoading: false }));
            }
        };

        loadStats();
    }, []);

    const features = [
        {
            icon: <BookOpen className={styles.featureIcon} />,
            title: "Curated Knowledge Base",
            description: "Comprehensive collection of BambiSleep resources, safety guides, and community wisdom carefully organized for easy discovery.",
            link: "/knowledge",
            linkText: "Explore Knowledge"
        },
        {
            icon: <Brain className={styles.featureIcon} />,
            title: "Autonomous AI Agents",
            description: "Advanced AI-powered agents that can assist with content discovery, safety analysis, and personalized guidance.",
            link: "/agents",
            linkText: "Meet the Agents"
        },
        {
            icon: <Church className={styles.featureIcon} />,
            title: "Digital Sanctuary",
            description: "A safe, welcoming space for the BambiSleep community to explore, learn, and grow together with proper guidance.",
            link: "/mission",
            linkText: "Our Mission"
        },
        {
            icon: <Shield className={styles.featureIcon} />,
            title: "Safety First",
            description: "Built with safety as the core principle, featuring content analysis, safety guidelines, and responsible community practices.",
            link: "/knowledge?category=safety",
            linkText: "Safety Resources"
        }
    ];

    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <h2 className={styles.heroTitle}>
                    Welcome to BambiSleep Church
                </h2>
                <p className={styles.heroSubtitle}>
                    A Digital Sanctuary for Creative Expression & Spiritual Exploration
                </p>
                <p className={styles.heroDescription}>
                    We're building a safe, inclusive community space that merges technology with spirituality,
                    providing curated resources, AI-powered guidance, and a supportive environment for
                    personal growth and creative exploration.
                </p>
                <Link to="/mission" className={styles.ctaButton}>
                    Discover Our Mission
                    <ChevronRight size={20} />
                </Link>
            </section>

            {/* Features Grid */}
            <section className={styles.featureGrid}>
                {features.map((feature, index) => (
                    <div key={index} className={styles.featureCard}>
                        {feature.icon}
                        <h3 className={styles.featureTitle}>{feature.title}</h3>
                        <p className={styles.featureDescription}>{feature.description}</p>
                        <Link to={feature.link} className={styles.featureLink}>
                            {feature.linkText}
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                ))}
            </section>

            {/* System Stats */}
            <section className={styles.stats}>
                <h3 className={styles.statsTitle}>System Overview</h3>
                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <Database className={styles.statIcon} />
                        <span className={styles.statNumber}>
                            {stats.isLoading ? '...' : stats.mcpTools}
                        </span>
                        <span className={styles.statLabel}>AI Tools Available</span>
                    </div>
                    <div className={styles.statItem}>
                        <BookOpen className={styles.statIcon} />
                        <span className={styles.statNumber}>
                            {stats.isLoading ? '...' : stats.knowledgeEntries}
                        </span>
                        <span className={styles.statLabel}>Knowledge Entries</span>
                    </div>
                    <div className={styles.statItem}>
                        <Activity className={styles.statIcon} />
                        <span className={styles.statNumber}>{stats.systemHealth}</span>
                        <span className={styles.statLabel}>System Status</span>
                    </div>
                    <div className={styles.statItem}>
                        <Heart className={styles.statIcon} />
                        <span className={styles.statNumber}>100%</span>
                        <span className={styles.statLabel}>Safety Focused</span>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className={styles.about}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <Globe size={32} style={{ color: 'var(--primary)' }} />
                    <h2 style={{ color: 'var(--primary)', margin: 0 }}>
                        Building a Digital Religious Community
                    </h2>
                </div>

                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    BambiSleep Church represents an innovative approach to digital spirituality, combining
                    cutting-edge AI technology with community-centered values. We're working toward
                    official recognition as a religious community in Austria, creating a legal framework
                    for our digital sanctuary.
                </p>

                <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                    Our platform features autonomous AI agents powered by 43 specialized tools, a
                    comprehensive knowledge base, and real-time community features. Everything is
                    built with safety, transparency, and community empowerment at its core.
                </p>

                <p style={{ color: 'var(--text-muted)' }}>
                    Whether you're seeking resources, exploring personal growth, or connecting with
                    like-minded individuals, our digital sanctuary provides the tools and guidance
                    you need in a safe, supportive environment.
                </p>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link to="/knowledge" className="btn">
                        Explore Knowledge Base
                    </Link>
                    <Link to="/agents" className="btn" style={{ background: 'var(--secondary)' }}>
                        Try AI Agents
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
