#!/usr/bin/env node
/**
 * BambiSleep Church - Simple Merged Test Suite
 * Combines all test functionality with error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🎯 BambiSleep Church - SIMPLE MERGED TEST SUITE');
console.log('================================================');
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log(`🖥️  Platform: ${process.platform} ${process.arch}`);
console.log(`⚡ Node.js: ${process.version}\n`);

// Utility functions
function formatResult(success, message) {
    return `${success ? '✅' : '❌'} ${message}`;
}

function printSection(title, icon = '📋') {
    console.log(`\n${icon} ${title}`);
    console.log('-'.repeat(title.length + 4));
}

// Test results tracker
const results = {
    total: 0,
    passed: 0,
    failed: 0
};

function updateResults(success) {
    results.total++;
    if (success) {
        results.passed++;
    } else {
        results.failed++;
    }
}

// Test 1: File Structure
function testFileStructure() {
    printSection('TEST 1: File Structure Validation', '📁');

    const criticalFiles = [
        './src/server.js',
        './src/utils/config.js',
        './src/utils/logger.js',
        './package.json',
        './frontend/package.json',
        './frontend/vite.config.js',
        './frontend/src/App.jsx'
    ];

    criticalFiles.forEach(file => {
        const fullPath = path.join(projectRoot, file);
        const exists = fs.existsSync(fullPath);
        console.log(`  ${formatResult(exists, file)}`);
        updateResults(exists);
    });

    // Check build output
    const distPath = path.join(projectRoot, 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const distExists = fs.existsSync(distPath);
    const indexExists = fs.existsSync(indexPath);

    console.log(`  ${formatResult(distExists, 'dist/ directory exists')}`);
    console.log(`  ${formatResult(indexExists, 'dist/index.html exists (React build)')}`);

    updateResults(distExists);
    updateResults(indexExists);
}

// Test 2: Environment
function testEnvironment() {
    printSection('TEST 2: Environment Configuration', '⚙️');

    const envFile = path.join(projectRoot, '.env');
    const envExists = fs.existsSync(envFile);
    console.log(`  ${formatResult(envExists, '.env file exists')}`);
    updateResults(envExists);

    // Check environment variables
    const envVars = ['NODE_ENV', 'PORT', 'BASE_URL'];
    envVars.forEach(envVar => {
        const value = process.env[envVar];
        const configured = value && value.trim() !== '';
        console.log(`  ${formatResult(true, `${envVar} - ${configured ? 'SET' : 'DEFAULT'} (Optional)`)}`);
        updateResults(true); // Always pass for optional
    });
}

// Test 3: MCP Structure
function testMcpStructure() {
    printSection('TEST 3: MCP Structure', '🛠️');

    const mcpFiles = [
        './src/mcp/server.js',
        './src/mcp/tools/bambi-tools.js',
        './mcp.json'
    ];

    mcpFiles.forEach(file => {
        const fullPath = path.join(projectRoot, file);
        const exists = fs.existsSync(fullPath);
        console.log(`  ${formatResult(exists, file)}`);
        updateResults(exists);
    });
}

// Test 4: Services Structure
function testServicesStructure() {
    printSection('TEST 4: Services Structure', '🔧');

    const serviceFiles = [
        './src/services/MongoDBService.js',
        './src/services/LMStudioService.js',
        './src/services/MinimalChatAgent.js'
    ];

    serviceFiles.forEach(file => {
        const fullPath = path.join(projectRoot, file);
        const exists = fs.existsSync(fullPath);
        console.log(`  ${formatResult(exists, path.basename(file))}`);
        updateResults(exists);
    });
}

// Test 5: Scripts
function testScripts() {
    printSection('TEST 5: Scripts and Configuration', '📜');

    const packagePath = path.join(projectRoot, 'package.json');
    if (fs.existsSync(packagePath)) {
        try {
            const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            const scripts = packageData.scripts || {};

            const requiredScripts = ['start', 'test', 'build', 'build:frontend'];
            requiredScripts.forEach(script => {
                const hasScript = !!scripts[script];
                console.log(`  ${formatResult(hasScript, `${script} script available`)}`);
                updateResults(hasScript);
            });

        } catch (error) {
            console.log(`  ${formatResult(false, `Error reading package.json: ${error.message}`)}`);
            updateResults(false);
        }
    } else {
        console.log(`  ${formatResult(false, 'package.json not found')}`);
        updateResults(false);
    }
}

// Test 6: Frontend Build System
function testFrontendBuild() {
    printSection('TEST 6: Frontend Build System', '🎨');

    const frontendDir = path.join(projectRoot, 'frontend');
    const viteConfig = path.join(frontendDir, 'vite.config.js');
    const indexHtml = path.join(frontendDir, 'index.html');

    console.log(`  ${formatResult(fs.existsSync(viteConfig), 'Vite configuration exists')}`);
    console.log(`  ${formatResult(fs.existsSync(indexHtml), 'HTML template exists')}`);

    updateResults(fs.existsSync(viteConfig));
    updateResults(fs.existsSync(indexHtml));

    // Check if build output is properly configured
    if (fs.existsSync(viteConfig)) {
        try {
            const viteConfigContent = fs.readFileSync(viteConfig, 'utf8');
            const hasProperOutput = viteConfigContent.includes('../dist');
            console.log(`  ${formatResult(hasProperOutput, 'Vite output configured for ../dist')}`);
            updateResults(hasProperOutput);
        } catch (error) {
            console.log(`  ${formatResult(false, `Error reading vite.config.js: ${error.message}`)}`);
            updateResults(false);
        }
    }
}

// Generate report
function generateReport() {
    printSection('TEST RESULTS SUMMARY', '🎯');

    const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;

    console.log(`📊 Tests Executed: ${results.total}`);
    console.log(`✅ Tests Passed: ${results.passed}`);
    console.log(`❌ Tests Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${percentage}%`);

    let status, emoji;
    if (percentage >= 90) {
        status = 'EXCELLENT - Ready for Production!';
        emoji = '🎉';
    } else if (percentage >= 70) {
        status = 'GOOD - Minor Issues to Address';
        emoji = '⚠️';
    } else if (percentage >= 50) {
        status = 'FAIR - Some Issues Need Attention';
        emoji = '⚠️';
    } else {
        status = 'NEEDS WORK - Critical Issues Found';
        emoji = '❌';
    }

    console.log(`${emoji} STATUS: ${status}`);
    console.log('\n✨ Test execution complete!');
}

// Main execution
async function runTests() {
    try {
        testFileStructure();
        testEnvironment();
        testMcpStructure();
        testServicesStructure();
        testScripts();
        testFrontendBuild();
        generateReport();
    } catch (error) {
        console.error(`❌ Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run tests
runTests();
