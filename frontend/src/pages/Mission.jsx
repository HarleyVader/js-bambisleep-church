import React from 'react';
import { Target, Heart, Shield, Users, BookOpen } from 'lucide-react';
import { ErrorBoundary } from '../components';
import styles from './Mission.module.css';

const Mission = () => {
    return (
        <ErrorBoundary>
            <div className={styles.missionPage}>
                <header className={styles.header}>
                    <Target size={48} />
                    <h1>Our Mission</h1>
                    <p>Creating a safe, supportive digital sanctuary</p>
                </header>

                <div className={styles.content}>
                    <div className={styles.missionCard}>
                        <Heart size={32} />
                        <h3>Safe Exploration</h3>
                        <p>Providing a judgment-free environment for personal transformation and identity exploration.</p>
                    </div>

                    <div className={styles.missionCard}>
                        <Shield size={32} />
                        <h3>Safety & Education</h3>
                        <p>Comprehensive safety resources, guidelines, and educational content for responsible practice.</p>
                    </div>

                    <div className={styles.missionCard}>
                        <Users size={32} />
                        <h3>Community Support</h3>
                        <p>Building connections between community members for mutual support and understanding.</p>
                    </div>

                    <div className={styles.missionCard}>
                        <BookOpen size={32} />
                        <h3>Knowledge Sharing</h3>
                        <p>Curating and sharing valuable resources, experiences, and insights within our community.</p>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default Mission;
