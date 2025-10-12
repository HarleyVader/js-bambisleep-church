import React from 'react';
import { navigate } from '../router/AppRouter';
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
                    <button onClick={() => navigate('/mission')} className={styles.link}>Mission</button>
                    <button onClick={() => navigate('/knowledge')} className={styles.link}>Knowledge</button>
                    <button onClick={() => navigate('/agents')} className={styles.link}>Agents</button>
                    <button onClick={() => navigate('/roadmap')} className={styles.link}>Roadmap</button>
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
