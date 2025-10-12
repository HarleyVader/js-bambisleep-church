import React, { lazy, Suspense, createContext, useContext } from 'react';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

// 🔮 Router Context
const RouterContext = createContext({
    currentPath: '/',
    navigate: () => { },
    basename: ''
});

// 🔮 Lazy load all pages for better performance
const Home = lazy(() => import('../pages/Home'));
const ToolsPage = lazy(() => import('../pages/ToolsPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const Mission = lazy(() => import('../pages/Mission'));
const Roadmap = lazy(() => import('../pages/Roadmap'));
const Documentation = lazy(() => import('../pages/Documentation'));
const AgentKnowledgeBase = lazy(() => import('../pages/AgentKnowledgeBase'));
const MotherBrainPage = lazy(() => import('../pages/MotherBrainPage'));
const MotherBrainControl = lazy(() => import('../pages/MotherBrainControl'));
const MotherBrainAnalytics = lazy(() => import('../pages/MotherBrainAnalytics'));

// 🎯 Route configuration
export const routes = [
    {
        path: '/',
        component: Home,
        title: '🏠 Home',
        description: 'Welcome to BambiSleep Church - Your digital sanctuary',
        icon: 'home',
        category: 'main'
    },
    {
        path: '/tools',
        component: ToolsPage,
        title: '🛠️ MCP Tools',
        description: 'Access all Model Context Protocol tools and utilities',
        icon: 'wrench',
        category: 'tools'
    },
    {
        path: '/dashboard',
        component: DashboardPage,
        title: '📊 Dashboard',
        description: 'System overview and analytics dashboard',
        icon: 'bar-chart',
        category: 'main'
    },
    {
        path: '/mission',
        component: Mission,
        title: '🎯 Mission',
        description: 'Our purpose and community guidelines',
        icon: 'target',
        category: 'info'
    },
    {
        path: '/roadmap',
        component: Roadmap,
        title: '🗺️ Roadmap',
        description: 'Development timeline and future plans',
        icon: 'map',
        category: 'info'
    },
    {
        path: '/docs',
        component: Documentation,
        title: '📚 Documentation',
        description: 'Comprehensive guides and API documentation',
        icon: 'book-open',
        category: 'info'
    },
    {
        path: '/knowledge',
        component: AgentKnowledgeBase,
        title: '🧠 Knowledge Base',
        description: 'Curated resources and community knowledge',
        icon: 'brain',
        category: 'knowledge'
    },
    {
        path: '/mother-brain',
        component: MotherBrainPage,
        title: '🕷️ MOTHER BRAIN',
        description: 'Ethical spider crawler system overview',
        icon: 'spider',
        category: 'mother-brain'
    },
    {
        path: '/mother-brain/control',
        component: MotherBrainControl,
        title: '🎮 MB Control',
        description: 'MOTHER BRAIN control panel and configuration',
        icon: 'settings',
        category: 'mother-brain'
    },
    {
        path: '/mother-brain/analytics',
        component: MotherBrainAnalytics,
        title: '📈 MB Analytics',
        description: 'MOTHER BRAIN performance metrics and insights',
        icon: 'trending-up',
        category: 'mother-brain'
    }
];

// 🎨 Route categories for better navigation
export const routeCategories = {
    main: { label: 'Main', color: '#764BA2', icon: 'home' },
    tools: { label: 'Tools', color: '#667EEA', icon: 'wrench' },
    info: { label: 'Information', color: '#F093FB', icon: 'info' },
    knowledge: { label: 'Knowledge', color: '#4FACFE', icon: 'brain' },
    'mother-brain': { label: 'MOTHER BRAIN', color: '#43E97B', icon: 'spider' }
};

// 🚀 Enhanced Page Wrapper with metadata
const PageWrapper = ({ children, route }) => {
    // Update document title and meta description
    React.useEffect(() => {
        if (route) {
            document.title = `${route.title} | BambiSleep Church`;

            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', route.description);
            }

            // Update Open Graph title
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) {
                ogTitle.setAttribute('content', `${route.title} | BambiSleep Church`);
            }

            // Update Open Graph description
            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) {
                ogDescription.setAttribute('content', route.description);
            }
        }
    }, [route]);

    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
                <div className="page-wrapper" data-route={route?.path}>
                    {children}
                </div>
            </Suspense>
        </ErrorBoundary>
    );
};

// 🎯 Simple Router Component (no external dependencies)
export const AppRouter = () => {
    const [currentPath, setCurrentPath] = React.useState(window.location.pathname);

    // Listen for navigation changes
    React.useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // Find current route
    const currentRoute = routes.find(route => route.path === currentPath) || routes[0];
    const CurrentComponent = currentRoute.component;

    // Router context value
    const routerValue = {
        currentPath,
        navigate,
        basename: ''
    };

    return (
        <RouterContext.Provider value={routerValue}>
            <PageWrapper route={currentRoute}>
                <CurrentComponent />
            </PageWrapper>
        </RouterContext.Provider>
    );
};

// 🔗 Navigation helper
export const navigate = (path) => {
    if (path !== window.location.pathname) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
};

// 🎯 Router hook
export const useRouter = () => {
    return useContext(RouterContext);
};

// 📋 Get routes by category
export const getRoutesByCategory = (category) => {
    return routes.filter(route => route.category === category);
};

// 🎯 Get route by path
export const getRouteByPath = (path) => {
    return routes.find(route => route.path === path);
};

export default AppRouter;
