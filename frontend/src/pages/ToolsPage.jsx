import React, { useState } from 'react';
import { Brain, Database, Bot, Zap, Globe } from 'lucide-react';
import { LoadingSpinner, ErrorBoundary } from '../components';
import styles from './ToolsPage.module.css';

const ToolsPage = () => {
    const [activeCategory, setActiveCategory] = useState(null);

    const toolCategories = [
        {
            id: 'bambi',
            name: 'BambiSleep',
            icon: Brain,
            count: 5,
            color: 'var(--primary-pink)',
            description: 'Community knowledge & safety tools'
        },
        {
            id: 'mongodb',
            name: 'Database',
            icon: Database,
            count: 15,
            color: 'var(--secondary-green)',
            description: 'MongoDB management & queries'
        },
        {
            id: 'lmstudio',
            name: 'AI Models',
            icon: Bot,
            count: 10,
            color: 'var(--secondary-blue)',
            description: 'LMStudio AI interactions'
        },
        {
            id: 'agentic',
            name: 'Autonomous',
            icon: Zap,
            count: 7,
            color: 'var(--tertiary-pink)',
            description: 'Self-managing AI agents'
        },
        {
            id: 'motherBrain',
            name: 'Spider Crawler',
            icon: Globe,
            count: 5,
            color: 'var(--accent)',
            description: 'MOTHER BRAIN web crawler'
        }
    ];

    return (
        <ErrorBoundary>
            <div className={styles.toolsPage}>
                <header className={styles.header}>
                    <h1>Tool Ecosystem</h1>
                    <p>48 tools across 5 categories - Keep it simple, stupid</p>
                </header>

                <div className={styles.categories}>
                    {toolCategories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                            <div
                                key={category.id}
                                className={`${styles.categoryCard} ${activeCategory === category.id ? styles.active : ''}`}
                                onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                                style={{ '--category-color': category.color }}
                            >
                                <div className={styles.cardHeader}>
                                    <IconComponent size={24} />
                                    <h3>{category.name}</h3>
                                    <span className={styles.count}>{category.count}</span>
                                </div>
                                <p>{category.description}</p>

                                {activeCategory === category.id && (
                                    <div className={styles.categoryContent}>
                                        <p>Tools for {category.name} coming soon...</p>
                                        <div className={styles.placeholder}>
                                            <LoadingSpinner size="small" />
                                            <span>Loading {category.name} tools...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <footer className={styles.footer}>
                    <p>Flexible • Upgradable • Stupid Simple</p>
                </footer>
            </div>
        </ErrorBoundary>
    );
};

export default ToolsPage;
