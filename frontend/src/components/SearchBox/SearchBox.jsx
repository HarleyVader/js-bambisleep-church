import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import { useDebounce } from '@hooks';
import { useApp } from '@/contexts/AppContext';
import styles from './SearchBox.module.css';

const SearchBox = ({
    onSearch,
    placeholder = "Search knowledge base...",
    showFilters = false,
    showHistory = true,
    categories = [],
    className = ""
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [sortBy, setSortBy] = useState('relevance');

    const debouncedQuery = useDebounce(query, 300);
    const { state, actions } = useApp();
    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Trigger search when debounced query changes
    useEffect(() => {
        if (debouncedQuery.trim()) {
            handleSearch(debouncedQuery);
        }
    }, [debouncedQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (searchQuery) => {
        if (searchQuery.trim()) {
            actions.addToSearchHistory(searchQuery.trim());
            onSearch({
                query: searchQuery.trim(),
                categories: selectedCategories,
                sortBy
            });
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setIsOpen(value.length > 0 || showHistory);
    };

    const handleHistoryClick = (historyQuery) => {
        setQuery(historyQuery);
        inputRef.current?.focus();
        handleSearch(historyQuery);
        setIsOpen(false);
    };

    const handleClearQuery = () => {
        setQuery('');
        setIsOpen(false);
        inputRef.current?.focus();
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(query);
            setIsOpen(false);
        }

        if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const filteredHistory = state.searchHistory.filter(item =>
        item.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className={`${styles.searchContainer} ${className}`} ref={searchRef}>
            <div className={styles.searchBox}>
                <div className={styles.inputWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={styles.searchInput}
                        aria-label="Search"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            onClick={handleClearQuery}
                            className={styles.clearButton}
                            aria-label="Clear search"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {showFilters && (
                    <button
                        className={`${styles.filterButton} ${selectedCategories.length > 0 ? styles.active : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Search filters"
                    >
                        <Filter size={18} />
                        {selectedCategories.length > 0 && (
                            <span className={styles.filterCount}>{selectedCategories.length}</span>
                        )}
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    {/* Search History */}
                    {showHistory && filteredHistory.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <Clock size={14} />
                                <span>Recent Searches</span>
                            </div>
                            {filteredHistory.slice(0, 5).map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleHistoryClick(item)}
                                    className={styles.historyItem}
                                >
                                    <TrendingUp size={14} />
                                    <span>{item}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Category Filters */}
                    {showFilters && categories.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <Filter size={14} />
                                <span>Categories</span>
                            </div>
                            <div className={styles.categoryGrid}>
                                {categories.map((category) => (
                                    <label key={category} className={styles.categoryItem}>
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category)}
                                            onChange={() => handleCategoryToggle(category)}
                                            className={styles.categoryCheckbox}
                                        />
                                        <span className={styles.categoryLabel}>{category}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sort Options */}
                    {showFilters && (
                        <div className={styles.section}>
                            <div className={styles.sectionHeader}>
                                <span>Sort By</span>
                            </div>
                            <div className={styles.sortOptions}>
                                {['relevance', 'date', 'popularity'].map((option) => (
                                    <label key={option} className={styles.sortItem}>
                                        <input
                                            type="radio"
                                            name="sortBy"
                                            value={option}
                                            checked={sortBy === option}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className={styles.sortRadio}
                                        />
                                        <span className={styles.sortLabel}>
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    {query.trim() && (
                        <div className={styles.section}>
                            <button
                                onClick={() => {
                                    handleSearch(query);
                                    setIsOpen(false);
                                }}
                                className={styles.quickAction}
                            >
                                <Search size={14} />
                                <span>Search for "{query}"</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBox;
