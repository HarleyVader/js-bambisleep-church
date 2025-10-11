import React, { useState, useEffect, useMemo } from 'react';
import { Search, ExternalLink, ThumbsUp, ThumbsDown, TrendingUp, Globe } from 'lucide-react';
import styles from './KnowledgeBase.module.css';
import { knowledgeService } from '@services/api';
import { LoadingSpinner, ErrorMessage } from '@components';

const KnowledgeBase = () => {
    const [knowledge, setKnowledge] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [votes, setVotes] = useState({});

    useEffect(() => {
        const loadKnowledge = async () => {
            try {
                setIsLoading(true);
                const data = await knowledgeService.getAll();
                setKnowledge(data || {});

                // Load voting data from localStorage
                const savedVotes = localStorage.getItem('knowledge-votes');
                if (savedVotes) {
                    setVotes(JSON.parse(savedVotes));
                }
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

    const handleVote = (entryId, voteType) => {
        const newVotes = { ...votes };
        if (!newVotes[entryId]) {
            newVotes[entryId] = { up: 0, down: 0, userVote: null };
        }

        const entry = newVotes[entryId];

        // Remove previous vote if exists
        if (entry.userVote === 'up') entry.up--;
        if (entry.userVote === 'down') entry.down--;

        // Add new vote if different from current
        if (entry.userVote !== voteType) {
            if (voteType === 'up') entry.up++;
            if (voteType === 'down') entry.down++;
            entry.userVote = voteType;
        } else {
            entry.userVote = null; // Remove vote if clicking same button
        }

        setVotes(newVotes);
        localStorage.setItem('knowledge-votes', JSON.stringify(newVotes));
    };

    const getVoteStats = (entryId) => {
        return votes[entryId] || { up: 0, down: 0, userVote: null };
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
                    {filteredEntries.map(([key, entry]) => {
                        const voteStats = getVoteStats(key);
                        const netVotes = voteStats.up - voteStats.down;

                        return (
                            <article key={key} className={styles.linkCard}>
                                <div className={styles.cardHeader}>
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

                                    <div className={styles.voteControls}>
                                        <button
                                            className={`${styles.voteButton} ${styles.upvote} ${voteStats.userVote === 'up' ? styles.active : ''}`}
                                            onClick={() => handleVote(key, 'up')}
                                            title="Upvote this resource"
                                        >
                                            <ThumbsUp size={16} />
                                            <span>{voteStats.up}</span>
                                        </button>

                                        <button
                                            className={`${styles.voteButton} ${styles.downvote} ${voteStats.userVote === 'down' ? styles.active : ''}`}
                                            onClick={() => handleVote(key, 'down')}
                                            title="Downvote this resource"
                                        >
                                            <ThumbsDown size={16} />
                                            <span>{voteStats.down}</span>
                                        </button>

                                        <div className={`${styles.netScore} ${netVotes > 0 ? styles.positive : netVotes < 0 ? styles.negative : ''}`}>
                                            <TrendingUp size={14} />
                                            <span>{netVotes > 0 ? '+' : ''}{netVotes}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.linkContainer}>
                                    {entry.url ? (
                                        <a
                                            href={entry.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.mainLink}
                                            title={entry.description}
                                        >
                                            <span className={styles.linkTitle}>{entry.title}</span>
                                            <ExternalLink size={18} className={styles.linkIcon} />
                                        </a>
                                    ) : (
                                        <div className={styles.linkTitle}>
                                            {entry.title}
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
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
