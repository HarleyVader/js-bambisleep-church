import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bell, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useWindowSize } from '@hooks';
import ThemeSwitcher from './ThemeSwitcher/ThemeSwitcher';
import styles from './Header.module.css';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { state, actions } = useApp();
    const { isMobile } = useWindowSize();

    // Sync mobile menu state with global state
    useEffect(() => {
        setIsMobileMenuOpen(state.ui.isMobileMenuOpen);
    }, [state.ui.isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        actions.toggleMobileMenu();
    };

    const closeMobileMenu = () => {
        if (state.ui.isMobileMenuOpen) {
            actions.toggleMobileMenu();
        }
    };

    const isActive = (path) => location.pathname === path;

    const unreadNotifications = state.notifications.length;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
                    BambiSleep Church
                </Link>

                <button
                    className={styles.mobileToggle}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle mobile menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.open : ''}`}>
                    <Link
                        to="/"
                        className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Home
                    </Link>
                    <Link
                        to="/knowledge"
                        className={`${styles.navLink} ${isActive('/knowledge') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Knowledge
                    </Link>
                    <Link
                        to="/agents"
                        className={`${styles.navLink} ${isActive('/agents') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Agents
                    </Link>
                    <Link
                        to="/mission"
                        className={`${styles.navLink} ${isActive('/mission') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Mission
                    </Link>
                    <Link
                        to="/roadmap"
                        className={`${styles.navLink} ${isActive('/roadmap') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Roadmap
                    </Link>
                    <Link
                        to="/docs"
                        className={`${styles.navLink} ${location.pathname.startsWith('/docs') ? styles.active : ''}`}
                        onClick={closeMobileMenu}
                    >
                        Docs
                    </Link>
                </nav>

                {/* Desktop Controls */}
                <div className={styles.controls}>
                    <ThemeSwitcher showLabels={false} />

                    {unreadNotifications > 0 && (
                        <div className={styles.notificationIndicator} title={`${unreadNotifications} notifications`}>
                            <Bell size={18} />
                            <span className={styles.notificationCount}>{unreadNotifications}</span>
                        </div>
                    )}

                    <div className={styles.systemStatus}>
                        <div
                            className={`${styles.statusDot} ${state.systemStats.systemHealth === 'Operational' ? styles.online :
                                state.systemStats.systemHealth === 'Degraded' ? styles.warning :
                                    styles.offline
                                }`}
                            title={`System Status: ${state.systemStats.systemHealth}`}
                        />
                        <span className={styles.statusText}>
                            {state.systemStats.systemHealth}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
