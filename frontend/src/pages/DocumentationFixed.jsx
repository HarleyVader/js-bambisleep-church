import React, { useState, useEffect, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Book, Settings, Rocket, Palette, Brain, Home as HomeIcon } from 'lucide-react';
import { docsService } from '@services/docsService';
import fallbackDocs from '../data/fallbackDocs';
import styles from './Documentation.module.css';

// Lazy load heavy markdown dependencies
const ReactMarkdown = React.lazy(() => import('react-markdown'));
const remarkGfm = React.lazy(() => import('remark-gfm'));
const remarkBreaks = React.lazy(() => import('remark-breaks'));
const rehypeHighlight = React.lazy(() => import('rehype-highlight'));
const rehypeRaw = React.lazy(() => import('rehype-raw'));

// Simple markdown fallback component
const SimpleMarkdown = ({ content }) => {
    // Basic markdown rendering without heavy dependencies
    const renderSimpleMarkdown = (text) => {
        return text
            .split('\n')
            .map((line, index) => {
                // Headers
                if (line.startsWith('# ')) {
                    return <h1 key={index} style={{ fontSize: '2em', fontWeight: 'bold', margin: '1em 0' }}>{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                    return <h2 key={index} style={{ fontSize: '1.5em', fontWeight: 'bold', margin: '0.8em 0' }}>{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                    return <h3 key={index} style={{ fontSize: '1.2em', fontWeight: 'bold', margin: '0.6em 0' }}>{line.slice(4)}</h3>;
                }
                
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                // Code blocks
                if (line.startsWith('```')) {
                    return <div key={index} style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '10px', margin: '10px 0' }}>Code Block</div>;
                }
                
                // Links
                line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                
                // Empty lines
                if (!line.trim()) {
                    return <br key={index} />;
                }
                
                return (
                    <p 
                        key={index} 
                        style={{ margin: '0.5em 0', lineHeight: '1.6' }}
                        dangerouslySetInnerHTML={{ __html: line }}
                    />
                );
            });
    };

    return <div>{renderSimpleMarkdown(content)}</div>;
};

const Documentation = () => {
    const { docName } = useParams();
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableDocs, setAvailableDocs] = useState([]);
    const [useAdvancedMarkdown, setUseAdvancedMarkdown] = useState(false);

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
                // Try to load specific document from fallback first
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

    const toggleAdvancedMarkdown = () => {
        setUseAdvancedMarkdown(!useAdvancedMarkdown);
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

                    <div className={styles.settings}>
                        <button 
                            onClick={toggleAdvancedMarkdown}
                            className={styles.toggleButton}
                            title="Toggle advanced markdown rendering"
                        >
                            {useAdvancedMarkdown ? '🔥 Advanced' : '⚡ Simple'} Rendering
                        </button>
                    </div>
                </div>

                <main className={styles.content}>
                    {error && (
                        <div className={styles.error}>
                            <p>⚠️ {error}</p>
                        </div>
                    )}
                    
                    <div className={styles.markdownContent}>
                        {useAdvancedMarkdown ? (
                            <Suspense fallback={
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <div className={styles.spinner}></div>
                                    <p>Loading advanced markdown renderer...</p>
                                </div>
                            }>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkBreaks]}
                                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                    components={{
                                        code({ node, inline, className, children, ...props }) {
                                            return (
                                                <code
                                                    className={className}
                                                    style={{
                                                        background: inline ? '#f0f0f0' : 'transparent',
                                                        padding: inline ? '2px 4px' : '0',
                                                        borderRadius: '3px',
                                                        fontFamily: 'monospace'
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </code>
                                            );
                                        }
                                    }}
                                >
                                    {markdownContent}
                                </ReactMarkdown>
                            </Suspense>
                        ) : (
                            <SimpleMarkdown content={markdownContent} />
                        )}
                    </div>

                    <div className={styles.footer}>
                        <p>
                            💡 <strong>Tip:</strong> Click "{useAdvancedMarkdown ? 'Simple' : 'Advanced'} Rendering" 
                            to {useAdvancedMarkdown ? 'use lightweight' : 'enable syntax highlighting and'} markdown processing.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Documentation;