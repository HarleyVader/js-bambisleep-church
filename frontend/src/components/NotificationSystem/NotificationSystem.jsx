import React from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import styles from './NotificationSystem.module.css';

const NotificationSystem = () => {
    const { state, actions } = useApp();

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'info':
            default:
                return <Info size={20} />;
        }
    };

    if (state.notifications.length === 0) return null;

    return (
        <div className={styles.notificationContainer} role="region" aria-label="Notifications">
            {state.notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`${styles.notification} ${styles[notification.type]}`}
                    role="alert"
                    aria-live={notification.type === 'error' ? 'assertive' : 'polite'}
                >
                    <div className={styles.iconContainer}>
                        {getIcon(notification.type)}
                    </div>

                    <div className={styles.content}>
                        {notification.title && (
                            <h4 className={styles.title}>{notification.title}</h4>
                        )}
                        <p className={styles.message}>{notification.message}</p>
                        {notification.actions && (
                            <div className={styles.actions}>
                                {notification.actions.map((action, index) => (
                                    <button
                                        key={index}
                                        className={styles.actionButton}
                                        onClick={action.onClick}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {!notification.persistent && (
                        <button
                            className={styles.closeButton}
                            onClick={() => actions.removeNotification(notification.id)}
                            aria-label="Close notification"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default NotificationSystem;
