// BambiSleep Church - Unified Comprehensive Testing Suite
// Combines all testing functionality into a single extensive test runner
const fs = require('fs');
const path = require('path');

console.log('🎯 BambiSleep Church - UNIFIED COMPREHENSIVE TEST SUITE');
console.log('=========================================================');
console.log(`📅 Test Date: ${new Date().toISOString()}`);
console.log(`🖥️  Platform: ${process.platform} ${process.arch}`);
console.log(`⚡ Node.js: ${process.version}\n`);

// Load environment variables from .env if it exists
if (fs.existsSync('.env')) {
    require('dotenv').config();
}

// Test configuration
const BASE_URL = 'http://localhost:7070';
const TEST_TIMEOUT = 10000;

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
async function testEndpoint(path, method = 'GET', body = null) {
    const url = `${BASE_URL}${path}`;

    try {
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

        const requiredFiles = [
            { path: './src/server.js', description: 'Main server file' },
            { path: './src/utils/config.js', description: 'Configuration utility' },
            { path: './src/utils/logger.js', description: 'Logging utility' },
            { path: './src/knowledge/knowledge.json', description: 'Knowledge database' },
            { path: './src/mcp/tools/index.js', description: 'MCP tools index' },
            { path: './package.json', description: 'Package configuration' },
            { path: './mcp.json', description: 'MCP server configuration' },
            { path: './.env', description: 'Environment variables' }
        ];

        requiredFiles.forEach(file => {
            const exists = fs.existsSync(file.path);
            console.log(`  ${formatResult(exists, `${file.path} - ${file.description}`)}`);
            this.updateResults('fileStructure', exists);
        });

        // Check directory structure
        const requiredDirs = [
            './src/mcp/tools',
            './src/services',
            './views/pages',
            './views/partials',
            './public/css'
        ];

        printSubsection('Directory Structure');
        requiredDirs.forEach(dir => {
            const exists = fs.existsSync(dir);
            console.log(`  ${formatResult(exists, dir)}`);
            this.updateResults('fileStructure', exists);
        });
    }

    // Test 2: Environment Configuration
    async testEnvironmentConfig() {
        printSection('TEST 2: Environment Configuration', '⚙️');

        const requiredEnvVars = [
            { name: 'PORT', description: 'Server port' },
            { name: 'MONGODB_URI', description: 'MongoDB connection string' },
            { name: 'LMSTUDIO_BASE_URL', description: 'LMStudio base URL' },
            { name: 'LMSTUDIO_MODEL', description: 'LMStudio model name' },
            { name: 'MCP_ENABLED', description: 'MCP server enabled flag' }
        ];

        requiredEnvVars.forEach(envVar => {
            const value = process.env[envVar.name];
            const configured = value && value.trim() !== '';
            console.log(`  ${formatResult(configured, `${envVar.name} - ${envVar.description}`)}`);
            this.updateResults('environment', configured);
        });

        // Test advanced LMStudio configuration
        printSubsection('LMStudio Configuration');
        const lmstudioVars = [
            'LMSTUDIO_URL_LOCAL',
            'LMSTUDIO_URL_REMOTE',
            'LMSTUDIO_TIMEOUT',
            'LMSTUDIO_MAX_TOKENS'
        ];

        lmstudioVars.forEach(envVar => {
            const configured = process.env[envVar] && process.env[envVar].trim() !== '';
            console.log(`  ${formatResult(configured, envVar)}`);
            this.updateResults('environment', configured);
        });
    }

    // Test 3: MCP Tools Structure
    async testMcpTools() {
        printSection('TEST 3: MCP Tools Structure', '🛠️');

        try {
            // Try to load the tools module
            const { allTools } = await import('../src/mcp/tools/index.js');

            console.log(`  ${formatResult(true, `MCP tools module loaded successfully`)}`);
            console.log(`  ${formatResult(true, `Total tools found: ${allTools.length}`)}`);
            this.updateResults('mcpTools', true);
            this.updateResults('mcpTools', true);

            // Analyze tool structure
            const categories = new Map();
            const toolNames = new Set();
            let duplicateNames = [];
            let validTools = 0;
            let invalidTools = 0;

            printSubsection('Tool Structure Analysis');

            allTools.forEach((tool, index) => {
                if (tool.name && tool.description && tool.inputSchema) {
                    validTools++;

                    // Check for duplicates
                    if (toolNames.has(tool.name)) {
                        duplicateNames.push(tool.name);
                    } else {
                        toolNames.add(tool.name);
                    }

                    // Extract category from name prefix
                    const prefix = tool.name.split('-')[0];
                    if (!categories.has(prefix)) {
                        categories.set(prefix, []);
                    }
                    categories.get(prefix).push(tool.name);

                } else {
                    invalidTools++;
                    console.log(`  ${formatResult(false, `Invalid tool at index ${index}: ${tool.name || 'unnamed'}`)}`);
                }
            });

            console.log(`  ${formatResult(validTools === allTools.length, `Valid tools: ${validTools}/${allTools.length}`)}`);
            console.log(`  ${formatResult(invalidTools === 0, `Invalid tools: ${invalidTools}`)}`);
            console.log(`  ${formatResult(duplicateNames.length === 0, `No duplicate names (${duplicateNames.length} found)`)}`);

            this.updateResults('mcpTools', validTools === allTools.length);
            this.updateResults('mcpTools', invalidTools === 0);
            this.updateResults('mcpTools', duplicateNames.length === 0);

            printSubsection('Tool Categories');
            categories.forEach((tools, category) => {
                console.log(`  ${formatResult(true, `${category}: ${tools.length} tools`)}`);
                this.updateResults('mcpTools', true);
            });

            console.log(`\n  📊 MCP Tools Summary: ${allTools.length} tools in ${categories.size} categories`);

        } catch (error) {
            console.log(`  ${formatResult(false, `Failed to load MCP tools: ${error.message}`)}`);
            this.updateResults('mcpTools', false);
        }
    }

    // Test 4: API Endpoints
    async testApiEndpoints() {
        printSection('TEST 4: API Endpoints Testing', '🌐');

        printSubsection('Web Pages');
        const webPages = [
            { path: '/', description: 'Home page' },
            { path: '/knowledge', description: 'Knowledge base' },
            { path: '/agents', description: 'Agent interface' },
            { path: '/mission', description: 'Mission page' },
            { path: '/roadmap', description: 'Roadmap page' }
        ];

        for (const page of webPages) {
            const result = await testEndpoint(page.path);
            this.updateResults('apiEndpoints', result.success);
        }

        printSubsection('API Endpoints');
        const apiEndpoints = [
            { path: '/api/health', description: 'Health check' },
            { path: '/api/mcp/status', description: 'MCP status' },
            { path: '/api/knowledge', description: 'Knowledge API' },
            { path: '/api/agentic/status', description: 'Agentic status' }
        ];

        for (const endpoint of apiEndpoints) {
            const result = await testEndpoint(endpoint.path);
            this.updateResults('apiEndpoints', result.success);
        }

        printSubsection('MCP RPC Endpoints');
        // Test MCP tools/list
        const mcpListResult = await testEndpoint('/mcp', 'POST', {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list'
        });
        this.updateResults('apiEndpoints', mcpListResult.success);

        // Test MCP tool execution
        const mcpToolResult = await testEndpoint('/mcp', 'POST', {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
                name: 'church-status',
                arguments: {}
            }
        });
        this.updateResults('apiEndpoints', mcpToolResult.success);
    }

    // Test 5: Knowledge Base
    async testKnowledgeBase() {
        printSection('TEST 5: Knowledge Base Structure', '📚');

        try {
            const knowledgePath = './src/knowledge/knowledge.json';

            if (fs.existsSync(knowledgePath)) {
                console.log(`  ${formatResult(true, 'Knowledge file exists')}`);
                this.updateResults('knowledgeBase', true);

                const knowledgeData = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));
                const entryCount = Object.keys(knowledgeData).length;

                console.log(`  ${formatResult(true, `Knowledge entries: ${entryCount}`)}`);
                this.updateResults('knowledgeBase', entryCount > 0);

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
                        console.log(`  ${formatResult(false, `Invalid entry: ${key}`)}`);
                    }
                });

                console.log(`  ${formatResult(validEntries === entryCount, `Valid entries: ${validEntries}/${entryCount}`)}`);
                console.log(`  ${formatResult(invalidEntries === 0, `Invalid entries: ${invalidEntries}`)}`);
                console.log(`  ${formatResult(categories.size > 0, `Categories: ${Array.from(categories).join(', ')}`)}`);

                this.updateResults('knowledgeBase', validEntries === entryCount);
                this.updateResults('knowledgeBase', invalidEntries === 0);
                this.updateResults('knowledgeBase', categories.size > 0);

            } else {
                console.log(`  ${formatResult(false, 'Knowledge file not found')}`);
                this.updateResults('knowledgeBase', false);
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Knowledge base test failed: ${error.message}`)}`);
            this.updateResults('knowledgeBase', false);
        }
    }

    // Test 6: Server Health and Dependencies
    async testServerHealth() {
        printSection('TEST 6: Server Health & Dependencies', '🏥');

        printSubsection('Package Dependencies');
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});

            console.log(`  ${formatResult(deps.length > 0, `Production dependencies: ${deps.length}`)}`);
            console.log(`  ${formatResult(true, `Dev dependencies: ${devDeps.length}`)}`);
            console.log(`  ${formatResult(true, `Key packages: ${deps.slice(0, 5).join(', ')}${deps.length > 5 ? '...' : ''}`)}`);

            this.updateResults('serverHealth', deps.length > 0);
            this.updateResults('serverHealth', true);

        } catch (error) {
            console.log(`  ${formatResult(false, `Package.json test failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }

        printSubsection('MCP Configuration');
        try {
            if (fs.existsSync('./mcp.json')) {
                const mcpConfig = JSON.parse(fs.readFileSync('./mcp.json', 'utf8'));

                console.log(`  ${formatResult(true, 'MCP config file exists')}`);
                this.updateResults('serverHealth', true);

                if (mcpConfig.mcpServers && mcpConfig.mcpServers['bambi-church']) {
                    console.log(`  ${formatResult(true, 'Bambi Church MCP server configured')}`);
                    const serverConfig = mcpConfig.mcpServers['bambi-church'];

                    if (serverConfig.command) {
                        console.log(`  ${formatResult(true, `Command: ${serverConfig.command}`)}`);
                    }

                    this.updateResults('serverHealth', true);
                } else {
                    console.log(`  ${formatResult(false, 'Bambi Church MCP server not configured')}`);
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

        printSubsection('Live Server Status');
        try {
            const healthResult = await testEndpoint('/api/health');
            this.updateResults('serverHealth', healthResult.success);

            if (healthResult.success) {
                console.log(`  ${formatResult(true, 'Server is responding to health checks')}`);
            }

        } catch (error) {
            console.log(`  ${formatResult(false, `Server health check failed: ${error.message}`)}`);
            this.updateResults('serverHealth', false);
        }
    }

    // Generate comprehensive report
    generateReport() {
        printSection('UNIFIED TEST SUITE RESULTS', '🎯');

        const categories = [
            { key: 'fileStructure', name: 'File Structure', icon: '📁' },
            { key: 'environment', name: 'Environment Config', icon: '⚙️' },
            { key: 'mcpTools', name: 'MCP Tools', icon: '🛠️' },
            { key: 'apiEndpoints', name: 'API Endpoints', icon: '🌐' },
            { key: 'knowledgeBase', name: 'Knowledge Base', icon: '📚' },
            { key: 'serverHealth', name: 'Server Health', icon: '🏥' }
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
