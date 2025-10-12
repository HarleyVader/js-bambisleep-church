import React from 'react';
import { Home as HomeIcon, Heart, Shield, Users } from 'lucide-react';
import { ErrorBoundary } from '../components';
import styles from './Home.module.css';

const Home = () => {
    return (
        <ErrorBoundary>
            <div className={styles.homePage}>
                <section className={styles.hero}>
                    <HomeIcon size={64} />
                    <h1>Welcome to BambiSleep Church</h1>
                    <p>Digital sanctuary for transformation and community</p>
                </section>

                <section className={styles.features}>
                    <div className={styles.feature}>
                        <Heart size={32} />
                        <h3>Safe Space</h3>
                        <p>Supportive community for personal exploration</p>
                    </div>
                    <div className={styles.feature}>
                        <Shield size={32} />
                        <h3>Safety First</h3>
                        <p>Comprehensive resources and guidelines</p>
                    </div>
                    <div className={styles.feature}>
                        <Users size={32} />
                        <h3>Community</h3>
                        <p>Connect with like-minded individuals</p>
                    </div>
                </section>
            </div>
        </ErrorBoundary>
    );
};

export default Home;
