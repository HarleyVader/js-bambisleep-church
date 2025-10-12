import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { ErrorBoundary } from './components';
import Header from './components/Header';
import Footer from './components/Footer';
import Navigation from './components/Navigation/Navigation';
import NotificationSystem from './components/NotificationSystem/NotificationSystem';
import AppRouter from './router/AppRouter';

const App = () => {
    return (
        <AppProvider>
            <div className="app">
                {/* 🌌 Background Grid Effect */}
                <div className="grid-lines"></div>

                {/* 🔮 Navigation System */}
                <Navigation />

                <ErrorBoundary>
                    {/* 🎯 Header */}
                    <Header />

                    {/* 🚀 Main Content with Router */}
                    <main>
                        <div className="container">
                            <AppRouter />
                        </div>
                    </main>

                    {/* 👾 Footer */}
                    <Footer />

                    {/* 📢 Notifications */}
                    <NotificationSystem />
                </ErrorBoundary>
            </div>
        </AppProvider>
    );
};

export default App;
