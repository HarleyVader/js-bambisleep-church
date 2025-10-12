import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/contexts/AppContext';
import { ErrorBoundary } from '@components';
import Header from '@components/Header';
import Footer from '@components/Footer';
import NotificationSystem from '@components/NotificationSystem/NotificationSystem';
import { LoadingSpinner } from '@components';

// Lazy load pages for better performance
const Home = lazy(() => import('@pages/Home'));
const KnowledgeBase = lazy(() => import('@pages/KnowledgeBase'));
const AgentKnowledgeBase = lazy(() => import('@pages/AgentKnowledgeBase'));
const Mission = lazy(() => import('@pages/Mission'));
const Roadmap = lazy(() => import('@pages/Roadmap'));

// Simple fallback Documentation component
const Documentation = () => (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>📚 Documentation</h1>
        <p>Documentation system is being updated. Please check back soon!</p>
    </div>
);

const App = () => {
    return (
        <AppProvider>
            <Router>
                <div className="app">
                    <div className="grid-lines"></div>
                    <ErrorBoundary>
                        <Header />

                        <main>
                            <div className="container">
                                <Suspense fallback={
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        minHeight: '400px'
                                    }}>
                                        <LoadingSpinner size="large" />
                                    </div>
                                }>
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/knowledge" element={<KnowledgeBase />} />
                                        <Route path="/agents" element={<AgentKnowledgeBase />} />
                                        <Route path="/mission" element={<Mission />} />
                                        <Route path="/roadmap" element={<Roadmap />} />
                                        <Route path="/docs" element={<Documentation />} />
                                        <Route path="/docs/:docName" element={<Documentation />} />
                                    </Routes>
                                </Suspense>
                            </div>
                        </main>

                        <Footer />
                        <NotificationSystem />
                    </ErrorBoundary>
                </div>
            </Router>
        </AppProvider>
    );
};

export default App;
