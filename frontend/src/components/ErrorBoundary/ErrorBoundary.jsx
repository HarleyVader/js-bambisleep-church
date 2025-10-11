import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorCard}>
                        <XCircle className={styles.errorIcon} size={48} />
                        <h2 className={styles.errorTitle}>Something went wrong</h2>
                        <p className={styles.errorMessage}>
                            {this.props.fallbackMessage || 'An unexpected error occurred. Please refresh the page and try again.'}
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className={styles.errorDetails}>
                                <summary>Error Details (Development Only)</summary>
                                <pre className={styles.errorStack}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                        <button
                            className={styles.retryButton}
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional error display component
export const ErrorMessage = ({ error, onRetry, className = '' }) => {
    if (!error) return null;

    return (
        <div className={`${styles.errorMessage} ${className}`}>
            <AlertCircle className={styles.messageIcon} size={20} />
            <span>{error}</span>
            {onRetry && (
                <button className={styles.retryButton} onClick={onRetry}>
                    Retry
                </button>
            )}
        </div>
    );
};

// Success message component
export const SuccessMessage = ({ message, onDismiss, className = '' }) => {
    if (!message) return null;

    return (
        <div className={`${styles.successMessage} ${className}`}>
            <CheckCircle className={styles.messageIcon} size={20} />
            <span>{message}</span>
            {onDismiss && (
                <button className={styles.dismissButton} onClick={onDismiss}>
                    ×
                </button>
            )}
        </div>
    );
};

// Info message component
export const InfoMessage = ({ message, onDismiss, className = '' }) => {
    if (!message) return null;

    return (
        <div className={`${styles.infoMessage} ${className}`}>
            <Info className={styles.messageIcon} size={20} />
            <span>{message}</span>
            {onDismiss && (
                <button className={styles.dismissButton} onClick={onDismiss}>
                    ×
                </button>
            )}
        </div>
    );
};

export default ErrorBoundary;
