#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../frontend');

console.log('🔧 Universal Install Script');

try {
    // Install backend dependencies
    console.log('📦 Installing backend dependencies...');
    execSync('npm install --production=false', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    // Install frontend dependencies if frontend exists
    if (existsSync(frontendDir)) {
        console.log('🎨 Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit', cwd: frontendDir });
    }

    console.log('✅ Installation complete!');
} catch (error) {
    console.error('❌ Installation failed:', error.message);
    process.exit(1);
}
