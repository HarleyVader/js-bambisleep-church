#!/usr/bin/env node
// Simple Test Runner - BambiSleep Church
// Executes the comprehensive merged test suite

console.log('🧪 BambiSleep Church Test Runner');
console.log('=================================\n');

const { spawn } = require('child_process');
const path = require('path');

const testSuitePath = path.join(__dirname, 'simple-merged-test.js');

console.log('🚀 Launching Simple Merged Test Suite...\n');

const testProcess = spawn('node', [testSuitePath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
});

testProcess.on('close', (code) => {
    console.log(`\n🏁 Test suite completed with exit code: ${code}`);
    process.exit(code);
});

testProcess.on('error', (error) => {
    console.error(`\n❌ Failed to start test suite: ${error.message}`);
    process.exit(1);
});
