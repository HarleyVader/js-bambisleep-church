import React, { useState } from 'react';
import { Search, BookOpen, Shield, Users, Zap } from 'lucide-react';
import { SearchBox, LoadingSpinner, ErrorBoundary } from '../components';
import styles from './KnowledgePage.module.css';

const KnowledgePage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const categories = [
        { id: 'all', name: 'All', icon: BookOpen },
        { id: 'safety', name: 'Safety', icon: Shield },
        { id: 'beginners', name: 'Beginners', icon: Users },
        { id: 'sessions', name: 'Sessions', icon: Zap },
        { id: 'community', name: 'Community', icon: Users },
        { id: 'technical', name: 'Technical', icon: BookOpen }
    ];

    const handleSearch = async (query) => {
        if (!query.trim()) return;

        setIsLoading(true);
        setSearchQuery(query);

        // TODO: Connect to MCP bambi-tools search-knowledge
        setTimeout(() => {
            setResults([
                {
                    id: 1,
                    title: 'BambiSleep Safety Guidelines',
                    summary: 'Essential safety information for new users',
                    category: 'safety',
                    url: '#'
                },
                {
                    id: 2,
                    title: 'Getting Started Guide',
                    summary: 'Step by step introduction to BambiSleep',
                    category: 'beginners',
                    url: '#'
                }
            ]);
            setIsLoading(false);
        }, 1000);
    };

    const getCategoryIcon = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.icon : BookOpen;
    };

    return (
        <ErrorBoundary>
            <div className={styles.knowledgePage}>
                <header className={styles.header}>
                    <h1>Knowledge Base</h1>
                    <p>Search community resources, guides, and safety information</p>
                </header>

                <div className={styles.searchSection}>
                    <SearchBox
                        placeholder="Search knowledge base..."
                        onSearch={handleSearch}
                        className={styles.searchBox}
                    />

                    <div className={styles.categories}>
                        {categories.map((category) => {
                            const IconComponent = category.icon;
                            return (
                                <button
                                    key={category.id}
                                    className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
                                >
                                    <IconComponent size={16} />
                                    {category.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.results}>
                    {isLoading && (
                        <div className={styles.loading}>
                            <LoadingSpinner />
                            <span>Searching knowledge base...</span>
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <div className={styles.resultsList}>
                            <h3>Found {results.length} results for "{searchQuery}"</h3>
                            {results.map((result) => {
                                const IconComponent = getCategoryIcon(result.category);
                                return (
                                    <div key={result.id} className={styles.resultCard}>
                                        <div className={styles.resultHeader}>
                                            <IconComponent className={styles.categoryIcon} size={18} />
                                            <h4>{result.title}</h4>
                                            <span className={styles.categoryBadge}>{result.category}</span>
                                        </div>
                                        <p>{result.summary}</p>
                                        <a href={result.url} className={styles.readMore}>
                                            Read more →
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {!isLoading && searchQuery && results.length === 0 && (
                        <div className={styles.noResults}>
                            <Search size={48} />
                            <h3>No results found</h3>
                            <p>Try different keywords or browse categories</p>
                        </div>
                    )}

                    {!searchQuery && (
                        <div className={styles.welcome}>
                            <BookOpen size={64} />
                            <h3>Welcome to the Knowledge Base</h3>
                            <p>Search above or select a category to get started</p>
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default KnowledgePage;
