import React from 'react';
import { Sun, Moon, Zap } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import styles from './ThemeSwitcher.module.css';

const ThemeSwitcher = ({ className = "", showLabels = false }) => {
    const { state, actions } = useApp();
    const { theme } = state;
    const { setTheme } = actions;

    const themes = ['light', 'dark', 'cyberpunk'];

    const themeIcons = {
        light: Sun,
        dark: Moon,
        cyberpunk: Zap
    };

    const handleThemeChange = (themeName) => {
        setTheme(themeName);
    };

    return (
        <div className={`${styles.switcher} ${className}`} role="radiogroup" aria-label="Theme selection">
            {themes.map((themeName) => {
                const Icon = themeIcons[themeName];
                const isActive = theme === themeName;

                return (
                    <button
                        key={themeName}
                        onClick={() => handleThemeChange(themeName)}
                        className={`${styles.themeButton} ${isActive ? styles.active : ''}`}
                        aria-checked={isActive}
                        role="radio"
                        title={`Switch to ${themeName} theme`}
                    >
                        <Icon size={18} />
                        {showLabels && (
                            <span className={styles.label}>{themeName}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

export default ThemeSwitcher;
