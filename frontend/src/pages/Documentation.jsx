import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { FileText, Book, Settings, Rocket, Palette, Brain, Home as HomeIcon } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import { docsService } from '@services/docsService';
import fallbackDocs from '../data/fallbackDocs';
import styles from './Documentation.module.css';

const Documentation = () => {
    const { docName } = useParams();
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [availableDocs, setAvailableDocs] = useState([]);
    const [docCategories, setDocCategories] = useState({});

    // Helper function to categorize and iconize docs based on filename
    const categorizeDocs = (docs) => {
        const categories = {};

        docs.forEach(doc => {
            const filename = doc.filename;
            let category, icon, title, description;

            // Categorize based on filename patterns
            if (filename === 'README.md') {
                category = 'Getting Started';
                icon = <HomeIcon size={16} />;
                title = 'Documentation Index';
                description = 'Complete documentation navigation guide';
            } else if (filename.includes('BUILD')) {
                category = 'Setup';
                icon = <Settings size={16} />;
                title = 'Build Instructions';
                description = 'Development setup and build configuration';
            } else if (filename.includes('DEPLOYMENT')) {
                category = 'Setup';
                icon = <Rocket size={16} />;
                title = 'Deployment Guide';
                description = 'Production deployment instructions';
            } else if (filename.includes('MOTHER-BRAIN')) {
                category = 'Core System';
                icon = <Brain size={16} />;
                title = 'MOTHER BRAIN System';
                description = 'Complete MOTHER BRAIN integration guide';
            } else if (filename.includes('MCP')) {
                category = 'Integration';
                icon = <Brain size={16} />;
                title = 'MCP Integration';
                description = 'Model Context Protocol guide';
            } else if (filename.includes('FRONTEND')) {
                category = 'Frontend';
                icon = <Palette size={16} />;
                title = 'Frontend Guide';
                description = 'React frontend development guide';
            } else if (filename.includes('SYSTEM') || filename.includes('UNIFIED')) {
                category = 'Architecture';
                icon = <FileText size={16} />;
                title = 'System Architecture';
                description = 'Complete system architecture overview';
            } else if (filename.includes('CRAWLER')) {
                category = 'Legacy';
                icon = <Book size={16} />;
                title = 'Crawler Brain';
                description = 'Intelligent crawler system documentation';
            } else {
                // Default categorization for unknown files
                category = 'Documentation';
                icon = <FileText size={16} />;
                title = filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                description = `${title} documentation`;
            }

            categories[filename] = {
                icon,
                category,
                title,
                description
            };
        });

        return categories;
    };

    const loadDocsList = async () => {
        try {
            const response = await docsService.getDocsList();
            const docs = response.docs || [];
            setAvailableDocs(docs);

            // Categorize the loaded docs
            const categories = categorizeDocs(docs);
            setDocCategories(categories);

        } catch (error) {
            console.error('Error loading docs list:', error);

            // Fallback to hardcoded list if API fails
            const fallbackCategories = {
                'README.md': {
                    icon: <HomeIcon size={16} />,
                    category: 'Getting Started',
                    title: 'Documentation Index',
                    description: 'Complete documentation navigation guide'
                },
                'BUILD.md': {
                    icon: <Settings size={16} />,
                    category: 'Setup',
                    title: 'Build Instructions',
                    description: 'Development setup and build configuration'
                },
                'DEPLOYMENT-GUIDE.md': {
                    icon: <Rocket size={16} />,
                    category: 'Setup',
                    title: 'Deployment Guide',
                    description: 'Production deployment instructions'
                },
                'MOTHER-BRAIN-COMPLETE-GUIDE.md': {
                    icon: <Brain size={16} />,
                    category: 'Core System',
                    title: 'MOTHER BRAIN System',
                    description: 'Complete MOTHER BRAIN integration guide'
                },
                'MCP-COMPLETE-GUIDE.md': {
                    icon: <Brain size={16} />,
                    category: 'Integration',
                    title: 'MCP Integration',
                    description: 'Model Context Protocol guide'
                },
                'FRONTEND-README.md': {
                    icon: <Palette size={16} />,
                    category: 'Frontend',
                    title: 'Frontend Guide',
                    description: 'React frontend development guide'
                },
                'SYSTEM-COMPLETE-UNIFIED.md': {
                    icon: <FileText size={16} />,
                    category: 'Architecture',
                    title: 'System Architecture',
                    description: 'Complete system architecture overview'
                },
                'CRAWLER-BRAIN-README.md': {
                    icon: <Book size={16} />,
                    category: 'Legacy',
                    title: 'Crawler Brain',
                    description: 'Intelligent crawler system documentation'
                }
            };

            setDocCategories(fallbackCategories);
            setAvailableDocs(Object.keys(fallbackCategories).map(filename => ({ filename })));
        }
    };

    useEffect(() => {
        // Load the list of available docs first
        loadDocsList();
    }, []);

    useEffect(() => {
        // Load the specific doc when docName changes or when categories are loaded
        if (Object.keys(docCategories).length > 0) {
            const targetDoc = docName || 'README.md';
            loadMarkdownFile(targetDoc);
        }
    }, [docName, docCategories]); const loadMarkdownFile = async (filename) => {
        setLoading(true);
        setError(null);

        try {
            // Try to load from API first
            const content = await docsService.getDocContent(filename);
            setMarkdownContent(content);
        } catch (err) {
            console.error('Error loading markdown from API:', err);

            // Try fallback content
            const fallbackKey = filename.endsWith('.md') ? filename : `${filename}.md`;
            if (fallbackDocs[fallbackKey]) {
                console.log(`Using fallback content for ${filename}`);
                setMarkdownContent(fallbackDocs[fallbackKey]);
            } else {
                setError(`Documentation not available: ${filename}`);
                setMarkdownContent(`# Documentation Not Available

The documentation file \`${filename}\` could not be loaded from either the server or fallback content.

## Available Documentation

${Object.entries(docCategories).map(([file, info]) =>
                    `- **[${info.title}](/docs/${file.replace('.md', '')})** - ${info.description}`
                ).join('\n')}

## System Status

Please check:
- Backend server is running (\`npm run dev\`)
- Documentation files exist in the \`docs/\` directory
- API endpoint \`/api/docs/\` is accessible

## Quick Links

- [🏠 Home](/) - Return to main site
- [📚 Knowledge Base](/knowledge) - Browse knowledge resources
- [🤖 AI Agents](/agents) - Explore AI capabilities

## Developer Note

This documentation system serves markdown files from the \`docs/\` directory via the \`/api/docs/\` endpoint. When the API is unavailable, fallback content is used for core documentation files.
`);
            }
        } finally {
            setLoading(false);
        }
    }; const groupedDocs = Object.entries(docCategories).reduce((acc, [filename, info]) => {
        if (!acc[info.category]) {
            acc[info.category] = [];
        }
        acc[info.category].push({ filename, ...info });
        return acc;
    }, {});

    // Handle current doc selection - try both with and without .md extension
    const currentDoc = (() => {
        const docParam = docName || 'README';
        const withMd = docParam.endsWith('.md') ? docParam : `${docParam}.md`;
        const withoutMd = docParam.replace('.md', '');

        // Try to find exact match first
        if (docCategories[withMd]) return withMd;
        if (docCategories[`${withoutMd}.md`]) return `${withoutMd}.md`;

        // Default to README.md
        return 'README.md';
    })();

    const currentDocInfo = docCategories[currentDoc];

    return (
        <div className={styles.documentation}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Book size={24} />
                    <h2>Documentation</h2>
                </div>

                {Object.entries(groupedDocs).map(([category, docs]) => (
                    <div key={category} className={styles.docCategory}>
                        <h3 className={styles.categoryTitle}>{category}</h3>
                        <ul className={styles.docList}>
                            {docs.map(({ filename, icon, title, description }) => (
                                <li key={filename}>
                                    <Link
                                        to={`/docs/${filename.replace('.md', '')}`}
                                        className={`${styles.docLink} ${currentDoc === filename ? styles.active : ''}`}
                                    >
                                        <span className={styles.docIcon}>{icon}</span>
                                        <div className={styles.docInfo}>
                                            <span className={styles.docTitle}>{title}</span>
                                            <span className={styles.docDescription}>{description}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className={styles.content}>
                <div className={styles.contentHeader}>
                    {currentDocInfo && (
                        <>
                            <div className={styles.docMeta}>
                                <span className={styles.docIcon}>{currentDocInfo.icon}</span>
                                <div>
                                    <h1>{currentDocInfo.title}</h1>
                                    <p className={styles.docDescription}>{currentDocInfo.description}</p>
                                </div>
                            </div>
                            <div className={styles.docBadge}>{currentDocInfo.category}</div>
                        </>
                    )}
                </div>

                {loading && (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading documentation...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <h3>⚠️ Error Loading Documentation</h3>
                        <p>{error}</p>
                    </div>
                )}

                <div className={styles.markdownContent}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        components={{
                            // Custom component overrides for better styling
                            h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
                            h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
                            h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
                            h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
                            code: ({ node, inline, className, children, ...props }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                    <div className={styles.codeBlock}>
                                        <div className={styles.codeHeader}>
                                            <span className={styles.codeLang}>{match[1]}</span>
                                        </div>
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </div>
                                ) : (
                                    <code className={styles.inlineCode} {...props}>
                                        {children}
                                    </code>
                                );
                            },
                            table: ({ children }) => (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>{children}</table>
                                </div>
                            ),
                            blockquote: ({ children }) => (
                                <blockquote className={styles.blockquote}>{children}</blockquote>
                            ),
                            a: ({ href, children }) => (
                                <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                                    {children}
                                </a>
                            )
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default Documentation;
