import React from 'react';
import { FileText, Code, BookOpen, Download } from 'lucide-react';
import { ErrorBoundary } from '../components';
import styles from './Documentation.module.css';

const Documentation = () => {
    const docSections = [
        {
            icon: BookOpen,
            title: 'Getting Started',
            description: 'Basic setup and configuration guides',
            items: ['Installation', 'First Steps', 'Configuration']
        },
        {
            icon: Code,
            title: 'Developer Docs',
            description: 'Technical documentation for developers',
            items: ['MCP Tools', 'API Reference', 'Contributing']
        },
        {
            icon: FileText,
            title: 'User Guides',
            description: 'How-to guides for community members',
            items: ['Safety Guidelines', 'Community Rules', 'Resources']
        },
        {
            icon: Download,
            title: 'Resources',
            description: 'Downloadable files and assets',
            items: ['Safety PDFs', 'Quick Reference', 'Templates']
        }
    ];

    return (
        <ErrorBoundary>
            <div className={styles.docsPage}>
                <header className={styles.header}>
                    <FileText size={48} />
                    <h1>Documentation</h1>
                    <p>Guides, references, and resources for our community</p>
                </header>

                <div className={styles.docGrid}>
                    {docSections.map((section, index) => {
                        const IconComponent = section.icon;
                        return (
                            <div key={index} className={styles.docCard}>
                                <div className={styles.cardHeader}>
                                    <IconComponent size={32} />
                                    <h3>{section.title}</h3>
                                </div>
                                <p>{section.description}</p>
                                <ul className={styles.docList}>
                                    {section.items.map((item, idx) => (
                                        <li key={idx}>
                                            <a href="#" className={styles.docLink}>
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.comingSoon}>
                    <h3>Coming Soon</h3>
                    <p>Comprehensive documentation is being prepared</p>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Documentation;
