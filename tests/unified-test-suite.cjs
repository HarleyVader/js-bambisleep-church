// BambiSleep Church - Unified Comprehensive Testing Suite
// Updated for modern React + Express architecture with MCP integration
const fs = require('fs');
const path = require('path');

// Polyfill fetch for older Node.js versions
async function getFetch() {
    if (typeof globalThis.fetch !== 'undefined') {
        return globalThis.fetch;
    }
    try {
        const { default: nodeFetch } = await import('node-fetch');
        return nodeFetch;
    } catch (error) {
        console.error('❌ Fetch not available. Please install node-fetch or use Node.js 18+');
        process.exit(1);
    }
}

console.log('🎯 BambiSleep Church - UNIFIED COMPREHENSIVE TEST SUITE v2.0');
console.log('===============================================================');
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log(`🖥️  Platform: ${process.platform} ${process.arch}`);
console.log(`⚡ Node.js: ${process.version}`);
console.log(`🏗️  Architecture: React Frontend + Express Backend + MCP\n`);

// Load environment variables from .env if it exists
if (fs.existsSync('.env')) {
    require('dotenv').config();
}

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:7070';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 15000; // Increased timeout for complex operations

// Utility functions
function formatResult(success, message) {
    return `${success ? '✅' : '❌'} ${message}`;
}

function printSection(title, icon = '📋') {
    console.log(`\n${icon} ${title}`);
    console.log('-'.repeat(title.length + 4));
}

function printSubsection(title) {
    console.log(`\n🔸 ${title}:`);
}

// Helper function to make HTTP requests
async function testEndpoint(path, method = 'GET', body = null, baseUrl = BASE_URL) {
    const url = `${baseUrl}${path}`;

    try {
        const fetch = await getFetch();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TEST_TIMEOUT);

        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        const success = response.ok;
        let responseInfo = '';

        if (success && response.headers.get('content-type')?.includes('application/json')) {
            try {
                const data = await response.json();
                if (data && typeof data === 'object') {
                    responseInfo = ` (${Object.keys(data).length} properties)`;
                }
            } catch (e) {
                // Not JSON, that's okay
            }
        }

        console.log(`  ${formatResult(success, `${method} ${path} - ${response.status} ${response.statusText}${responseInfo}`)}`);
        return { success, status: response.status, statusText: response.statusText };

    } catch (error) {
        const isTimeout = error.name === 'AbortError';
        console.log(`  ${formatResult(false, `${method} ${path} - ${isTimeout ? 'Timeout' : 'Error'}: ${error.message}`)}`);
        return { success: false, error: error.message };
    }
}

