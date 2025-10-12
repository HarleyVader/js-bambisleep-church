#!/usr/bin/env node
/**
 * Quick Deployment Helper
 * For production server deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 BambiSleep Church Quick Deploy');
console.log('==================================');
console.log();

try {
    // Step 1: Pull latest changes
    console.log('📥 Pulling latest changes...');
    execSync('git pull', { stdio: 'inherit' });
    console.log('✅ Git pull complete');
    console.log();

    // Step 2: Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
    console.log();

    // Step 3: Build frontend
    console.log('🏗️ Building React frontend...');
    execSync('npm run build:frontend', { stdio: 'inherit' });
    console.log('✅ Frontend build complete');
    console.log();

    // Step 4: Verify build
    const distPath = path.join(__dirname, '..', 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        console.log('✅ React build verified - index.html exists');
    } else {
        console.log('❌ React build failed - index.html missing');
        process.exit(1);
    }

    // Step 5: Set production environment
    console.log('🔧 Setting production environment...');
    console.log('Run: export NODE_ENV=production (Linux) or $env:NODE_ENV="production" (PowerShell)');
    console.log();

    // Step 6: Ready to start
    console.log('🎉 Deployment complete!');
    console.log('Start server with: node src/server.js');
    console.log('Or use PM2: pm2 start src/server.js --name bambisleep-church');
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}