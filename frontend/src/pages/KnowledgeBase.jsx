import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, ThumbsUp, ThumbsDown, TrendingUp, Globe, Filter, Grid, List } from 'lucide-react';
import styles from './KnowledgeBase.module.css';
import { knowledgeService } from '@services/api';
import { LoadingSpinner, ErrorMessage, SearchBox } from '@components';
import { useApi, usePagination, useLocalStorage } from '@hooks';
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
    const pagination = usePagination(filteredEntries.length, 12);
    const paginatedEntries = filteredEntries.slice(pagination.startIndex, pagination.endIndex);

    // Filter entries first
    const filteredEntries = entries.filter(([key, entry]) => {
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
    });

    // Group by category
    filteredEntries.forEach(([key, entry]) => {
        const category = entry.category || 'general';
        if (!categoryGroups[category]) {
            categoryGroups[category] = [];
        }
        categoryGroups[category].push([key, entry]);
    });

    // Sort entries within each category by relevance score and title
    Object.keys(categoryGroups).forEach(category => {
        categoryGroups[category].sort((a, b) => {
            const scoreA = a[1].relevanceScore || 0;
            const scoreB = b[1].relevanceScore || 0;
            if (scoreA !== scoreB) return scoreB - scoreA;
            return (a[1].title || '').localeCompare(b[1].title || '');
        });
    });

    // Sort categories by priority
    const categoryPriority = {
        'official': 1,
        'safety': 2,
        'community': 3,
        'scripts': 4,
        'general': 5
    };

    const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
        const priorityA = categoryPriority[a] || 99;
        const priorityB = categoryPriority[b] || 99;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.localeCompare(b);
    });

    return sortedCategories.map(category => ({
        name: category,
        entries: categoryGroups[category]
    }));
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
            Showing {organizedCategories.reduce((total, cat) => total + cat.entries.length, 0)} of {Object.keys(knowledge).length} entries
            {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
            {searchTerm && ` matching "${searchTerm}"`}
            {organizedCategories.length > 1 && ` across ${organizedCategories.length} categories`}
        </div>

        {/* Organized Categories */}
        {organizedCategories.length > 0 ? (
            <div className={styles.categoriesContainer}>
                {organizedCategories.map((categoryGroup) => (
                    <div key={categoryGroup.name} className={styles.categorySection}>
                        <div className={styles.categoryHeader}>
                            <h2 className={styles.categoryTitle}>
                                <span className={`${styles.categoryBadge} ${styles[getCategoryClassName(categoryGroup.name)]}`}>
                                    {categoryGroup.name.charAt(0).toUpperCase() + categoryGroup.name.slice(1)}
                                </span>
                                <span className={styles.categoryCount}>
                                    {categoryGroup.entries.length} {categoryGroup.entries.length === 1 ? 'link' : 'links'}
                                </span>
                            </h2>
                        </div>

                        <div className={styles.linksList}>
                            {categoryGroup.entries.map(([key, entry]) => {
                                const voteStats = getVoteStats(key);
                                const netVotes = voteStats.up - voteStats.down;

                                return (
                                    <article key={key} className={styles.linkItem}>
                                        <div className={styles.linkContent}>
                                            {entry.url ? (
                                                <a
                                                    href={entry.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.linkAnchor}
                                                    title={entry.description}
                                                >
                                                    <span className={styles.linkTitle}>{entry.title}</span>
                                                    <ExternalLink size={16} className={styles.linkIcon} />
                                                </a>
                                            ) : (
                                                <div className={styles.linkTitle}>
                                                    {entry.title}
                                                </div>
                                            )}

                                            {entry.platform && (
                                                <span className={styles.platformTag}>
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
                                                <ThumbsUp size={14} />
                                                <span>{voteStats.up}</span>
                                            </button>

                                            <button
                                                className={`${styles.voteButton} ${styles.downvote} ${voteStats.userVote === 'down' ? styles.active : ''}`}
                                                onClick={() => handleVote(key, 'down')}
                                                title="Downvote this resource"
                                            >
                                                <ThumbsDown size={14} />
                                                <span>{voteStats.down}</span>
                                            </button>

                                            <div className={`${styles.netScore} ${netVotes > 0 ? styles.positive : netVotes < 0 ? styles.negative : ''}`}>
                                                <TrendingUp size={12} />
                                                <span>{netVotes > 0 ? '+' : ''}{netVotes}</span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
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
