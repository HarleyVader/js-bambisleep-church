import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, ThumbsUp, ThumbsDown, TrendingUp, Globe, Filter, Grid, List } from 'lucide-react';
import styles from './KnowledgeBase.module.css';
import { knowledgeService } from '@services/api';
import { LoadingSpinner, ErrorMessage, SearchBox } from '@components';
import { useApi, useLocalStorage } from '@hooks';
import { useApp } from '@/contexts/AppContext';

const KnowledgeBase = () => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('relevance');
    const [viewMode, setViewMode] = useState('grid');
    const [votes, setVotes] = useLocalStorage('knowledge-votes', {});

    const { actions } = useApp();

    // Enhanced API hook with notifications
    const { data: knowledge, loading: isLoading, error, refetch } = useApi(
        () => knowledgeService.getAll(),
        [],
        {
            showNotifications: true,
            cacheKey: 'knowledge-base'
        }
    );

    const knowledgeEntries = useMemo(() => {
        return knowledge ? Object.entries(knowledge) : [];
    }, [knowledge]);

    // Get all unique categories
    const categories = useMemo(() => {
        const cats = new Set();
        knowledgeEntries.forEach(([, entry]) => {
            if (entry.category) cats.add(entry.category);
        });
        return Array.from(cats).sort();
    }, [knowledgeEntries]);

    // Filter and search entries
    const filteredEntries = useMemo(() => {
        let filtered = knowledgeEntries;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(([, entry]) =>
                entry.title?.toLowerCase().includes(query) ||
                entry.description?.toLowerCase().includes(query) ||
                entry.category?.toLowerCase().includes(query)
            );
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(([, entry]) => entry.category === selectedCategory);
        }

        // Apply sorting
        filtered.sort(([keyA, entryA], [keyB, entryB]) => {
            switch (sortBy) {
                case 'popularity':
                    const votesA = (votes[keyA]?.up || 0) - (votes[keyA]?.down || 0);
                    const votesB = (votes[keyB]?.up || 0) - (votes[keyB]?.down || 0);
                    return votesB - votesA;
                case 'alphabetical':
                    return (entryA.title || '').localeCompare(entryB.title || '');
                case 'category':
                    return (entryA.category || '').localeCompare(entryB.category || '');
                case 'relevance':
                default:
                    return (entryB.relevance || 0) - (entryA.relevance || 0);
            }
        });

        return filtered;
    }, [knowledgeEntries, searchQuery, selectedCategory, sortBy, votes]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    const pagination = {
        currentPage,
        totalPages,
        startIndex,
        endIndex,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages,
        prevPage: () => setCurrentPage(prev => Math.max(1, prev - 1)),
        nextPage: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)),
        reset: () => setCurrentPage(1)
    };

    const handleSearch = ({ query, categories: searchCategories, sortBy: searchSortBy }) => {
        setSearchQuery(query);
        if (searchCategories && searchCategories.length > 0) {
            setSelectedCategory(searchCategories[0]);
        }
        if (searchSortBy) {
            setSortBy(searchSortBy);
        }
        setCurrentPage(1);
    };

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filteredEntries.length]);

    const handleVote = (entryKey, voteType) => {
        const newVotes = {
            ...votes,
            [entryKey]: {
                up: votes[entryKey]?.up || 0,
                down: votes[entryKey]?.down || 0
            }
        };

        if (voteType === 'up') {
            newVotes[entryKey].up += 1;
        } else {
            newVotes[entryKey].down += 1;
        }

        setVotes(newVotes);

        actions.addNotification({
            message: `Vote ${voteType === 'up' ? 'recorded' : 'recorded'}!`,
            type: 'success'
        });
    };

    const handleVoteOld = (entryId, voteType) => {
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

            {/* Enhanced Search with Filters */}
            <div className={styles.searchSection}>
                <SearchBox
                    onSearch={handleSearch}
                    placeholder="Search knowledge base..."
                    showFilters={true}
                    showHistory={true}
                    categories={categories}
                    className={styles.searchBox}
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

            {/* View Mode Selector */}
            <div className={styles.viewControls}>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                >
                    <Grid size={16} />
                    Grid
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                >
                    <List size={16} />
                    List
                </button>
            </div>

            {/* Results Count */}
            <div className={styles.resultsCount}>
                Showing {filteredEntries.length} of {knowledgeEntries.length} entries
                {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
                {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Knowledge Entries Grid/List */}
            {paginatedEntries.length > 0 ? (
                <div className={`${styles.knowledgeGrid} ${styles[viewMode]}`}>
                    {paginatedEntries.map(([key, entry]) => (
                        <article key={key} className={styles.knowledgeCard}>
                            <div className={styles.cardHeader}>
                                <h3 className={styles.cardTitle}>
                                    {entry.url ? (
                                        <a
                                            href={entry.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.cardLink}
                                        >
                                            {entry.title || 'Untitled'}
                                            <ExternalLink size={14} />
                                        </a>
                                    ) : (
                                        entry.title || 'Untitled'
                                    )}
                                </h3>
                                <span className={`${styles.categoryBadge} ${styles[getCategoryClassName(entry.category)]}`}>
                                    {entry.category || 'general'}
                                </span>
                            </div>

                            <p className={styles.cardDescription}>
                                {entry.description || 'No description available'}
                            </p>

                            <div className={styles.cardFooter}>
                                <div className={styles.cardMeta}>
                                    <Globe size={12} />
                                    <span>{entry.platform || 'Unknown'}</span>
                                    <span className={styles.relevanceScore}>
                                        Score: {entry.relevance || 0}
                                    </span>
                                </div>

                                <div className={styles.voteButtons}>
                                    <button
                                        onClick={() => handleVote(key, 'up')}
                                        className={`${styles.voteButton} ${styles.upvote}`}
                                        title="Helpful"
                                    >
                                        <ThumbsUp size={14} />
                                        <span>{votes[key]?.up || 0}</span>
                                    </button>
                                    <button
                                        onClick={() => handleVote(key, 'down')}
                                        className={`${styles.voteButton} ${styles.downvote}`}
                                        title="Not helpful"
                                    >
                                        <ThumbsDown size={14} />
                                        <span>{votes[key]?.down || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.noResults}>
                    <div className={styles.noResultsIcon}>🔍</div>
                    <h3>No results found</h3>
                    <p>
                        {searchQuery
                            ? `No entries match "${searchQuery}"`
                            : selectedCategory !== 'all'
                                ? `No entries in "${selectedCategory}" category`
                                : 'No entries available'
                        }
                    </p>
                </div>
            )}

            {/* Pagination */}
            {filteredEntries.length > 12 && (
                <div className={styles.pagination}>
                    <button
                        onClick={pagination.prevPage}
                        disabled={!pagination.hasPrev}
                        className={styles.paginationButton}
                    >
                        Previous
                    </button>
                    <span className={styles.paginationInfo}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={pagination.nextPage}
                        disabled={!pagination.hasNext}
                        className={styles.paginationButton}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBase;
