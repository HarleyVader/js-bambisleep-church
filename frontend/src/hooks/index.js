import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';

// Enhanced API hook with retry logic and better error handling
export const useApi = (apiCall, dependencies = [], options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { actions } = useApp();

    const {
        retryAttempts = 3,
        retryDelay = 1000,
        showNotifications = false,
        cacheKey = null
    } = options;

    const cache = useRef(new Map());
    const retryCount = useRef(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first
            if (cacheKey && cache.current.has(cacheKey)) {
                const cachedData = cache.current.get(cacheKey);
                setData(cachedData);
                setLoading(false);
                return cachedData;
            }

            const result = await apiCall();
            setData(result);

            // Cache the result
            if (cacheKey) {
                cache.current.set(cacheKey, result);
            }

            retryCount.current = 0;

            if (showNotifications) {
                actions.addNotification({
                    message: 'Data loaded successfully',
                    type: 'success'
                });
            }

            return result;
        } catch (err) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            console.error('API call failed:', err);

            // Retry logic
            if (retryCount.current < retryAttempts) {
                retryCount.current++;
                setTimeout(() => fetchData(), retryDelay * retryCount.current);
                return;
            }

            if (showNotifications) {
                actions.addNotification({
                    message: errorMessage,
                    type: 'error'
                });
            }
        } finally {
            setLoading(false);
        }
    }, [apiCall, retryAttempts, retryDelay, showNotifications, cacheKey, actions]);

    useEffect(() => {
        fetchData();
    }, dependencies);

    const refetch = useCallback(async () => {
        // Clear cache on manual refetch
        if (cacheKey) {
            cache.current.delete(cacheKey);
        }
        return await fetchData();
    }, [fetchData, cacheKey]);

    return { data, loading, error, refetch };
};

// Hook for debounced values (useful for search)
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

// Hook for local storage with JSON support
export const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    return [storedValue, setValue];
};

// Hook for async operations with loading states
export const useAsync = (asyncFunction, immediate = true) => {
    const [status, setStatus] = useState('idle');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const execute = async (...params) => {
        setStatus('pending');
        setData(null);
        setError(null);

        try {
            const result = await asyncFunction(...params);
            setData(result);
            setStatus('success');
            return result;
        } catch (error) {
            setError(error);
            setStatus('error');
            throw error;
        }
    };

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate]);

    return {
        execute,
        status,
        data,
        error,
        isLoading: status === 'pending',
        isError: status === 'error',
        isSuccess: status === 'success',
        isIdle: status === 'idle'
    };
};

// Hook for window size
export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

// Hook for intersection observer (useful for animations/lazy loading)
export const useIntersectionObserver = (ref, options = {}) => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            observer.disconnect();
        };
    }, [ref, options]);

    return isIntersecting;
};

// Hook for previous value
export const usePrevious = (value) => {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};

// Hook for click outside
export const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const listener = (event) => {
            if (!ref.current || ref.current.contains(event.target)) {
                return;
            }
            handler(event);
        };

        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);

        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};
