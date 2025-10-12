#!/usr/bin/env node

/**
 * 🚀 BambiSleep Church Unified Script System
 * Consolidated build, install, config generation, and startup functionality
 */

import { spawn, execSync } from 'child_process';
import { join } from 'path';
import { platform } from 'os';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const isWindows = platform() === 'win32';

// =============================================================================
// UTILITIES
// =============================================================================

class Logger {
    static info(msg) { console.log(`ℹ️  ${msg}`); }
    static success(msg) { console.log(`✅ ${msg}`); }
    static warn(msg) { console.log(`⚠️  ${msg}`); }
    static error(msg) { console.error(`❌ ${msg}`); }
    static title(msg) { console.log(`🚀 ${msg}`); }
}

// =============================================================================
// CONFIGURATION MANAGEMENT
// =============================================================================

class ConfigManager {
    static async generateAll() {
        try {
            Logger.info('Generating MCP configuration files...');

            // Load config
            const { config } = await import('../src/utils/config.js');

            // Generate MCP Inspector config
            const productionUrl = process.env.PRODUCTION_MCP_URL || `https://at.bambisleep.church:${config.server.port}${config.server.mcpEndpoint}`;
            
            const inspectorConfig = {
                mcpServers: {
                    "bambisleep-church": {
                        type: "streamable-http",
                        url: productionUrl,
                        name: "BambiSleep Church MCP Server",
                        description: "Digital sanctuary and knowledge base for the BambiSleep community"
                    },
                    "bambisleep-church-dev": {
                        type: "streamable-http",
                        url: config.getMcpUrl(),
                        name: "BambiSleep Church Development",
                        description: "Development instance with debug logging enabled"
                    }
                }
            };

            writeFileSync('mcp-inspector.json', JSON.stringify(inspectorConfig, null, 4));
            Logger.success('Generated mcp-inspector.json');

            // Create configs directory
            const configsDir = 'configs';
            if (!existsSync(configsDir)) {
                mkdirSync(configsDir, { recursive: true });
            }

            // Generate VS Code config
            const vscodeConfig = {
                name: "bambisleep-church",
                type: "http",
                url: config.getMcpUrl()
            };
            writeFileSync(path.join(configsDir, 'vscode-mcp.json'), JSON.stringify(vscodeConfig, null, 2));
            Logger.success('Generated configs/vscode-mcp.json');

            // Generate Claude config
            const claudeConfig = {
                bambisleep_church: {
                    type: "http",
                    url: config.getMcpUrl(),
                    name: "BambiSleep Church",
                    description: "Digital sanctuary and knowledge base for the BambiSleep community"
                }
            };
            writeFileSync(path.join(configsDir, 'claude-mcp.json'), JSON.stringify(claudeConfig, null, 2));
            Logger.success('Generated configs/claude-mcp.json');

            console.log('\n📋 Configuration URLs:');
            console.log(`   Main Server: ${config.getBaseUrl()}`);
            console.log(`   MCP Endpoint: ${config.getMcpUrl()}`);
            console.log(`   MCP Status: ${config.getUrl('/api/mcp/status')}`);

            console.log('\n🔌 VS Code Command:');
            console.log(`   code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}"`);

        } catch (error) {
            Logger.error(`Error generating configuration files: ${error.message}`);
            process.exit(1);
        }
    }
}

// =============================================================================
// INSTALLATION MANAGEMENT
// =============================================================================

