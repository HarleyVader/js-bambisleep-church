import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { healthService, mcpService, knowledgeService } from '@services/api';

// Action Types
const ACTION_TYPES = {
    SET_LOADING: 'SET_LOADING',
    SET_SYSTEM_STATS: 'SET_SYSTEM_STATS',
    SET_THEME: 'SET_THEME',
    SET_USER_PREFERENCES: 'SET_USER_PREFERENCES',
    SET_ERROR: 'SET_ERROR',
    TOGGLE_MOBILE_MENU: 'TOGGLE_MOBILE_MENU',
    SET_SEARCH_HISTORY: 'SET_SEARCH_HISTORY',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION'
};

// Initial State
const initialState = {
    systemStats: {
        mcpTools: 0,
        knowledgeEntries: 0,
        systemHealth: 'Unknown',
        isLoading: true
    },
    theme: 'cyberpunk', // cyberpunk, dark, light
    userPreferences: {
        animations: true,
        notifications: true,
        autoRefresh: true,
        compactMode: false
    },
    ui: {
        isMobileMenuOpen: false,
        isLoading: false
    },
    searchHistory: [],
    notifications: [],
    error: null
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ACTION_TYPES.SET_LOADING:
            return {
                ...state,
                ui: { ...state.ui, isLoading: action.payload }
            };

        case ACTION_TYPES.SET_SYSTEM_STATS:
            return {
                ...state,
                systemStats: { ...state.systemStats, ...action.payload }
            };

        case ACTION_TYPES.SET_THEME:
            return {
                ...state,
                theme: action.payload
            };

        case ACTION_TYPES.SET_USER_PREFERENCES:
            return {
                ...state,
                userPreferences: { ...state.userPreferences, ...action.payload }
            };

        case ACTION_TYPES.SET_ERROR:
            return {
                ...state,
                error: action.payload
            };

        case ACTION_TYPES.TOGGLE_MOBILE_MENU:
            return {
                ...state,
                ui: { ...state.ui, isMobileMenuOpen: !state.ui.isMobileMenuOpen }
            };

        case ACTION_TYPES.SET_SEARCH_HISTORY:
            return {
                ...state,
                searchHistory: action.payload
            };

        case ACTION_TYPES.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, action.payload]
            };

        case ACTION_TYPES.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload)
            };

        default:
            return state;
    }
}

// Context
const AppContext = createContext();

// Provider Component
export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Load system stats on mount
    useEffect(() => {
        const loadSystemStats = async () => {
            try {
                dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

                const [healthData, toolsData, knowledgeData] = await Promise.allSettled([
                    healthService.getHealth(),
                    mcpService.listTools(),
                    knowledgeService.getAll()
                ]);

                const stats = {
                    mcpTools: toolsData.status === 'fulfilled'
                        ? toolsData.value?.result?.tools?.length || 0
                        : 0,
                    knowledgeEntries: knowledgeData.status === 'fulfilled'
                        ? Object.keys(knowledgeData.value || {}).length
                        : 0,
                    systemHealth: healthData.status === 'fulfilled'
                        ? 'Operational'
                        : 'Degraded',
                    isLoading: false
                };

                dispatch({ type: ACTION_TYPES.SET_SYSTEM_STATS, payload: stats });
            } catch (error) {
                console.error('Failed to load system stats:', error);
                dispatch({
                    type: ACTION_TYPES.SET_SYSTEM_STATS,
                    payload: { isLoading: false, systemHealth: 'Error' }
                });
            }
        };

        loadSystemStats();
    }, []);

    // Load user preferences from localStorage
    useEffect(() => {
        const savedPreferences = localStorage.getItem('bambisleep-preferences');
        if (savedPreferences) {
            try {
                const preferences = JSON.parse(savedPreferences);
                dispatch({ type: ACTION_TYPES.SET_USER_PREFERENCES, payload: preferences });
            } catch (error) {
                console.warn('Failed to load user preferences:', error);
            }
        }

        const savedTheme = localStorage.getItem('bambisleep-theme');
        if (savedTheme) {
            dispatch({ type: ACTION_TYPES.SET_THEME, payload: savedTheme });
        }
    }, []);

    // Save preferences to localStorage when they change
    useEffect(() => {
        localStorage.setItem('bambisleep-preferences', JSON.stringify(state.userPreferences));
    }, [state.userPreferences]);

    useEffect(() => {
        localStorage.setItem('bambisleep-theme', state.theme);
    }, [state.theme]);

    // Actions
    const actions = {
        setLoading: (loading) => dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading }),

        refreshSystemStats: async () => {
            const [healthData, toolsData, knowledgeData] = await Promise.allSettled([
                healthService.getHealth(),
                mcpService.listTools(),
                knowledgeService.getAll()
            ]);

            const stats = {
                mcpTools: toolsData.status === 'fulfilled'
                    ? toolsData.value?.result?.tools?.length || 0
                    : 0,
                knowledgeEntries: knowledgeData.status === 'fulfilled'
                    ? Object.keys(knowledgeData.value || {}).length
                    : 0,
                systemHealth: healthData.status === 'fulfilled'
                    ? 'Operational'
                    : 'Degraded',
                isLoading: false
            };

            dispatch({ type: ACTION_TYPES.SET_SYSTEM_STATS, payload: stats });
        },

        setTheme: (theme) => dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme }),

        updatePreferences: (preferences) =>
            dispatch({ type: ACTION_TYPES.SET_USER_PREFERENCES, payload: preferences }),

        setError: (error) => dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error }),

        toggleMobileMenu: () => dispatch({ type: ACTION_TYPES.TOGGLE_MOBILE_MENU }),

        addToSearchHistory: (query) => {
            const newHistory = [query, ...state.searchHistory.filter(h => h !== query)].slice(0, 10);
            dispatch({ type: ACTION_TYPES.SET_SEARCH_HISTORY, payload: newHistory });
        },

        addNotification: (notification) => {
            const id = Date.now();
            dispatch({
                type: ACTION_TYPES.ADD_NOTIFICATION,
                payload: { id, ...notification }
            });

            // Auto-remove after 5 seconds unless persistent
            if (!notification.persistent) {
                setTimeout(() => {
                    dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id });
                }, 5000);
            }
        },

        removeNotification: (id) =>
            dispatch({ type: ACTION_TYPES.REMOVE_NOTIFICATION, payload: id })
    };

    return (
        <AppContext.Provider value={{ state, actions }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom Hook
export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export default AppContext;
