import React, { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { routes, routeCategories, navigate } from '../../router/AppRouter';
import styles from './Navigation.module.css';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const currentPath = window.location.pathname;

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
        setActiveCategory(null);
    };

    const toggleCategory = (category) => {
        setActiveCategory(activeCategory === category ? null : category);
    };

    // Group routes by category
    const routesByCategory = routes.reduce((acc, route) => {
        if (!acc[route.category]) {
            acc[route.category] = [];
        }
        acc[route.category].push(route);
        return acc;
    }, {});

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className={styles.mobileMenuButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle navigation menu"
            >
                {isOpen ? <X /> : <Menu />}
            </button>

            {/* Navigation Overlay */}
            {isOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Navigation Menu */}
            <nav className={`${styles.nav} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <h2>🔮 Navigation</h2>
                    <button
                        className={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                    >
                        <X />
                    </button>
                </div>

                <div className={styles.content}>
                    {Object.entries(routesByCategory).map(([category, categoryRoutes]) => {
                        const categoryConfig = routeCategories[category];
                        const isActive = activeCategory === category;

                        return (
                            <div key={category} className={styles.category}>
                                <button
                                    className={`${styles.categoryHeader} ${isActive ? styles.active : ''}`}
                                    onClick={() => toggleCategory(category)}
                                    style={{ '--category-color': categoryConfig.color }}
                                >
                                    <span className={styles.categoryLabel}>
                                        <span className={styles.categoryIcon}>{categoryConfig.icon}</span>
                                        {categoryConfig.label}
                                    </span>
                                    <ChevronDown className={`${styles.chevron} ${isActive ? styles.rotated : ''}`} />
                                </button>

                                <div className={`${styles.categoryItems} ${isActive ? styles.expanded : ''}`}>
                                    {categoryRoutes.map((route) => (
                                        <button
                                            key={route.path}
                                            className={`${styles.navItem} ${currentPath === route.path ? styles.current : ''}`}
                                            onClick={() => handleNavigate(route.path)}
                                        >
                                            <span className={styles.navIcon}>{route.icon}</span>
                                            <div className={styles.navText}>
                                                <div className={styles.navTitle}>{route.title}</div>
                                                <div className={styles.navDescription}>{route.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    <div className={styles.version}>
                        v2.0.0 • MCP Enabled
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navigation;
