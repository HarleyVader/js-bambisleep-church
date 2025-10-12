import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@styles': path.resolve(__dirname, './src/styles'),
            '@services': path.resolve(__dirname, './src/services'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@hooks': path.resolve(__dirname, './src/hooks')
        }
    },
    server: {
        port: 7070,
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:7070',
                changeOrigin: true
            },
            '/mcp': {
                target: 'http://localhost:7070',
                changeOrigin: true
            },
            '/socket.io': {
                target: 'http://localhost:7070',
                ws: true
            }
        }
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    icons: ['lucide-react']
                }
            }
        }
    },
    css: {
        modules: {
            generateScopedName: '[name]__[local]___[hash:base64:5]',
            localsConvention: 'camelCase'
        }
    }
});
