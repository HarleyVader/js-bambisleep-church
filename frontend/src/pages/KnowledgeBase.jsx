import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ExternalLink, Star, Calendar, Globe } from 'lucide-react';
import styles from './KnowledgeBase.module.css';
import { knowledgeService } from '@services/api';
import { LoadingSpinner, ErrorMessage } from '@components';

const KnowledgeBase = () => {
    const [knowledge, setKnowledge] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadKnowledge = async () => {
            try {
                setIsLoading(true);
                const data = await knowledgeService.getAll();
                setKnowledge(data || {});
            } catch (err) {
                console.error('Failed to load knowledge:', err);
                setError('Failed to load knowledge base. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        loadKnowledge();
    }, []);

    // Get all unique categories
    const categories = useMemo(() => {
        const cats = new Set();
        Object.values(knowledge).forEach(entry => {
            if (entry.category) cats.add(entry.category);
        });
        return ['all', ...Array.from(cats).sort()];
    }, [knowledge]);

    // Filter knowledge entries
    const filteredEntries = useMemo(() => {
        const entries = Object.entries(knowledge);

        return entries.filter(([key, entry]) => {
            // Category filter
            if (selectedCategory !== 'all' && entry.category !== selectedCategory) {
                return false;
            }

            // Search filter
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    entry.title?.toLowerCase().includes(searchLower) ||
                    entry.description?.toLowerCase().includes(searchLower) ||
                    entry.category?.toLowerCase().includes(searchLower) ||
                    entry.platform?.toLowerCase().includes(searchLower)
                );
            }

            return true;
        }).sort((a, b) => {
            // Sort by relevance score (descending), then by title
            const scoreA = a[1].relevanceScore || 0;
            const scoreB = b[1].relevanceScore || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return (a[1].title || '').localeCompare(b[1].title || '');
        });
    }, [knowledge, searchTerm, selectedCategory]);

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const getCategoryClassName = (category) => {
        switch (category?.toLowerCase()) {
            case 'official': return 'official';
            case 'community': return 'community';
            case 'scripts': return 'scripts';
            case 'safety': return 'safety';
            default: return 'community';
        }
    };

    const formatRelevanceScore = (score) => {
        if (typeof score !== 'number') return 'N/A';
        return `${Math.round(score * 100)}%`;
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <LoadingSpinner text="Loading knowledge base..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <ErrorMessage
                    error={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>Knowledge Base</h1>
                <p className={styles.subtitle}>
                    Curated resources, guides, and community wisdom for safe exploration and learning
                </p>
            </header>

            {/* Search */}
            <div className={styles.searchBox}>
                <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Search knowledge base..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className={styles.searchInput}
                    style={{ paddingLeft: '50px' }}
                />
            </div>

            {/* Category Filters */}
            <div className={styles.filters}>
                {categories.map(category => (
                    <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`${styles.filterButton} ${selectedCategory === category ? styles.active : ''}`}
                    >
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                ))}
            </div>

            {/* Results Count */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                Showing {filteredEntries.length} of {Object.keys(knowledge).length} entries
                {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
                {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {/* Knowledge Grid */}
            {filteredEntries.length > 0 ? (
                <div className={styles.grid}>
                    {filteredEntries.map(([key, entry]) => (
                        <article key={key} className={styles.card}>
                            <div className={styles.cardMeta}>
                                <span className={`${styles.category} ${styles[getCategoryClassName(entry.category)]}`}>
                                    {entry.category || 'General'}
                                </span>
                                {entry.platform && (
                                    <span className={styles.platform}>
                                        <Globe size={12} />
                                        {entry.platform}
                                    </span>
                                )}
                            </div>

                            <h3 className={styles.cardTitle}>
                                {entry.url ? (
                                    <a
                                        href={entry.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Visit ${entry.title}`}
                                    >
                                        {entry.title}
                                        <ExternalLink size={16} style={{ marginLeft: '0.5rem' }} />
                                    </a>
                                ) : (
                                    entry.title
                                )}
                            </h3>

                            <p className={styles.cardDescription}>
                                {entry.description}
                            </p>

                            <footer className={styles.cardFooter}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {entry.lastUpdated && (
                                        <>
                                            <Calendar size={14} />
                                            <span>{new Date(entry.lastUpdated).toLocaleDateString()}</span>
                                        </>
                                    )}
                                </div>

                                <div className={styles.relevance}>
                                    <Star size={14} />
                                    {formatRelevanceScore(entry.relevanceScore)}
                                </div>
                            </footer>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.noResults}>
                    <h3 className={styles.noResultsTitle}>No Results Found</h3>
                    <p>
                        {searchTerm
                            ? `No entries match "${searchTerm}" in the selected category.`
                            : 'No entries found in the selected category.'
                        }
                    </p>
                    <p>Try adjusting your search terms or selecting a different category.</p>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
