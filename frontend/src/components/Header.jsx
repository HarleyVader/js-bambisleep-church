import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import styles from './Header.module.css';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;

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
                </nav>
            </div>
        </header>
    );
};

export default Header;
