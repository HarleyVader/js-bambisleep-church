import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@components/Header';
import Footer from '@components/Footer';
import Home from '@pages/Home';
import KnowledgeBase from '@pages/KnowledgeBase';
import Agents from '@pages/Agents';
import Mission from '@pages/Mission';
import Roadmap from '@pages/Roadmap';
import { ErrorBoundary } from '@components';

const App = () => {
    return (
        <Router>
            <div className="app">
                <div className="grid-lines"></div>
                <ErrorBoundary>
                    <Header />

                    <main>
                        <div className="container">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/knowledge" element={<KnowledgeBase />} />
                                <Route path="/agents" element={<Agents />} />
                                <Route path="/mission" element={<Mission />} />
                                <Route path="/roadmap" element={<Roadmap />} />
                            </Routes>
                        </div>
                    </main>

                    <Footer />
                </ErrorBoundary>
            </div>
        </Router>
    );
};

export default App;
