#!/usr/bin/env node

/**
 * MCP Inspector Development Runner
 *
 * This script provides easy development workflows with MCP Inspector
 * for testing and debugging the BambiSleep Church MCP server.
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
const isWindows = os.platform() === 'win32';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function showHelp() {
    log('\n🔍 BambiSleep Church MCP Inspector Runner', 'cyan');
    log('====================================', 'cyan');
    log('\nAvailable commands:', 'bright');
    log('  npm run inspector           - Launch Inspector with HTTP transport', 'green');
    log('  npm run inspector:stdio     - Launch Inspector with STDIO transport', 'green');
    log('  npm run inspector:dev       - Development mode with auto-restart', 'green');
    log('  npm run inspector:test       - Run comprehensive MCP tests', 'green');
    log('\nMCP Inspector features:', 'bright');
    log('  • Interactive web UI for testing MCP tools', 'yellow');
    log('  • Real-time debugging and inspection', 'yellow');
    log('  • Configuration export for other MCP clients', 'yellow');
    log('  • Direct testing and validation', 'yellow');
    log('  • Authentication and security features', 'yellow');
    log('\nServer endpoints:', 'bright');
    log('  • BambiSleep Church Server: http://localhost:7070', 'magenta');
    log('  • MCP Endpoint: http://localhost:7070/mcp', 'magenta');
    log('  • Inspector UI: http://localhost:6274', 'magenta');
    log('  • Inspector Proxy: http://localhost:6277', 'magenta');
    log('\n💡 For testing and development:', 'yellow');
    log('  • Use the web interface at /inspector', 'yellow');
    log('  • Test directly with: node test-inspector.js', 'yellow');
    log('  • Export configs for VS Code, Claude Desktop', 'yellow');
}

async function checkServerRunning() {
    try {
        const response = await fetch('http://localhost:7070/health');
        return response.ok;
    } catch (error) {
        return false;
    }
}



async function checkInspectorAvailable() {
    try {
        const checkCommand = isWindows 
            ? 'where npx'
            : 'which npx';
            
        await execAsync(checkCommand);
        return true;
    } catch (error) {
        return false;
    }
}

async function startServer() {
    log('🚀 Starting BambiSleep Church server...', 'cyan');

    const serverProcess = spawn('node', ['src/server.js'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'development' }
    });

    return new Promise((resolve, reject) => {
        let output = '';

        serverProcess.stdout.on('data', (data) => {
            output += data.toString();
            process.stdout.write(data);

            // Check if server is ready
            if (output.includes('MCP endpoint available at')) {
                setTimeout(() => resolve(serverProcess), 1000);
            }
        });

        serverProcess.stderr.on('data', (data) => {
            process.stderr.write(data);
        });

        serverProcess.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => {
            if (!serverProcess.killed) {
                reject(new Error('Server startup timeout'));
            }
        }, 10000);
    });
}

async function runInspector(mode = 'http', options = {}) {
    const isServerRunning = await checkServerRunning();
    let serverProcess = null;

    if (!isServerRunning) {
        log('⚠️  Server not running, starting it first...', 'yellow');
        try {
            serverProcess = await startServer();
            log('✅ Server started successfully!', 'green');
        } catch (error) {
            log(`❌ Failed to start server: ${error.message}`, 'red');
            process.exit(1);
        }
    } else {
        log('✅ Server already running', 'green');
    }

    // Wait a moment for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    log(`🔍 Launching MCP Inspector (${mode} mode)...`, 'cyan');

    // Build the command string
    let command = '';
    const inspectorArgs = [];

    if (mode === 'http') {
        // HTTP transport mode - connect to our running server
        inspectorArgs.push('--config', 'mcp-inspector.json', '--server', 'bambisleep-church');
    } else if (mode === 'stdio') {
        // STDIO transport mode - launch server directly
        inspectorArgs.push('--config', 'mcp-inspector.json', '--server', 'bambisleep-church-stdio');
    }

    // Check if npx is available
    const npxAvailable = await checkInspectorAvailable();
    if (!npxAvailable) {
        log('❌ npx not found in PATH', 'red');
        log('💡 Try these alternatives:', 'yellow');
        log('  1. Use web interface: http://localhost:7070/inspector', 'cyan');
        log('  2. Test directly: node test-inspector.js', 'cyan');
        log('  3. Export config for VS Code or Claude Desktop', 'cyan');
        
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
        }
        return;
    }

    // Use different approach for Windows vs Unix
    let inspectorProcess;
    if (isWindows) {
        // On Windows, use PowerShell to run npx
        const fullCommand = `npx @modelcontextprotocol/inspector ${inspectorArgs.join(' ')}`;
        log(`💻 Running: ${fullCommand}`, 'cyan');
        
        inspectorProcess = spawn('powershell.exe', ['-Command', fullCommand], {
            stdio: 'inherit',
            env: { ...process.env }
        });
    } else {
        // On Unix systems, spawn npx directly
        inspectorProcess = spawn('npx', ['@modelcontextprotocol/inspector', ...inspectorArgs], {
            stdio: 'inherit',
            env: { ...process.env }
        });
    }

    // Handle cleanup
    process.on('SIGINT', () => {
        log('\n🛑 Shutting down...', 'yellow');

        if (inspectorProcess && !inspectorProcess.killed) {
            inspectorProcess.kill('SIGTERM');
        }

        if (serverProcess && !serverProcess.killed) {
            log('🛑 Stopping server...', 'yellow');
            serverProcess.kill('SIGTERM');
        }

        process.exit(0);
    });

    inspectorProcess.on('close', (code) => {
        if (code !== 0) {
            log(`❌ Inspector exited with code ${code}`, 'red');
            
            if (isWindows) {
                log('\n💡 Alternative solutions:', 'yellow');
                log('  1. Use web interface: http://localhost:7070/inspector', 'cyan');
                log('  2. Test directly: node test-inspector.js', 'cyan');
                log('  3. Export config for MCP clients', 'cyan');
            }
        } else {
            log('✅ Inspector closed successfully', 'green');
        }

        if (serverProcess && !serverProcess.killed) {
            log('🛑 Stopping server...', 'yellow');
            serverProcess.kill('SIGTERM');
        }
    });

    inspectorProcess.on('error', (err) => {
        log('❌ Failed to start MCP Inspector', 'red');
        log(`   Error: ${err.message}`, 'red');
        
        if (isWindows && err.code === 'ENOENT') {
            log('\n💡 Alternative solutions:', 'yellow');
            log('  1. Use web interface: http://localhost:7070/inspector', 'cyan');
            log('  2. Test directly: node test-inspector.js', 'cyan');
            log('  3. Export config for MCP clients', 'cyan');
        }
        
        if (serverProcess && !serverProcess.killed) {
            log('🛑 Stopping server...', 'yellow');
            serverProcess.kill('SIGTERM');
        }
    });
}

async function runTests() {
    log('🧪 Running MCP tests...', 'cyan');
    log('💡 Using direct test script for reliable testing', 'yellow');
    
    return new Promise((resolve) => {
        const testProcess = spawn('node', ['test-inspector.js'], {
            stdio: 'inherit',
            env: { ...process.env }
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                log('\n✅ All tests completed successfully!', 'green');
                resolve(true);
            } else {
                log('\n❌ Some tests failed', 'red');
                resolve(false);
            }
        });

        testProcess.on('error', (err) => {
            log(`❌ Test execution error: ${err.message}`, 'red');
            resolve(false);
        });
    });
}

// Main execution
const command = process.argv[2];

switch (command) {
    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;

    case 'http':
    case 'ui':
        runInspector('http');
        break;

    case 'stdio':
        runInspector('stdio');
        break;

    case 'test':
        runTests();
        break;

    default:
        if (!command) {
            showHelp();
        } else {
            log(`❌ Unknown command: ${command}`, 'red');
            showHelp();
            process.exit(1);
        }
}
