import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'medium', color = 'primary', text = 'Loading...' }) => {
    return (
        <div className={styles.container}>
            <div className={`${styles.spinner} ${styles[size]} ${styles[color]}`}>
                <div className={styles.bounce1}></div>
                <div className={styles.bounce2}></div>
                <div className={styles.bounce3}></div>
            </div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