class InstallManager {
    static async installAll() {
        try {
            Logger.title('Universal Install Script');

            const frontendDir = path.join(__dirname, '../frontend');

            // Install backend dependencies
            Logger.info('Installing backend dependencies...');
            execSync('npm install --production=false', {
                stdio: 'inherit',
                cwd: path.join(__dirname, '..')
            });

            // Install frontend dependencies if frontend exists
            if (existsSync(frontendDir)) {
                Logger.info('Installing frontend dependencies...');
                execSync('npm install', { stdio: 'inherit', cwd: frontendDir });
            }

            Logger.success('Installation complete!');
        } catch (error) {
            Logger.error(`Installation failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// =============================================================================
// BUILD MANAGEMENT
// =============================================================================

class BuildManager {
    static async buildAll() {
        try {
            Logger.title('Universal Build Script');

            const frontendDir = path.join(__dirname, '../frontend');
            const distDir = path.join(__dirname, '../dist');

            // Clean dist directory
            if (existsSync(distDir)) {
                Logger.info('Cleaning dist directory...');
                rmSync(distDir, { recursive: true, force: true });
            }
            mkdirSync(distDir, { recursive: true });

            // Build frontend if it exists
            if (existsSync(frontendDir)) {
                Logger.info('Building frontend...');

                // Ensure frontend dependencies are installed
                execSync('npm install', { stdio: 'inherit', cwd: frontendDir });

                // Build frontend
                execSync('npm run build', { stdio: 'inherit', cwd: frontendDir });

                Logger.success('Frontend built successfully!');
            } else {
                Logger.warn('No frontend directory found, skipping frontend build');
            }

            Logger.success('Build complete!');
        } catch (error) {
            Logger.error(`Build failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// =============================================================================
// GIT MANAGEMENT
// =============================================================================

class GitManager {
    static detectPull() {
        try {
            // Get current commit hash
            const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();

            Logger.info('Checking for repository updates...');

            // Fetch latest changes
            execSync('git fetch', { stdio: 'pipe' });

            // Get remote commit hash
            const remoteCommit = execSync('git rev-parse @{u}', { encoding: 'utf8' }).trim();

            if (currentCommit !== remoteCommit) {
                Logger.info('Repository updates detected! Pulling changes...');

                // Pull changes
                execSync('git pull', { stdio: 'inherit' });

                Logger.info('Running npm install after pull...');
                execSync('npm install', { stdio: 'inherit' });

                // Change to frontend and install
                process.chdir('frontend');
                execSync('npm install', { stdio: 'inherit' });
                process.chdir('..');

                Logger.success('Repository updated successfully! Process will restart...');
                process.exit(0); // Exit successfully to allow process manager to restart
            } else {
                Logger.success('Repository is up to date');
            }

        } catch (error) {
            Logger.warn(`Git pull detection failed: ${error.message}`);
            Logger.info('Continuing with normal startup...');
        }
    }
}

// =============================================================================
// SERVER MANAGEMENT
// =============================================================================

class ServerManager {
    static async start() {
        Logger.title(`Starting BambiSleep Church in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);

        // Check for git updates first
        GitManager.detectPull();

        // Setup phase
        Logger.info('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });

        // Change to frontend directory and install
        process.chdir('frontend');
        execSync('npm install', { stdio: 'inherit' });
        process.chdir('..');

        Logger.info('Running setup scripts...');
        await InstallManager.installAll();
        await ConfigManager.generateAll();

        if (isProduction) {
            // Production build
            Logger.info('Building frontend for production...');
            process.chdir('frontend');
            execSync('npm run build', { stdio: 'inherit' });
            process.chdir('..');

            Logger.success('React app built to dist/ directory');

            Logger.info('Starting production server...');
            process.env.NODE_ENV = 'production';
            execSync('node src/server.js', { stdio: 'inherit' });
        } else {
            // Development mode - build frontend and serve everything on port 7070
            Logger.info('Starting development server on port 7070...');
            Logger.info(`Backend (src/): node --watch src/server.js`);
            Logger.info(`Frontend: Building React app for development...`);

            // Verify both directories exist
            if (!existsSync('src/server.js')) {
                Logger.error('Backend server not found at src/server.js');
                process.exit(1);
            }
            if (!existsSync('frontend/package.json')) {
                Logger.error('Frontend not found at frontend/package.json');
                process.exit(1);
            }

            // Build frontend for development
            Logger.info('Building React frontend...');
            process.chdir('frontend');
            execSync('npm run build', { stdio: 'inherit' });
            process.chdir('..');

            Logger.success('React app built to dist/ directory');

            // Start git monitoring in development mode
            const gitMonitor = setInterval(() => {
                GitManager.detectPull();
            }, 30000); // Check every 30 seconds

            // Cleanup function
            const cleanup = () => {
                clearInterval(gitMonitor);
                process.exit(0);
            };

            process.on('SIGINT', cleanup);
            process.on('SIGTERM', cleanup);

            Logger.info('Launching unified server with built React app on port 7070...');

            // Set NODE_ENV to production so server serves the built React app
            process.env.NODE_ENV = 'production';
            const backendCmd = 'node --watch src/server.js';
            Logger.info(`Command: ${backendCmd} (with built React app)`);

            const server = spawn('node', ['--watch', 'src/server.js'], {
                stdio: 'inherit',
                shell: false,
                env: { ...process.env, NODE_ENV: 'production' }
            });

            server.on('error', (error) => {
                Logger.error(`Failed to start server: ${error.message}`);
                cleanup();
            });

            server.on('exit', (code) => {
                Logger.info(`Server exited with code: ${code}`);
                cleanup();
            });
        }
    }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

async function main() {
    const command = process.argv[2];

    switch (command) {
        case 'install':
            await InstallManager.installAll();
            break;
        case 'build':
            await BuildManager.buildAll();
            break;
        case 'config':
            await ConfigManager.generateAll();
            break;
        case 'start':
        case undefined:
            await ServerManager.start();
            break;
        default:
            console.log(`
🚀 BambiSleep Church Unified Script System

Usage: node scripts/main.js [command]

Commands:
  install    Install all dependencies (backend + frontend)
  build      Build the application (clean + frontend build)
  config     Generate MCP configuration files
  start      Start the server (default if no command specified)

Examples:
  node scripts/main.js           # Start server (same as npm start)
  node scripts/main.js install   # Install dependencies only
  node scripts/main.js build     # Build frontend only
  node scripts/main.js config    # Generate configs only
`);
            break;
    }
}

// Run main when script is executed directly
const scriptPath = new URL(import.meta.url).pathname;
const currentFile = process.argv[1].replace(/\\/g, '/');

if (scriptPath.endsWith(currentFile.split('/').pop())) {
    main().catch(console.error);
}

export { InstallManager, BuildManager, ConfigManager, GitManager, ServerManager };