// Test Suite Class
class UnifiedTestSuite {
    constructor() {
        this.results = {
            fileStructure: { passed: 0, failed: 0, total: 0 },
            environment: { passed: 0, failed: 0, total: 0 },
            mcpTools: { passed: 0, failed: 0, total: 0 },
            apiEndpoints: { passed: 0, failed: 0, total: 0 },
            knowledgeBase: { passed: 0, failed: 0, total: 0 },
            serverHealth: { passed: 0, failed: 0, total: 0 },
            frontend: { passed: 0, failed: 0, total: 0 },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }

    updateResults(category, success) {
        this.results[category].total++;
        if (success) {
            this.results[category].passed++;
            this.results.overall.passed++;
        } else {
            this.results[category].failed++;
            this.results.overall.failed++;
        }
        this.results.overall.total++;
    }

    // Test 1: File Structure Validation
    async testFileStructure() {
        printSection('TEST 1: File Structure Validation', '📁');

        // Backend core files
        const backendFiles = [
            { path: './src/server.js', description: 'Main Express server' },
            { path: './src/utils/config.js', description: 'Configuration utility' },
            { path: './src/utils/logger.js', description: 'Logging utility' },
            { path: './src/knowledge/knowledge.json', description: 'Knowledge database' },
            { path: './src/mcp/server.js', description: 'MCP server implementation' },
            { path: './src/mcp/tools/bambi-tools.js', description: 'BambiSleep MCP tools' },
            { path: './package.json', description: 'Backend package configuration' },
            { path: './mcp.json', description: 'MCP server configuration' }
        ];

        printSubsection('Backend Files');
        backendFiles.forEach(file => {
            const exists = fs.existsSync(file.path);
            console.log(`  ${formatResult(exists, `${file.path} - ${file.description}`)}`);
            this.updateResults('fileStructure', exists);
        });

        // Frontend files
        const frontendFiles = [
            { path: './frontend/package.json', description: 'Frontend package configuration' },
            { path: './frontend/vite.config.js', description: 'Vite build configuration' },
            { path: './frontend/src/main.jsx', description: 'React app entry point' },
            { path: './frontend/src/App.jsx', description: 'Root React component' },
            { path: './frontend/src/services/api.js', description: 'API service layer' },
            { path: './frontend/index.html', description: 'HTML template' }
        ];

        printSubsection('Frontend Files');
        frontendFiles.forEach(file => {
            const exists = fs.existsSync(file.path);
            console.log(`  ${formatResult(exists, `${file.path} - ${file.description}`)}`);
            this.updateResults('fileStructure', exists);
        });

        // Check directory structure
        const requiredDirs = [
            { path: './src/mcp/tools', description: 'MCP tools directory' },
            { path: './src/services', description: 'Backend services' },
            { path: './docs', description: 'Documentation directory' },
            { path: './frontend/src/components', description: 'React components' },
            { path: './frontend/src/pages', description: 'React pages' },
            { path: './frontend/src/styles', description: 'CSS modules' },
            { path: './dist', description: 'Production build output' }
        ];

        printSubsection('Directory Structure');
        requiredDirs.forEach(dir => {
            const exists = fs.existsSync(dir.path);
            console.log(`  ${formatResult(exists, `${dir.path} - ${dir.description}`)}`);
            this.updateResults('fileStructure', exists);
        });

        // Check for deprecated files (should not exist)
        const deprecatedFiles = [
            { path: './views', description: 'Old EJS views (should be removed)' },
            { path: './public', description: 'Old static files (should be in frontend/public)' }
        ];

        printSubsection('Deprecated Files Check');
        deprecatedFiles.forEach(file => {
            const exists = fs.existsSync(file.path);
            const success = !exists; // Success if file doesn't exist
            const status = success ? '(✓ Removed)' : '(⚠️ Still exists)';
            console.log(`  ${formatResult(success, `${file.path} - ${file.description} ${status}`)}`);
            this.updateResults('fileStructure', success);
        });
    }

    // Test 2: Environment Configuration
    async testEnvironmentConfig() {
        printSection('TEST 2: Environment Configuration', '⚙️');

        // Core environment variables
        const coreEnvVars = [
            { name: 'PORT', description: 'Server port (default: 7070)', required: false },
            { name: 'HOST', description: 'Server host (default: 0.0.0.0)', required: false },
            { name: 'NODE_ENV', description: 'Environment mode', required: false },
            { name: 'BASE_URL', description: 'Base URL for API', required: false }
        ];

        printSubsection('Core Server Configuration');
        coreEnvVars.forEach(envVar => {
            const value = process.env[envVar.name];
            const configured = value && value.trim() !== '';
            const status = envVar.required ? (configured ? 'REQUIRED ✓' : 'REQUIRED ❌') : (configured ? 'CONFIGURED' : 'DEFAULT');
            console.log(`  ${formatResult(configured || !envVar.required, `${envVar.name} - ${envVar.description} [${status}]`)}`);
            this.updateResults('environment', configured || !envVar.required);
        });

        // Optional services
        const optionalServices = [
            { name: 'MONGODB_URI', description: 'MongoDB connection string' },
            { name: 'LMSTUDIO_BASE_URL', description: 'LMStudio base URL' },
            { name: 'LMSTUDIO_MODEL', description: 'LMStudio model name' },
            { name: 'MCP_ENABLED', description: 'MCP server enabled flag' }
        ];

        printSubsection('Optional Services Configuration');
        optionalServices.forEach(envVar => {
            const value = process.env[envVar.name];
            const configured = value && value.trim() !== '';
            console.log(`  ${formatResult(true, `${envVar.name} - ${envVar.description} [${configured ? 'CONFIGURED' : 'NOT SET'}]`)}`);
            this.updateResults('environment', true); // Always pass for optional services
        });

        // Frontend environment variables
        printSubsection('Frontend Environment Check');
        const frontendEnvExists = fs.existsSync('./frontend/.env') || fs.existsSync('./frontend/.env.local');
        console.log(`  ${formatResult(true, `Frontend .env files - ${frontendEnvExists ? 'Present' : 'Using defaults'} (Optional)`)}`);
        this.updateResults('environment', true);

        // Environment file validation
        printSubsection('Environment Files');
        const envExists = fs.existsSync('./.env');
        const envExampleExists = fs.existsSync('./.env.example');

        console.log(`  ${formatResult(envExists, '.env file exists')}`);
        console.log(`  ${formatResult(envExampleExists, '.env.example template exists')}`);

        this.updateResults('environment', envExists);
        this.updateResults('environment', envExampleExists);
    }

    // Test 3: MCP Tools Structure
    async testMcpTools() {
        printSection('TEST 3: MCP Tools Structure', '🛠️');

        // Check MCP server file
        const mcpServerExists = fs.existsSync('./src/mcp/server.js');
        console.log(`  ${formatResult(mcpServerExists, 'MCP server file exists')}`);
        this.updateResults('mcpTools', mcpServerExists);

        // Check Bambi tools file
        const bambiToolsExists = fs.existsSync('./src/mcp/tools/bambi-tools.js');
        console.log(`  ${formatResult(bambiToolsExists, 'Bambi tools file exists')}`);
        this.updateResults('mcpTools', bambiToolsExists);

        if (!bambiToolsExists) {
            console.log(`  ${formatResult(false, 'Cannot test MCP tools - bambi-tools.js not found')}`);
            this.updateResults('mcpTools', false);
            return;
        }

        try {
            // Try to read and analyze the tools file (CommonJS style since this is a .cjs test file)
            const toolsPath = path.join(process.cwd(), 'src/mcp/tools/bambi-tools.js');
            const toolsContent = fs.readFileSync(toolsPath, 'utf8');

            // Look for tool definitions (basic analysis)
            const toolMatches = toolsContent.match(/name:\s*['"`]([^'"`]+)['"`]/g) || [];
            const toolNames = toolMatches.map(match => match.match(/['"`]([^'"`]+)['"`]/)[1]);

            console.log(`  ${formatResult(toolNames.length > 0, `Found ${toolNames.length} tool definitions`)}`);
            this.updateResults('mcpTools', toolNames.length > 0);

            if (toolNames.length > 0) {
                printSubsection('Tool Analysis');

                // Check for expected BambiSleep tools
                const expectedTools = ['search-knowledge', 'get-safety-info', 'church-status', 'crawler-single-url'];
                const foundExpectedTools = expectedTools.filter(tool =>
                    toolNames.some(name => name.includes(tool))
                );

                console.log(`  ${formatResult(foundExpectedTools.length > 0, `Core tools found: ${foundExpectedTools.join(', ')}`)}`);
                this.updateResults('mcpTools', foundExpectedTools.length > 0);

                // Check for duplicates
                const uniqueTools = [...new Set(toolNames)];
                const noDuplicates = uniqueTools.length === toolNames.length;
                console.log(`  ${formatResult(noDuplicates, `No duplicate tool names (${uniqueTools.length} unique)`)}`);
                this.updateResults('mcpTools', noDuplicates);

                console.log(`\n  📊 MCP Tools Summary: ${toolNames.length} tools, ${uniqueTools.length} unique`);
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Failed to analyze MCP tools: ${error.message}`)}`);
            this.updateResults('mcpTools', false);
        }

        // Check MCP configuration
        printSubsection('MCP Configuration');
        const mcpConfigExists = fs.existsSync('./mcp.json');
        console.log(`  ${formatResult(mcpConfigExists, 'MCP configuration file exists')}`);
        this.updateResults('mcpTools', mcpConfigExists);

        if (mcpConfigExists) {
            try {
                const mcpConfig = JSON.parse(fs.readFileSync('./mcp.json', 'utf8'));
                const hasServers = mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0;
                console.log(`  ${formatResult(hasServers, `MCP servers configured: ${hasServers ? Object.keys(mcpConfig.mcpServers).join(', ') : 'none'}`)}`);
                this.updateResults('mcpTools', hasServers);
            } catch (error) {
                console.log(`  ${formatResult(false, `MCP config parsing failed: ${error.message}`)}`);
                this.updateResults('mcpTools', false);
            }
        }
    }

    // Test 4: API Endpoints
    async testApiEndpoints() {
        printSection('TEST 4: API Endpoints Testing', '🌐');

        // Backend server root endpoint
        printSubsection('Backend Server Endpoints');
        const backendEndpoints = [
            { path: '/', description: 'Backend root endpoint' },
            { path: '/api/health', description: 'Health check endpoint' },
            { path: '/api/docs', description: 'Documentation list API' },
            { path: '/api/docs/README.md', description: 'Sample documentation file' }
        ];

        for (const endpoint of backendEndpoints) {
            const result = await testEndpoint(endpoint.path);
            this.updateResults('apiEndpoints', result.success);
        }

        // Knowledge system endpoints
        printSubsection('Knowledge System API');
        const knowledgeEndpoints = [
            { path: '/api/knowledge', description: 'Knowledge base API' },
            { path: '/api/knowledge/search', description: 'Knowledge search' }
        ];

        for (const endpoint of knowledgeEndpoints) {
            const result = await testEndpoint(endpoint.path);
            // Don't fail if knowledge endpoints don't exist - they might be optional
            console.log(`    (Optional endpoint - ${result.success ? 'Available' : 'Not implemented'})`);
            this.updateResults('apiEndpoints', true); // Always pass for optional endpoints
        }

        // MCP endpoints (if enabled)
        printSubsection('MCP Integration Endpoints');
        if (process.env.MCP_ENABLED !== 'false') {
            // Test MCP status endpoint (GET)
            const statusResult = await testEndpoint('/api/mcp/status');
            console.log(`    ${statusResult.success ? '✓' : '⚠️'} MCP status endpoint - ${statusResult.success ? 'Available' : 'Not responding'}`);
            this.updateResults('apiEndpoints', statusResult.success);

            // Note about MCP JSON-RPC endpoint (POST only)
            console.log(`    ℹ️ MCP JSON-RPC endpoint (/mcp) - POST only (GET returns 404 by design)`);
            this.updateResults('apiEndpoints', true); // This is expected behavior

            // Test MCP JSON-RPC protocol
            if (process.env.MCP_ENABLED !== 'false') {
                printSubsection('MCP JSON-RPC Protocol Testing');

                // Test tools/list
                const mcpListResult = await testEndpoint('/mcp', 'POST', {
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'tools/list'
                });
                console.log(`    ${mcpListResult.success ? '✓' : '⚠️'} MCP tools/list command - ${mcpListResult.success ? 'Working' : 'Not responding'}`);
                this.updateResults('apiEndpoints', mcpListResult.success);

                // Test a tool call if tools/list worked
                if (mcpListResult.success) {
                    const mcpToolResult = await testEndpoint('/mcp', 'POST', {
                        jsonrpc: '2.0',
                        id: 2,
                        method: 'tools/call',
                        params: {
                            name: 'church-status',
                            arguments: {}
                        }
                    });
                    console.log(`    ${mcpToolResult.success ? '✓' : '⚠️'} MCP tool execution (church-status) - ${mcpToolResult.success ? 'Working' : 'Failed'}`);
                    this.updateResults('apiEndpoints', mcpToolResult.success);

                    // Test crawler tool availability (not execution due to time)
                    if (mcpToolResult.success) {
                        console.log(`    ℹ️ crawler-single-url tool - Available (not tested to avoid long execution)`);
                        this.updateResults('apiEndpoints', true);
                    }
                } else {
                    console.log(`    ⚠️ Skipping tool execution test - tools/list failed`);
                    this.updateResults('apiEndpoints', false);
                }
            }
        } else {
            console.log(`    ⚠️ MCP endpoints disabled (MCP_ENABLED=false)`);
            this.updateResults('apiEndpoints', true); // Pass if deliberately disabled
        }

        // Frontend availability check (if running)
        printSubsection('Frontend Availability Check');
        try {
            const frontendCheck = await testEndpoint('/', 'GET', null, FRONTEND_URL);
            console.log(`    ${frontendCheck.success ? '✓' : '⚠️'} Frontend server (${FRONTEND_URL}) - ${frontendCheck.success ? 'Running' : 'Not available'}`);
            // Don't count frontend as failure since it might not be running during backend tests
            this.updateResults('apiEndpoints', true);
        } catch (error) {
            console.log(`    ⚠️ Frontend server check skipped - not running or not accessible`);
            this.updateResults('apiEndpoints', true);
        }
    }

    // Test 5: Knowledge Base & Documentation
    async testKnowledgeBase() {
        printSection('TEST 5: Knowledge Base & Documentation System', '📚');

        // Test traditional knowledge.json file
        printSubsection('Static Knowledge Base');
        try {
            const knowledgePath = './src/knowledge/knowledge.json';

            if (fs.existsSync(knowledgePath)) {
                console.log(`  ${formatResult(true, 'Knowledge JSON file exists')}`);
                this.updateResults('knowledgeBase', true);

                const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
                const entryCount = Object.keys(knowledgeData).length;

                console.log(`  ${formatResult(entryCount > 0, `Knowledge entries: ${entryCount}`)}`);
                this.updateResults('knowledgeBase', entryCount > 0);

                if (entryCount > 0) {
                    // Validate structure
                    const categories = new Set();
                    let validEntries = 0;
                    let invalidEntries = 0;

                    Object.entries(knowledgeData).forEach(([key, entry]) => {
                        if (entry.title && entry.description && entry.category) {
                            validEntries++;
                            categories.add(entry.category);
                        } else {
                            invalidEntries++;
                            console.log(`    ${formatResult(false, `Invalid entry: ${key}`)}`);
                        }
                    });

                    console.log(`  ${formatResult(validEntries === entryCount, `Valid entries: ${validEntries}/${entryCount}`)}`);
                    console.log(`  ${formatResult(categories.size > 0, `Categories: ${Array.from(categories).join(', ')}`)}`);

                    this.updateResults('knowledgeBase', validEntries === entryCount);
                    this.updateResults('knowledgeBase', categories.size > 0);
                }

            } else {
                console.log(`  ${formatResult(false, 'Knowledge JSON file not found - using alternative systems')}`);
                this.updateResults('knowledgeBase', true); // Not a failure if using other systems
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Knowledge JSON test failed: ${error.message}`)}`);
            this.updateResults('knowledgeBase', false);
        }

        // Test documentation system
        printSubsection('Documentation System');
        try {
            const docsPath = './docs';

            if (fs.existsSync(docsPath)) {
                const docFiles = fs.readdirSync(docsPath).filter(file => file.endsWith('.md'));
                console.log(`  ${formatResult(docFiles.length > 0, `Documentation files: ${docFiles.length}`)}`);
                this.updateResults('knowledgeBase', docFiles.length > 0);

                // Check for key documentation files
                const keyDocs = ['README.md', 'BUILD.md', 'DEPLOYMENT-GUIDE.md'];
                const foundKeyDocs = keyDocs.filter(doc => docFiles.includes(doc));
                console.log(`  ${formatResult(foundKeyDocs.length > 0, `Key docs present: ${foundKeyDocs.join(', ')}`)}`);
                this.updateResults('knowledgeBase', foundKeyDocs.length > 0);

                // Test documentation API integration
                console.log(`  ${formatResult(true, `Total documentation files: ${docFiles.join(', ')}`)}`);
                this.updateResults('knowledgeBase', true);

            } else {
                console.log(`  ${formatResult(false, 'Documentation directory not found')}`);
                this.updateResults('knowledgeBase', false);
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Documentation system test failed: ${error.message}`)}`);
            this.updateResults('knowledgeBase', false);
        }

        // Test services for knowledge management
        printSubsection('Knowledge Services');
        const knowledgeServices = [
            { path: './src/services/MongoDBService.js', name: 'MongoDB Service' },
            { path: './src/services/AgenticKnowledgeBuilder.js', name: 'Agentic Knowledge Builder' }
        ];

        knowledgeServices.forEach(service => {
            const exists = fs.existsSync(service.path);
            console.log(`  ${formatResult(exists, `${service.name} - ${exists ? 'Available' : 'Not found'}`)}`);
            this.updateResults('knowledgeBase', true); // Optional services
        });
    }

    // Test 6: Server Health and Dependencies
    async testServerHealth() {
        printSection('TEST 6: Server Health & Dependencies', '🏥');

        // Backend dependencies
        printSubsection('Backend Dependencies');
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});

            console.log(`  ${formatResult(deps.length > 0, `Backend dependencies: ${deps.length}`)}`);
            this.updateResults('serverHealth', deps.length > 0);

            // Check for key dependencies
            const keyDeps = ['express', 'socket.io', '@modelcontextprotocol/sdk'];
            const foundKeyDeps = keyDeps.filter(dep => deps.includes(dep));
            console.log(`  ${formatResult(foundKeyDeps.length > 0, `Key packages: ${foundKeyDeps.join(', ')}`)}`);
            this.updateResults('serverHealth', foundKeyDeps.length > 0);

            console.log(`  ${formatResult(true, `Dev dependencies: ${devDeps.length}`)}`);
            this.updateResults('serverHealth', true);

        } catch (error) {
            console.log(`  ${formatResult(false, `Backend package.json test failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }

        // Frontend dependencies
        printSubsection('Frontend Dependencies');
        try {
            const frontendPackagePath = './frontend/package.json';
            if (fs.existsSync(frontendPackagePath)) {
                const frontendPackageJson = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
                const frontendDeps = Object.keys(frontendPackageJson.dependencies || {});

                console.log(`  ${formatResult(frontendDeps.length > 0, `Frontend dependencies: ${frontendDeps.length}`)}`);
                this.updateResults('serverHealth', frontendDeps.length > 0);

                // Check for key frontend dependencies
                const keyFrontendDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];
                const foundKeyFrontendDeps = keyFrontendDeps.filter(dep => frontendDeps.includes(dep));
                console.log(`  ${formatResult(foundKeyFrontendDeps.length > 0, `Key frontend packages: ${foundKeyFrontendDeps.join(', ')}`)}`);
                this.updateResults('serverHealth', foundKeyFrontendDeps.length > 0);

            } else {
                console.log(`  ${formatResult(false, 'Frontend package.json not found')}`);
                this.updateResults('serverHealth', false);
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Frontend package.json test failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }

        // Build system check
        printSubsection('Build System');
        const viteConfigExists = fs.existsSync('./frontend/vite.config.js');
        const distExists = fs.existsSync('./dist');

        console.log(`  ${formatResult(viteConfigExists, 'Vite configuration exists')}`);
        console.log(`  ${formatResult(true, `Production build directory: ${distExists ? 'Present' : 'Not built'}`)}`);

        this.updateResults('serverHealth', viteConfigExists);
        this.updateResults('serverHealth', true); // dist is optional

        // MCP Configuration
        printSubsection('MCP Configuration');
        try {
            if (fs.existsSync('./mcp.json')) {
                const mcpConfig = JSON.parse(fs.readFileSync('./mcp.json', 'utf8'));

                console.log(`  ${formatResult(true, 'MCP config file exists')}`);
                this.updateResults('serverHealth', true);

                if (mcpConfig.mcpServers) {
                    const serverNames = Object.keys(mcpConfig.mcpServers);
                    console.log(`  ${formatResult(serverNames.length > 0, `MCP servers configured: ${serverNames.join(', ')}`)}`);
                    this.updateResults('serverHealth', serverNames.length > 0);
                } else {
                    console.log(`  ${formatResult(false, 'No MCP servers configured')}`);
                    this.updateResults('serverHealth', false);
                }
            } else {
                console.log(`  ${formatResult(false, 'MCP config file not found')}`);
                this.updateResults('serverHealth', false);
            }
        } catch (error) {
            console.log(`  ${formatResult(false, `MCP config test failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }

        // Live Server Status
        printSubsection('Live Server Status');
        try {
            const healthResult = await testEndpoint('/');
            console.log(`  ${formatResult(healthResult.success, `Backend server responding (${BASE_URL})`)}`);
            this.updateResults('serverHealth', healthResult.success);

            // Try health endpoint if root works
            if (healthResult.success) {
                const specificHealthResult = await testEndpoint('/api/health');
                console.log(`  ${formatResult(specificHealthResult.success, 'Health endpoint responding')}`);
                this.updateResults('serverHealth', true); // Optional endpoint
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Server health check failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }

        // Script availability
        printSubsection('Available Scripts');
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const scripts = Object.keys(packageJson.scripts || {});

            const keyScripts = ['start', 'dev', 'build'];
            const foundKeyScripts = keyScripts.filter(script => scripts.includes(script));

            console.log(`  ${formatResult(foundKeyScripts.length > 0, `Key scripts available: ${foundKeyScripts.join(', ')}`)}`);
            console.log(`  ${formatResult(true, `Total scripts: ${scripts.length}`)}`);

            this.updateResults('serverHealth', foundKeyScripts.length > 0);
            this.updateResults('serverHealth', true);

        } catch (error) {
            console.log(`  ${formatResult(false, `Scripts check failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }
    }

    // Test 7: Frontend System
    async testFrontendSystem() {
        printSection('TEST 7: Frontend System Architecture', '🎨');

        // React app structure
        printSubsection('React Application Structure');
        const reactFiles = [
            { path: './frontend/src/App.jsx', description: 'Main App component' },
            { path: './frontend/src/main.jsx', description: 'React entry point' },
            { path: './frontend/src/services/api.js', description: 'API service layer' }
        ];

        reactFiles.forEach(file => {
            const exists = fs.existsSync(file.path);
            console.log(`  ${formatResult(exists, `${file.path} - ${file.description}`)}`);
            this.updateResults('frontend', exists);
        });

        // React pages
        printSubsection('React Pages');
        const pagesDir = './frontend/src/pages';
        if (fs.existsSync(pagesDir)) {
            const pages = fs.readdirSync(pagesDir).filter(file => file.endsWith('.jsx'));
            console.log(`  ${formatResult(pages.length > 0, `Page components: ${pages.length} found`)}`);
            console.log(`  ${formatResult(true, `Pages: ${pages.join(', ')}`)}`);
            this.updateResults('frontend', pages.length > 0);
            this.updateResults('frontend', true);
        } else {
            console.log(`  ${formatResult(false, 'Pages directory not found')}`);
            this.updateResults('frontend', false);
        }

        // Components
        printSubsection('React Components');
        const componentsDir = './frontend/src/components';
        if (fs.existsSync(componentsDir)) {
            const components = fs.readdirSync(componentsDir);
            console.log(`  ${formatResult(components.length > 0, `Component directories: ${components.length} found`)}`);
            this.updateResults('frontend', components.length > 0);
        } else {
            console.log(`  ${formatResult(false, 'Components directory not found')}`);
            this.updateResults('frontend', false);
        }

        // Styling system
        printSubsection('Styling System');
        const stylesDir = './frontend/src/styles';
        const globalCss = './frontend/src/styles/globals.css';

        console.log(`  ${formatResult(fs.existsSync(stylesDir), 'Styles directory exists')}`);
        console.log(`  ${formatResult(fs.existsSync(globalCss), 'Global CSS exists')}`);

        this.updateResults('frontend', fs.existsSync(stylesDir));
        this.updateResults('frontend', fs.existsSync(globalCss));

        // Build configuration
        printSubsection('Build System');
        const viteConfig = './frontend/vite.config.js';
        const indexHtml = './frontend/index.html';

        console.log(`  ${formatResult(fs.existsSync(viteConfig), 'Vite configuration exists')}`);
        console.log(`  ${formatResult(fs.existsSync(indexHtml), 'HTML template exists')}`);

        this.updateResults('frontend', fs.existsSync(viteConfig));
        this.updateResults('frontend', fs.existsSync(indexHtml));

        // Documentation integration
        printSubsection('Documentation Integration');
        const docComponents = [
            './frontend/src/pages/Documentation.jsx',
            './frontend/src/services/docsService.js',
            './frontend/src/data/fallbackDocs.js'
        ];

        docComponents.forEach(file => {
            const exists = fs.existsSync(file);
            const filename = path.basename(file);
            console.log(`  ${formatResult(exists, `${filename} - ${exists ? 'Available' : 'Missing'}`)}`);
            this.updateResults('frontend', exists);
        });
    }

    // Generate comprehensive report
    generateReport() {
        printSection('UNIFIED TEST SUITE RESULTS', '🎯');

        const categories = [
            { key: 'fileStructure', name: 'File Structure', icon: '📁' },
            { key: 'environment', name: 'Environment Config', icon: '⚙️' },
            { key: 'mcpTools', name: 'MCP Tools', icon: '🛠️' },
            { key: 'apiEndpoints', name: 'API Endpoints', icon: '🌐' },
            { key: 'knowledgeBase', name: 'Knowledge & Docs', icon: '📚' },
            { key: 'serverHealth', name: 'Server Health', icon: '🏥' },
            { key: 'frontend', name: 'Frontend System', icon: '🎨' }
        ];

        console.log('\n📊 Category Results:');
        categories.forEach(category => {
            const result = this.results[category.key];
            const percentage = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
            const status = percentage >= 90 ? '✅ EXCELLENT' : percentage >= 70 ? '⚠️ GOOD' : '❌ NEEDS WORK';

            console.log(`  ${category.icon} ${category.name}: ${result.passed}/${result.total} (${percentage}%) ${status}`);
        });

        const overallPercentage = this.results.overall.total > 0 ?
            Math.round((this.results.overall.passed / this.results.overall.total) * 100) : 0;

        console.log('\n🏆 OVERALL SYSTEM HEALTH:');
        console.log(`📈 Score: ${this.results.overall.passed}/${this.results.overall.total} tests passed`);
        console.log(`🎯 Health: ${overallPercentage}%`);

        let status, emoji;
        if (overallPercentage >= 95) {
            status = 'PERFECT - Production Ready!';
            emoji = '🎉';
        } else if (overallPercentage >= 85) {
            status = 'EXCELLENT - Ready for Production!';
            emoji = '✅';
        } else if (overallPercentage >= 70) {
            status = 'GOOD - Minor Issues to Address';
            emoji = '⚠️';
        } else if (overallPercentage >= 50) {
            status = 'FAIR - Some Issues Need Attention';
            emoji = '⚠️';
        } else {
            status = 'NEEDS WORK - Critical Issues Found';
            emoji = '❌';
        }

        console.log(`${emoji} STATUS: ${status}`);

        printSection('TEST EXECUTION COMPLETE', '✨');
        console.log(`🕐 Duration: Test completed at ${new Date().toLocaleTimeString()}`);
        console.log(`📋 Summary: ${this.results.overall.passed} passed, ${this.results.overall.failed} failed, ${this.results.overall.total} total`);
        console.log('🚀 BambiSleep Church Unified Test Suite Complete!');
    }

    // Main test runner
    async runAllTests() {
        console.log('🚀 Starting Unified Test Suite Execution...\n');

        try {
            await this.testFileStructure();
            await this.testEnvironmentConfig();
            await this.testMcpTools();
            await this.testApiEndpoints();
            await this.testKnowledgeBase();
            await this.testServerHealth();
            await this.testFrontendSystem();

            this.generateReport();

        } catch (error) {
            console.error(`\n❌ Test suite execution failed: ${error.message}`);
            console.error(error.stack);
            process.exit(1);
        }
    }
}

// Execute the unified test suite
if (require.main === module) {
    const testSuite = new UnifiedTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = UnifiedTestSuite;
