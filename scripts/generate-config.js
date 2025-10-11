#!/usr/bin/env node

/**
 * Generate configuration files for MCP clients using environment variables
 */

import fs from 'fs';
import path from 'path';
import { config } from '../src/utils/config.js';

function generateMcpInspectorConfig() {
    const configData = {
        mcpServers: {
            "bambisleep-church": {
                type: "streamable-http",
                url: `https://at.bambisleep.church:${config.server.port}${config.server.mcpEndpoint}`,
                name: "BambiSleep Church MCP Server",
                description: "Digital sanctuary and knowledge base for the BambiSleep community",
                note: "Main MCP server for BambiSleep Church with safety tools and community resources"
            },
            "bambisleep-church-dev": {
                type: "streamable-http",
                url: config.getMcpUrl(),
                name: "BambiSleep Church Development",
                description: "Development instance with debug logging enabled",
                env: {
                    DEBUG: "true",
                    NODE_ENV: "development"
                },
                note: "Development configuration with enhanced logging for debugging"
            },
            "bambisleep-church-claude": {
                type: "http",
                url: config.getMcpUrl(),
                name: "BambiSleep Church for Claude",
                description: "Configuration optimized for Claude Desktop integration",
                note: "Use this configuration in Claude Desktop MCP settings"
            },
            "bambisleep-church-vscode": {
                type: "http",
                url: config.getMcpUrl(),
                name: "BambiSleep Church for VS Code",
                description: "Configuration for VS Code MCP extension",
                note: `Use: code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}"`
            }
        },
        inspectorConfig: {
            ui: {
                port: 6274,
                host: "localhost"
            },
            proxy: {
                port: 6277,
                host: "localhost"
            }
        },
        documentation: {
            endpoints: {
                main: config.getBaseUrl(),
                mcp: config.getMcpUrl(),
                inspector: config.getUrl('/inspector'),
                status: config.getUrl('/api/mcp/status'),
                tools: config.getUrl('/mcp-tools')
            },
            commands: {
                vscode: `code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}"`
            }
        }
    };

    return JSON.stringify(configData, null, 4);
}

function generateVSCodeConfig() {
    return JSON.stringify({
        name: "bambisleep-church",
        type: "http",
        url: config.getMcpUrl()
    }, null, 2);
}

function generateClaudeConfig() {
    return JSON.stringify({
        bambisleep_church: {
            type: "http",
            url: config.getMcpUrl(),
            name: "BambiSleep Church",
            description: "Digital sanctuary and knowledge base for the BambiSleep community"
        }
    }, null, 2);
}

function main() {
    try {
        console.log('🔧 Generating MCP configuration files...');

        // Generate MCP Inspector config
        const inspectorConfig = generateMcpInspectorConfig();
        fs.writeFileSync('mcp-inspector.json', inspectorConfig);
        console.log('✅ Generated mcp-inspector.json');

        // Create configs directory if it doesn't exist
        const configsDir = 'configs';
        if (!fs.existsSync(configsDir)) {
            fs.mkdirSync(configsDir, { recursive: true });
        }

        // Generate VS Code config
        const vscodeConfig = generateVSCodeConfig();
        fs.writeFileSync(path.join(configsDir, 'vscode-mcp.json'), vscodeConfig);
        console.log('✅ Generated configs/vscode-mcp.json');

        // Generate Claude config
        const claudeConfig = generateClaudeConfig();
        fs.writeFileSync(path.join(configsDir, 'claude-mcp.json'), claudeConfig);
        console.log('✅ Generated configs/claude-mcp.json');

        console.log('\n📋 Configuration URLs:');
        console.log(`   Main Server: ${config.getBaseUrl()}`);
        console.log(`   MCP Endpoint: ${config.getMcpUrl()}`);
        console.log(`   Inspector UI: ${config.getUrl('/inspector')}`);
        console.log(`   MCP Status: ${config.getUrl('/api/mcp/status')}`);

        console.log('\n🔌 VS Code Command:');
        console.log(`   code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}" `);
    } catch (error) {
        console.error('❌ Error generating configuration files:', error.message);
        process.exit(1);
    }
}

// Always run main when this script is executed directly
main();

export { generateMcpInspectorConfig, generateVSCodeConfig, generateClaudeConfig };
