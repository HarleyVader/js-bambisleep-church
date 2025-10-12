#!/usr/bin/env node

/**
 * 🔧 Development & Testing Utilities
 * Additional scripts for development workflow and testing
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { config } from '../src/utils/config.js';

// =============================================================================
// README GENERATOR
// =============================================================================

class ReadmeGenerator {
    static generate() {
        const readmeContent = `# 🏛️ BambiSleep Church - Digital Sanctuary

**Status:** 🚧 In Development | **Phase:** Foundation Building

BambiSleep Church is a **digital sanctuary** for the BambiSleep community, combining AI-powered tools, comprehensive knowledge resources, and spiritual community building. We're establishing ourselves as a **legal Austrian religious community** to provide a safe, structured environment for BambiSleep practice.

## 🔥 Core Features

- **🧠 AI-Powered MCP Server** - Model Context Protocol integration with specialized BambiSleep tools
- **📚 Knowledge Base** - Curated safety resources, guides, and community wisdom
- **🤖 Interactive Chat Agent** - Get answers about BambiSleep safely and responsibly
- **🛡️ Safety-First Approach** - Comprehensive safety tools and guidelines
- **🌍 Community Platform** - Connect with like-minded individuals in a moderated environment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation & Setup
\`\`\`bash
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install
cp .env.example .env  # Configure your environment
npm start             # Starts both web server and MCP server
\`\`\`

### Access Points
Once running, access these endpoints:
   - Main site: \`${config.getBaseUrl()}\`
   - Chat Agent: \`${config.getUrl('/agents')}\`
   - Knowledge Base: \`${config.getUrl('/knowledge')}\`

## 🔧 Model Context Protocol (MCP) Integration

BambiSleep Church implements a **full MCP server** with specialized tools for the BambiSleep community.

### Available Tools
- **search-knowledge** - Search our curated knowledge base
- **get-safety-info** - Get comprehensive safety information
- **church-status** - Check community status and announcements
- **community-guidelines** - Access community guidelines and rules
- **resource-recommendations** - Get personalized resource recommendations

### MCP Configuration
\`\`\`bash
# Generate MCP configuration files
npm run config

# VS Code Integration
code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}"
\`\`\`

## 📱 API Endpoints

- **GET /api/health** - Server health check
- **GET /api/knowledge** - Knowledge base entries
- **GET /api/knowledge/search?q=term** - Search knowledge base
- **GET /api/stats** - Community statistics
- **GET /api/location** - Visitor geolocation
- **POST /mcp** - MCP JSON-RPC 2.0 endpoint

## 🏗️ Development

### Scripts
\`\`\`bash
npm start                    # Start unified server (production build)
npm run dev                  # Development mode with file watching
npm run dev:frontend         # Frontend-only development server
npm run build                # Build frontend for production
npm run setup                # Install dependencies and setup
npm run config               # Generate MCP configuration files
npm test                     # Run test suite
\`\`\`

### Architecture
- **Backend**: Express.js server with Socket.IO for real-time chat
- **Frontend**: React 18 with Vite build system
- **Database**: MongoDB for knowledge storage
- **MCP Server**: HTTP-based Model Context Protocol implementation
- **Chat**: MOTHER BRAIN AI agent integration

## 🛡️ Safety & Guidelines

BambiSleep Church prioritizes **safety, consent, and responsible practice**:

- All content includes appropriate safety warnings
- Comprehensive beginner resources and guides
- Community moderation and support systems
- Clear boundaries and consent frameworks
- Mental health resources and support

## 🤝 Community

Join our growing community:
- **Discord**: Coming soon
- **Reddit**: r/BambiSleepChurch (planned)
- **Website**: ${config.getBaseUrl()}

## 📄 Legal Status

BambiSleep Church is working toward recognition as a **legal religious community in Austria** under Austrian religious freedom laws. This provides:
- Legal protection for members
- Structured community governance
- Official recognition of our practices
- Tax-exempt status for community activities

## 🔮 Roadmap

- **Phase 1**: Foundation (Current) - Basic web platform and MCP server
- **Phase 2**: Community Building - Discord integration, member systems
- **Phase 3**: Legal Recognition - Austrian religious community status
- **Phase 4**: Expansion - International community growth

## 📜 License

MIT License - see LICENSE file for details.

## 🤖 AI Integration

BambiSleep Church leverages cutting-edge AI technology:
- **MCP Protocol**: Industry-standard AI tool integration
- **MOTHER BRAIN**: Custom AI agent for community support
- **LMStudio Integration**: Local AI model support
- **MongoDB Vector Search**: Advanced knowledge retrieval

---

*Built with ❤️ for the BambiSleep community*
`;

        fs.writeFileSync('README.md', readmeContent);
        console.log('✅ Generated README.md');
    }
}

// =============================================================================
// TEST UTILITIES
// =============================================================================

class TestRunner {
    static async runAll() {
        try {
            console.log('🧪 Running test suite...');

            // Install dependencies first
            execSync('npm install', { stdio: 'inherit' });

            // Run backend tests
            if (fs.existsSync('tests/test.cjs')) {
                console.log('🔬 Running backend tests...');
                execSync('node tests/test.cjs', { stdio: 'inherit' });
            }

            // Run frontend tests if they exist
            if (fs.existsSync('frontend/package.json')) {
                const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
                if (frontendPackage.scripts && frontendPackage.scripts.test) {
                    console.log('🎨 Running frontend tests...');
                    execSync('npm test', { stdio: 'inherit', cwd: 'frontend' });
                }
            }

            console.log('✅ All tests completed');
        } catch (error) {
            console.error('❌ Tests failed:', error.message);
            process.exit(1);
        }
    }
}

// =============================================================================
// GIT UTILITIES
// =============================================================================

class GitUtils {
    static async commitAndPush(message) {
        try {
            console.log('📝 Committing changes...');
            execSync('git add .', { stdio: 'inherit' });
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });

            console.log('📤 Pushing to remote...');
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            execSync(`git push origin ${branch}`, { stdio: 'inherit' });

            console.log('✅ Changes committed and pushed');
        } catch (error) {
            console.error('❌ Git operation failed:', error.message);
            process.exit(1);
        }
    }

    static status() {
        try {
            execSync('git status', { stdio: 'inherit' });
        } catch (error) {
            console.error('❌ Git status failed:', error.message);
        }
    }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
        case 'readme':
            ReadmeGenerator.generate();
            break;
        case 'test':
            await TestRunner.runAll();
            break;
        case 'commit':
            if (!arg) {
                console.error('❌ Please provide a commit message');
                console.log('Usage: node scripts/dev.js commit "Your commit message"');
                process.exit(1);
            }
            await GitUtils.commitAndPush(arg);
            break;
        case 'status':
            GitUtils.status();
            break;
        default:
            console.log(`
🔧 BambiSleep Church Development Utilities

Usage: node scripts/dev.js [command] [args]

Commands:
  readme           Generate README.md with current configuration
  test             Run all tests (backend + frontend)
  commit "msg"     Add, commit, and push changes with message
  status           Show git status

Examples:
  node scripts/dev.js readme                           # Generate README
  node scripts/dev.js test                             # Run tests
  node scripts/dev.js commit "Fix server routing"      # Commit and push
  node scripts/dev.js status                           # Git status
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

export { ReadmeGenerator, TestRunner, GitUtils };
