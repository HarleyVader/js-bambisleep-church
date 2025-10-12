// 🚀 Performance Optimization - BambiSleep Church Enhanced Build
// Advanced build optimizations and performance monitoring

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export const performanceConfig = {
    // 📊 Bundle Analysis
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // 🔮 Core Framework
                    'vendor-react': ['react', 'react-dom'],

                    // 🎨 UI Components
                    'vendor-ui': ['lucide-react'],

                    // 🛠️ MCP Tools
                    'mcp-tools': [
                        './src/pages/ToolsPage',
                        './src/pages/MotherBrainPage',
                        './src/pages/MotherBrainControl',
                        './src/pages/MotherBrainAnalytics'
                    ],

                    // 📚 Knowledge System
                    'knowledge': [
                        './src/pages/AgentKnowledgeBase',
                        './src/pages/Documentation'
                    ],

                    // 🎯 Core Pages
                    'core-pages': [
                        './src/pages/Home',
                        './src/pages/Mission',
                        './src/pages/Roadmap'
                    ]
                }
            }
        },

        // 📈 Performance Targets
        target: 'esnext',
        minify: 'esbuild',

        // 🎯 Chunk Size Limits
        chunkSizeWarningLimit: 1000,

        // 🔄 Asset Processing
        assetsInlineLimit: 4096,

        // 🏗️ Source Maps for Production Debugging
        sourcemap: true
    },

    // ⚡ Development Optimizations
    server: {
        // 🔥 Hot Module Replacement
        hmr: {
            overlay: false
        },

        // 📡 CORS Configuration
        cors: true,

        // 🚀 Performance Headers
        headers: {
            'Cache-Control': 'no-cache'
        }
    },

    // 🎨 CSS Optimization
    css: {
        modules: {
            localsConvention: 'camelCaseOnly',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
        },

        preprocessorOptions: {
            css: {
                // 🎯 PostCSS Optimizations
                autoprefixer: {},
                cssnano: {
                    preset: 'default'
                }
            }
        }
    },

    // 📦 Dependency Optimization
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'lucide-react'
        ],

        exclude: [
            // 🚫 Large dependencies to load dynamically
        ]
    }
};

// 🎯 Performance Monitoring Utilities
export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.init();
    }

    init() {
        if (typeof window !== 'undefined') {
            this.setupPerformanceObserver();
            this.setupNavigationTiming();
            this.setupResourceTiming();
        }
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // 🎯 Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(entry.name, entry.value);
                }
            });

            observer.observe({ entryTypes: ['measure', 'navigation'] });
            this.observers.set('performance', observer);
        }
    }

    setupNavigationTiming() {
        if (performance.navigation) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.recordMetric('page-load-time', navigation.loadEventEnd - navigation.fetchStart);
                this.recordMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
            }
        }
    }

    setupResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        let jsSize = 0;
        let cssSize = 0;

        resources.forEach(resource => {
            if (resource.transferSize) {
                totalSize += resource.transferSize;

                if (resource.name.endsWith('.js')) {
                    jsSize += resource.transferSize;
                } else if (resource.name.endsWith('.css')) {
                    cssSize += resource.transferSize;
                }
            }
        });

        this.recordMetric('total-resource-size', totalSize);
        this.recordMetric('js-bundle-size', jsSize);
        this.recordMetric('css-bundle-size', cssSize);
    }

    recordMetric(name, value) {
        this.metrics.set(name, {
            value,
            timestamp: Date.now()
        });

        // 📊 Console logging in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`🎯 Performance Metric: ${name} = ${value}`);
        }
    }

    getMetric(name) {
        return this.metrics.get(name);
    }

    getAllMetrics() {
        return Object.fromEntries(this.metrics);
    }

    // 🎯 Performance Budget Checker
    checkPerformanceBudget() {
        const budgets = {
            'page-load-time': 3000, // 3 seconds
            'js-bundle-size': 500 * 1024, // 500KB
            'css-bundle-size': 100 * 1024, // 100KB
            'total-resource-size': 1000 * 1024 // 1MB
        };

        const violations = [];

        for (const [metric, budget] of Object.entries(budgets)) {
            const recorded = this.getMetric(metric);
            if (recorded && recorded.value > budget) {
                violations.push({
                    metric,
                    budget,
                    actual: recorded.value,
                    overage: recorded.value - budget
                });
            }
        }

        return violations;
    }
}

// 🎨 CSS Performance Utilities
export const cssOptimizations = {
    // 🔄 Critical CSS Detection
    extractCriticalCSS() {
        const criticalStyles = [];
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');

        stylesheets.forEach(sheet => {
            if (sheet.tagName === 'STYLE') {
                criticalStyles.push(sheet.textContent);
            } else if (sheet.href && sheet.href.includes('critical')) {
                criticalStyles.push(sheet);
            }
        });

        return criticalStyles;
    },

    // 📐 Unused CSS Detection
    detectUnusedCSS() {
        const allRules = [];
        const usedSelectors = new Set();

        Array.from(document.styleSheets).forEach(sheet => {
            try {
                Array.from(sheet.cssRules || sheet.rules).forEach(rule => {
                    if (rule.selectorText) {
                        allRules.push(rule.selectorText);
                        if (document.querySelector(rule.selectorText)) {
                            usedSelectors.add(rule.selectorText);
                        }
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets
            }
        });

        const unusedSelectors = allRules.filter(rule => !usedSelectors.has(rule));
        return unusedSelectors;
    }
};

// 🚀 Component Performance HOC
export const withPerformanceTracking = (Component, componentName) => {
    return function TrackedComponent(props) {
        React.useEffect(() => {
            const start = performance.now();

            return () => {
                const end = performance.now();
                console.log(`🔮 ${componentName} render time: ${end - start}ms`);
            };
        }, []);

        return React.createElement(Component, props);
    };
};

export default performanceConfig;
