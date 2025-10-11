#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../frontend');
const distDir = path.join(__dirname, '../dist');

console.log('🚀 Universal Build Script');

try {
    // Clean dist directory
    if (existsSync(distDir)) {
        console.log('🧹 Cleaning dist directory...');
        rmSync(distDir, { recursive: true, force: true });
    }
    mkdirSync(distDir, { recursive: true });

    // Build frontend if it exists
    if (existsSync(frontendDir)) {
        console.log('🎨 Building frontend...');

        // Ensure frontend dependencies are installed
        execSync('npm install', { stdio: 'inherit', cwd: frontendDir });

        // Build frontend
        execSync('npm run build', { stdio: 'inherit', cwd: frontendDir });

        console.log('✅ Frontend built successfully!');
    } else {
        console.log('⚠️  No frontend directory found, skipping frontend build');
    }

    console.log('✅ Build complete!');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
