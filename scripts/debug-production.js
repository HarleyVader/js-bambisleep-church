#!/usr/bin/env node
/**
 * Production Debug Helper
 * Quick diagnostics for production deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 BambiSleep Church Production Debug');
console.log('=====================================');
console.log();

// Check environment
console.log('📊 Environment:');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PRODUCTION: ${process.env.PRODUCTION || 'undefined'}`);
console.log(`PORT: ${process.env.PORT || 'undefined'}`);
console.log();

// Check paths
console.log('📁 Path Structure:');
console.log(`Project root: ${projectRoot}`);
const distPath = path.join(projectRoot, 'dist');
const frontendDistPath = path.join(projectRoot, 'frontend', 'dist');
const indexPath = path.join(distPath, 'index.html');

console.log(`Dist path: ${distPath}`);
console.log(`  Exists: ${fs.existsSync(distPath) ? '✅ YES' : '❌ NO'}`);

console.log(`Frontend/dist path: ${frontendDistPath}`);
console.log(`  Exists: ${fs.existsSync(frontendDistPath) ? '✅ YES' : '❌ NO'}`);

console.log(`Index.html: ${indexPath}`);
console.log(`  Exists: ${fs.existsSync(indexPath) ? '✅ YES' : '❌ NO'}`);
console.log();

// List dist contents if it exists
if (fs.existsSync(distPath)) {
    console.log('📦 Dist Directory Contents:');
    try {
        const files = fs.readdirSync(distPath);
        files.forEach(file => {
            const filePath = path.join(distPath, file);
            const stats = fs.statSync(filePath);
            const type = stats.isDirectory() ? '📁' : '📄';
            const size = stats.isFile() ? ` (${Math.round(stats.size / 1024)}KB)` : '';
            console.log(`  ${type} ${file}${size}`);
        });
    } catch (error) {
        console.log(`❌ Error reading dist: ${error.message}`);
    }
    console.log();
}

// Check package.json scripts
console.log('📜 Available Build Scripts:');
try {
    const packagePath = path.join(projectRoot, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const scripts = packageData.scripts || {};
    
    Object.keys(scripts).forEach(script => {
        if (script.includes('build') || script.includes('start')) {
            console.log(`  ${script}: ${scripts[script]}`);
        }
    });
} catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
}
console.log();

// Server.js checks
console.log('🖥️ Server Configuration:');
try {
    const serverPath = path.join(projectRoot, 'src', 'server.js');
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Extract key configuration
    const isProductionMatch = serverContent.match(/isProduction\s*=\s*([^;]+);/);
    const reactBuildPathMatch = serverContent.match(/reactBuildPath\s*=\s*path\.join\([^)]+\)/);
    
    if (isProductionMatch) {
        console.log(`  Production detection: ${isProductionMatch[1]}`);
    }
    if (reactBuildPathMatch) {
        console.log(`  React build path: ${reactBuildPathMatch[0]}`);
    }
} catch (error) {
    console.log(`❌ Error reading server.js: ${error.message}`);
}
console.log();

// Recommendations
console.log('💡 Recommendations:');
if (!fs.existsSync(distPath)) {
    console.log('❌ React build missing - run: npm run build:frontend');
}
if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html missing - ensure Vite build completes successfully');
}
if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ NODE_ENV not set to production - set: export NODE_ENV=production (Linux) or $env:NODE_ENV="production" (PowerShell)');
}
console.log('✅ Ready for production testing!');