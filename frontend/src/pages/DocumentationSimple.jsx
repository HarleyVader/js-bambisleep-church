import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Book, Settings, Rocket, Palette, Brain, Home as HomeIcon } from 'lucide-react';
import { docsService } from '@services/docsService';
import fallbackDocs from '../data/fallbackDocs';
import styles from './Documentation.module.css';

const DocumentationSimple = () => {
    const { docName } = useParams();
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableDocs, setAvailableDocs] = useState([]);

    useEffect(() => {
        loadDocumentation();
    }, [docName]);

    const loadDocumentation = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!docName) {
                // Show documentation index
                setMarkdownContent(fallbackDocs['README.md'] || '# Documentation\n\nNo content available.');
                setAvailableDocs(Object.keys(fallbackDocs));
            } else {
                // Try to load specific document
                const content = fallbackDocs[`${docName}.md`] || 
                               fallbackDocs[docName] || 
                               '# Document Not Found\n\nThe requested document could not be found.';
                setMarkdownContent(content);
            }
        } catch (err) {
            console.error('Error loading documentation:', err);
            setError('Failed to load documentation');
            setMarkdownContent('# Error\n\nFailed to load documentation content.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading documentation...</p>
            </div>
        );
    }

    return (
        <div className={styles.documentation}>
            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <FileText size={24} />
                        <h2>Documentation</h2>
                    </div>
                    
                    <nav className={styles.nav}>
                        <Link to="/docs" className={!docName ? styles.active : ''}>
                            <HomeIcon size={16} />
                            <span>Overview</span>
                        </Link>
                        
                        {availableDocs.map(doc => {
                            const name = doc.replace('.md', '');
                            if (name === 'README') return null;
                            
                            return (
                                <Link
                                    key={name}
                                    to={`/docs/${name}`}
                                    className={docName === name ? styles.active : ''}
                                >
                                    <FileText size={16} />
                                    <span>{name.replace(/-/g, ' ')}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <main className={styles.content}>
                    {error && (
                        <div className={styles.error}>
                            <p>⚠️ {error}</p>
                        </div>
                    )}
                    
                    <div className={styles.markdownContent}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                            {markdownContent}
                        </pre>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DocumentationSimple;