import React from 'react';
import styles from './Home.module.css';

/**
 * 🏠 Simple Home Page Component
 * Minimal homepage for BambiSleep Church
 */
const Home = () => {
    return (
        <div className={styles.container}>
            <div className={styles.hero}>
                <h1 className={styles.title}>
                    🕷️ BambiSleep Church
                </h1>
                <p className={styles.subtitle}>
                    Digital Sanctuary with Comprehensive Mother Brain System
                </p>
                <div className={styles.description}>
                    <p>
                        Welcome to the BambiSleep Church - now powered by our new
                        <strong> Comprehensive Mother Brain System</strong> for
                        autonomous content discovery and community curation.
                    </p>
                </div>
            </div>

            <div className={styles.features}>
                <div className={styles.feature}>
                    <h3>🧠 Autonomous Discovery</h3>
                    <p>AI-powered link collection from multiple platforms</p>
                </div>
                <div className={styles.feature}>
                    <h3>🗳️ Community Curation</h3>
                    <p>Real-time democratic content validation</p>
                </div>
                <div className={styles.feature}>
                    <h3>📊 Quality Analysis</h3>
                    <p>Advanced content scoring and safety assessment</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
