#!/usr/bin/env node
/**
 * BambiSleep™ Church MCP Control Tower - MCP Server Status Checker
 * Verifies operational status of all 8 configured MCP servers
 * 🌀 System Management Tool
 */

const { spawn } = require('child_process');
const path = require('path');

// ANSI color codes
const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
};

const workspacePath = path.resolve(__dirname, '..');

// MCP server configurations matching .vscode/settings.json
const MCP_SERVERS = {
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', workspacePath]
  },
  git: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', workspacePath]
  },
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github']
  },
  mongodb: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-mongodb', '--connection-string', process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017']
  },
  stripe: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-stripe']
  },
  huggingface: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-huggingface']
  },
  'azure-quantum': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-azure-quantum']
  },
  clarity: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-microsoft-clarity']
  }
};

// Environment variable requirements
const ENV_REQUIREMENTS = {
  github: ['GITHUB_TOKEN'],
  mongodb: [], // Has default value
  stripe: ['STRIPE_SECRET_KEY'],
  huggingface: ['HUGGINGFACE_HUB_TOKEN'],
  'azure-quantum': ['AZURE_QUANTUM_WORKSPACE_ID'],
  clarity: ['CLARITY_PROJECT_ID']
};

/**
 * Check if server can be started (has required env vars)
 */
function canStartServer(serverName) {
  const required = ENV_REQUIREMENTS[serverName] || [];
  const missing = required.filter(envVar => !process.env[envVar]);
  return { canStart: missing.length === 0, missing };
}

/**
 * Test server availability by spawning with --help flag
 */
function checkServerAvailability(serverName, config) {
  return new Promise((resolve) => {
    const { canStart, missing } = canStartServer(serverName);
    
    if (!canStart) {
      resolve({
        name: serverName,
        status: 'SKIPPED',
        reason: `Missing environment variables: ${missing.join(', ')}`,
        available: false
      });
      return;
    }

    const timeout = setTimeout(() => {
      process.kill();
      resolve({
        name: serverName,
        status: 'TIMEOUT',
        reason: 'Server did not respond within 5 seconds',
        available: false
      });
    }, 5000);

    const process = spawn(config.command, [...config.args, '--help'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('exit', (code) => {
      clearTimeout(timeout);
      resolve({
        name: serverName,
        status: code === 0 ? 'AVAILABLE' : 'ERROR',
        reason: code === 0 ? 'Server responded successfully' : `Exit code: ${code}`,
        available: code === 0,
        output: stdout || stderr
      });
    });

    process.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        name: serverName,
        status: 'ERROR',
        reason: err.message,
        available: false
      });
    });
  });
}

/**
 * Main status check
 */
async function checkAllServers() {
  console.log(`${COLORS.CYAN}${COLORS.BOLD}🌀 BambiSleep™ Church MCP Server Status Check${COLORS.RESET}\n`);
  console.log(`Workspace: ${workspacePath}\n`);

  const results = await Promise.all(
    Object.entries(MCP_SERVERS).map(([name, config]) => 
      checkServerAvailability(name, config)
    )
  );

  // Display results
  console.log(`${COLORS.BOLD}Server Status:${COLORS.RESET}\n`);
  
  let availableCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  results.forEach((result) => {
    const statusColor = 
      result.status === 'AVAILABLE' ? COLORS.GREEN :
      result.status === 'SKIPPED' ? COLORS.YELLOW :
      COLORS.RED;

    const icon = 
      result.status === 'AVAILABLE' ? '✅' :
      result.status === 'SKIPPED' ? '⚠️' :
      '❌';

    console.log(`${icon} ${COLORS.BOLD}${result.name}${COLORS.RESET}: ${statusColor}${result.status}${COLORS.RESET}`);
    console.log(`   ${result.reason}\n`);

    if (result.status === 'AVAILABLE') availableCount++;
    else if (result.status === 'SKIPPED') skippedCount++;
    else errorCount++;
  });

  // Summary
  console.log(`${COLORS.BOLD}Summary:${COLORS.RESET}`);
  console.log(`${COLORS.GREEN}✅ Available: ${availableCount}/8${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}⚠️  Skipped: ${skippedCount}/8${COLORS.RESET} (missing environment variables)`);
  console.log(`${COLORS.RED}❌ Errors: ${errorCount}/8${COLORS.RESET}`);

  // Environment variable hints
  if (skippedCount > 0) {
    console.log(`\n${COLORS.YELLOW}${COLORS.BOLD}💡 Configuration Hints:${COLORS.RESET}`);
    console.log(`Create a ${COLORS.CYAN}.env${COLORS.RESET} file with required environment variables:`);
    
    results.filter(r => r.status === 'SKIPPED').forEach(r => {
      const required = ENV_REQUIREMENTS[r.name] || [];
      required.forEach(envVar => {
        console.log(`  ${COLORS.YELLOW}${envVar}${COLORS.RESET}="your-${envVar.toLowerCase().replace(/_/g, '-')}"`);
      });
    });
    
    console.log(`\nSee ${COLORS.CYAN}.env.example${COLORS.RESET} for template.\n`);
  }

  // Exit code: 0 if all available servers work, 1 if any errors
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run check
checkAllServers().catch((err) => {
  console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, err);
  process.exit(1);
});
