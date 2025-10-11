import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <p>Digital sanctuary for the BambiSleep community</p>
                </div>

                <div className={styles.links}>
                    <Link to="/mission" className={styles.link}>Mission</Link>
                    <Link to="/knowledge" className={styles.link}>Knowledge</Link>
                    <Link to="/agents" className={styles.link}>Agents</Link>
                    <Link to="/roadmap" className={styles.link}>Roadmap</Link>
                    <a
                        href="https://github.com/HarleyVader/js-bambisleep-church"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                    >
                        GitHub
                    </a>
                </div>

                <div className={styles.copyright}>
                    <p>&copy; {currentYear} BambiSleep Church. Building a digital sanctuary.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
