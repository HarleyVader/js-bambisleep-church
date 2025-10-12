#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import { join } from 'path';
import { platform } from 'os';
import { readFileSync, existsSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';
const isWindows = platform() === 'win32';

// Git pull detection function
function detectGitPull() {
    try {
        // Get current commit hash
        const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        const headRefPath = '.git/refs/heads/' + execSync('git branch --show-current', { encoding: 'utf8' }).trim();

        console.log('🔍 Checking for repository updates...');

        // Fetch latest changes
        execSync('git fetch', { stdio: 'pipe' });

        // Get remote commit hash
        const remoteCommit = execSync('git rev-parse @{u}', { encoding: 'utf8' }).trim();

        if (currentCommit !== remoteCommit) {
            console.log('🔄 Repository updates detected! Pulling changes...');

            // Pull changes
            execSync('git pull', { stdio: 'inherit' });

            console.log('📦 Running npm install after pull...');
            execSync('npm install', { stdio: 'inherit' });

            // Change to frontend and install
            process.chdir('frontend');
            execSync('npm install', { stdio: 'inherit' });
            process.chdir('..');

            console.log('✅ Repository updated successfully! Process will restart...');
            process.exit(0); // Exit successfully to allow process manager to restart
        } else {
            console.log('✅ Repository is up to date');
        }

    } catch (error) {
        console.log('⚠️  Git pull detection failed:', error.message);
        console.log('📝 Continuing with normal startup...');
    }
}

console.log(`🚀 Starting BambiSleep Church in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);

// Check for git updates first
detectGitPull();

// Setup phase
console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Change to frontend directory and install
process.chdir('frontend');
execSync('npm install', { stdio: 'inherit' });
process.chdir('..');

console.log('⚙️ Running setup scripts...');
execSync('node scripts/install.js', { stdio: 'inherit' });
execSync('node scripts/generate-config.js', { stdio: 'inherit' });

if (isProduction) {
    // Production build
    console.log('🏗️ Building frontend for production...');
    process.chdir('frontend');
    execSync('npm run build', { stdio: 'inherit' });
    process.chdir('..');

    console.log('📂 Copying build files...');
    const copyCmd = isWindows ? 'xcopy /E /I /Y frontend\\dist\\* dist\\' : 'cp -r frontend/dist/* dist/';
    execSync(copyCmd, { stdio: 'inherit', shell: true });

    console.log('🌐 Starting production server...');
    process.env.NODE_ENV = 'production';
    execSync('node src/server.js', { stdio: 'inherit' });
} else {
    // Development mode - everything on port 7070
    console.log('🔄 Starting development server on port 7070...');
    console.log(`📁 Backend (src/): node --watch src/server.js`);
    console.log(`🌐 Frontend: Served by backend on port 7070`);

    // Verify backend exists
    if (!existsSync('src/server.js')) {
        console.error('❌ Backend server not found at src/server.js');
        process.exit(1);
    }

    // Start git monitoring in development mode
    const gitMonitor = setInterval(() => {
        detectGitPull();
    }, 30000); // Check every 30 seconds

    // Cleanup function
    const cleanup = () => {
        clearInterval(gitMonitor);
        process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    console.log('🚀 Launching unified server on port 7070...');
    
    const backendCmd = 'node --watch src/server.js';
    console.log(`🔧 Command: ${backendCmd}`);

    const server = spawn('node', ['--watch', 'src/server.js'], {
        stdio: 'inherit',
        shell: false
    });

    server.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        cleanup();
    });

    server.on('exit', (code) => {
        console.log(`🔄 Server exited with code: ${code}`);
        cleanup();
    });
}
