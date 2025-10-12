import React, { useState, useEffect } from 'react';
import { Activity, Database, Bot, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingSpinner, ErrorBoundary } from '../components';
import styles from './DashboardPage.module.css';

const DashboardPage = () => {
    const [systemStatus, setSystemStatus] = useState({
        mongodb: { status: 'unknown', message: 'Checking...' },
        lmstudio: { status: 'unknown', message: 'Checking...' },
        agentic: { status: 'unknown', message: 'Checking...' },
        motherBrain: { status: 'unknown', message: 'Checking...' }
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // TODO: Connect to MCP tools for real status
        setTimeout(() => {
            setSystemStatus({
                mongodb: { status: 'healthy', message: 'Connected to BambiSleep database' },
                lmstudio: { status: 'healthy', message: 'AI models ready' },
                agentic: { status: 'warning', message: 'Autonomous agents paused' },
                motherBrain: { status: 'error', message: 'Spider system offline' }
            });
            setIsLoading(false);
        }, 2000);
    }, []);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'healthy': return <CheckCircle className={styles.healthy} size={20} />;
            case 'warning': return <AlertCircle className={styles.warning} size={20} />;
            case 'error': return <AlertCircle className={styles.error} size={20} />;
            default: return <LoadingSpinner size="small" />;
        }
    };

    const systems = [
        {
            id: 'mongodb',
            name: 'Database',
            icon: Database,
            description: 'MongoDB knowledge storage',
            color: 'var(--secondary-green)'
        },
        {
            id: 'lmstudio',
            name: 'AI Models',
            icon: Bot,
            description: 'LMStudio AI processing',
            color: 'var(--secondary-blue)'
        },
        {
            id: 'agentic',
            name: 'Autonomous Agents',
            icon: Zap,
            description: 'Self-managing AI workers',
            color: 'var(--tertiary-pink)'
        },
        {
            id: 'motherBrain',
            name: 'Spider Crawler',
            icon: Activity,
            description: 'MOTHER BRAIN web system',
            color: 'var(--accent)'
        }
    ];

    const overallStatus = Object.values(systemStatus).every(s => s.status === 'healthy') ? 'healthy' :
        Object.values(systemStatus).some(s => s.status === 'error') ? 'error' : 'warning';

    return (
        <ErrorBoundary>
            <div className={styles.dashboardPage}>
                <header className={styles.header}>
                    <h1>System Dashboard</h1>
                    <div className={`${styles.overallStatus} ${styles[overallStatus]}`}>
                        {getStatusIcon(overallStatus)}
                        <span>
                            {overallStatus === 'healthy' ? 'All Systems Operational' :
                                overallStatus === 'warning' ? 'Some Issues Detected' :
                                    'Critical Systems Down'}
                        </span>
                    </div>
                </header>

                {isLoading ? (
                    <div className={styles.loading}>
                        <LoadingSpinner />
                        <span>Checking system status...</span>
                    </div>
                ) : (
                    <div className={styles.systemGrid}>
                        {systems.map((system) => {
                            const IconComponent = system.icon;
                            const status = systemStatus[system.id];

                            return (
                                <div
                                    key={system.id}
                                    className={`${styles.systemCard} ${styles[status.status]}`}
                                    style={{ '--system-color': system.color }}
                                >
                                    <div className={styles.cardHeader}>
                                        <IconComponent size={24} />
                                        <h3>{system.name}</h3>
                                        {getStatusIcon(status.status)}
                                    </div>

                                    <p className={styles.description}>{system.description}</p>
                                    <p className={styles.statusMessage}>{status.message}</p>

                                    <div className={styles.cardActions}>
                                        <button className={styles.actionButton}>
                                            {status.status === 'error' ? 'Restart' : 'Configure'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <footer className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>48</span>
                        <span className={styles.statLabel}>Total Tools</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>5</span>
                        <span className={styles.statLabel}>Categories</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>∞</span>
                        <span className={styles.statLabel}>Simplicity</span>
                    </div>
                </footer>
            </div>
        </ErrorBoundary>
    );
};

export default DashboardPage;
