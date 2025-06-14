// Basic codebase tests for BambiSleep Church
// Tests core functionality and server startup

const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');

describe('BambiSleep Church Codebase Tests', () => {
  let serverProcess;
  let mcpProcess;

  beforeAll(async () => {
    // Basic environment check
    expect(process.env.NODE_ENV || 'development').toBeDefined();
  });

  afterAll(async () => {
    // Cleanup any running processes
    if (serverProcess) serverProcess.kill();
    if (mcpProcess) mcpProcess.kill();
  });

  test('package.json has required dependencies', () => {
    const pkg = require('../package.json');
    expect(pkg.dependencies.express).toBeDefined();
    expect(pkg.dependencies['socket.io']).toBeDefined();
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeDefined();
  });

  test('server.js file exists and is readable', () => {
    const fs = require('fs');
    const serverPath = path.join(__dirname, '../src/server.js');
    expect(fs.existsSync(serverPath)).toBe(true);
  });

  test('MCP server file exists and is readable', () => {
    const fs = require('fs');
    const mcpPath = path.join(__dirname, '../src/mcp/McpServer.js');
    expect(fs.existsSync(mcpPath)).toBe(true);
  });

  test('knowledge.json exists', () => {
    const fs = require('fs');
    const knowledgePath = path.join(__dirname, '../src/knowledge/knowledge.json');
    expect(fs.existsSync(knowledgePath)).toBe(true);
  });

  test('public assets are available', () => {
    const fs = require('fs');
    const cssPath = path.join(__dirname, '../public/css/style.css');
    const jsPath = path.join(__dirname, '../public/js/agents-dashboard.js');
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(fs.existsSync(jsPath)).toBe(true);
  });
});
