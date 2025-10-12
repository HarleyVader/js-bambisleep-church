import React, { useState, useEffect } from 'react';
import { Bell, Activity, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { navigate } from '../router/AppRouter';
import ThemeSwitcher from './ThemeSwitcher/ThemeSwitcher';
import styles from './Header.module.css';

const Header = () => {
    const { state, actions } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const unreadNotifications = state.notifications?.length || 0;
    const systemHealth = state.systemStats?.systemHealth || 'Unknown';
    const isOnline = navigator.onLine;

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* 🔮 Logo / Brand */}
                <button
                    className={styles.logo}
                    onClick={() => navigate('/')}
                    aria-label="Go to home page"
                >
                    <span className={styles.logoText}>BambiSleep</span>
                    <span className={styles.logoSubtext}>Church</span>
                </button>

                {/* 📊 System Status Bar */}
                <div className={styles.statusBar}>
                    <div className={styles.timeDisplay}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className={styles.systemMetrics}>
                        {/* Connection Status */}
                        <div className={`${styles.metric} ${isOnline ? styles.online : styles.offline}`}>
                            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>

                        {/* System Health */}
                        <div className={`${styles.metric} ${systemHealth === 'Operational' ? styles.healthy : styles.warning}`}>
                            <Activity size={16} />
                            <span>{systemHealth}</span>
                        </div>
                    </div>
                </div>

                {/* 🎛️ Controls */}
                <div className={styles.controls}>
                    <ThemeSwitcher showLabels={false} />

                    {unreadNotifications > 0 && (
                        <div
                            className={styles.notificationIndicator}
                            title={`${unreadNotifications} notifications`}
                            onClick={() => actions?.showNotifications?.()}
                        >
                            <Bell size={18} />
                            <span className={styles.notificationCount}>{unreadNotifications}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
