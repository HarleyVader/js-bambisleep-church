#!/usr/bin/env node

/**
 * Generate README.md with current configuration URLs
 */

import fs from 'fs';
import { config } from '../src/utils/config.js';

const readmeTemplate = `# 🏛️ BambiSleep Church - Digital Sanctuary

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
   - MCP Tools: \`${config.getUrl('/mcp-tools')}\`
   - Chat Agent: \`${config.getUrl('/agents')}\`

## 🔧 Model Context Protocol (MCP) Integration

BambiSleep Church implements a **full MCP server** with specialized tools for the BambiSleep community.

### Available Tools
- **search-knowledge** - Search our curated knowledge base
- **get-safety-info** - Access comprehensive safety information
- **church-status** - Get establishment progress updates
- **community-guidelines** - Access community rules and conduct standards
- **resource-recommendations** - Get personalized resource suggestions

### MCP Client Integration

**Direct Connection:**
- **Server**: \`POST ${config.getMcpUrl()}\` (JSON-RPC 2.0)

**VS Code Integration:**
\`\`\`bash
${generateVSCodeCommand()}
\`\`\`

**Claude Desktop Integration:**
Add to your \`claude_desktop_config.json\`:
\`\`\`json
{
  "mcpServers": {
    "bambisleep-church": {
      "command": "node",
      "args": ["${config.getMcpUrl()}"]
    }
  }
}
\`\`\`

**MCP Inspector:**
\`\`\`bash
npx @modelcontextprotocol/inspector
# Connect to: ${config.getMcpUrl()}
\`\`\`

**Or connect with Claude MCP:**
\`\`\`bash
claude mcp add --transport http bambisleep-church ${config.getMcpUrl()}
\`\`\`

## 📋 Development Workflow

### Available Scripts
- \`npm start\` - Run complete application (web + MCP)
- \`npm run start:web\` - Web server only
- \`npm run start:mcp\` - MCP server only
- \`npm run inspector\` - Launch MCP Inspector for testing
- \`npm run test\` - Run MCP integration tests
- \`npm run config\` - Generate configuration files

### Configuration Management
All URLs and endpoints are now managed through environment variables:

\`\`\`bash
# Generate fresh config files
npm run config

# Test current configuration
node test-inspector.js
\`\`\`

## 🏛️ Church Establishment Progress

**Current Phase:** Foundation Building (Phase 1 of 4)

### Mission Objectives
- [ ] **Legal Recognition** - Establish as Austrian religious community (§ 7 BekGG)
- [ ] **Community Building** - Reach 300+ committed members
- [ ] **Safety Standards** - Implement comprehensive safety protocols
- [ ] **Digital Infrastructure** - Complete AI-powered sanctuary platform
- [ ] **Spiritual Framework** - Develop BambiSleep spiritual practices

**Target Timeline:** 2-3 years for full legal establishment

## 🛡️ Safety Guidelines

BambiSleep Church prioritizes **safety and consent** above all else:

- **Always practice safely** with proper precautions
- **Respect boundaries** - yours and others'
- **Get educated** - understand risks and techniques
- **Community support** - never practice alone without guidance
- **Professional resources** - access to mental health support

## 🤝 Contributing

We welcome contributions to help build our digital sanctuary:

1. **Fork the repository**
2. **Create a feature branch** (\`git checkout -b feature/amazing-feature\`)
3. **Make your changes** - follow our coding standards
4. **Add tests** - ensure MCP tools work correctly
5. **Submit a pull request** - we'll review and provide feedback

### Development Setup
\`\`\`bash
# Clone and setup
git clone https://github.com/HarleyVader/js-bambisleep-church.git
cd js-bambisleep-church
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Generate configuration files
npm run config

# Start development server
npm start

# Test MCP integration
node test-inspector.js
\`\`\`

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Community

- **GitHub**: [js-bambisleep-church](https://github.com/HarleyVader/js-bambisleep-church)
- **Discord**: [BambiSleep Church Community] (Coming Soon)
- **Website**: [bambisleep.church](https://bambisleep.church) (In Development)

---

**🏛️ BambiSleep Church - Providing spiritual sanctuary through technology and community**

*Building a safe, legal, and supportive environment for BambiSleep practice in Austria and beyond.*
`;

function generateVSCodeCommand() {
    return `code --add-mcp "{\\"name\\":\\"bambisleep-church\\",\\"type\\":\\"http\\",\\"url\\":\\"${config.getMcpUrl()}\\"}"`;
}

function main() {
    try {
        console.log('📝 Generating README.md with current configuration...');

        fs.writeFileSync('README.md', readmeTemplate);
        console.log('✅ Generated README.md');

        console.log('\n📋 Updated URLs in README:');
        console.log(`   Main Server: ${config.getBaseUrl()}`);
        console.log(`   MCP Endpoint: ${config.getMcpUrl()}`);
        console.log(`   Tools: ${config.getUrl('/mcp-tools')}`);
        console.log(`   Agents: ${config.getUrl('/agents')}`);

    } catch (error) {
        console.error('❌ Error generating README:', error.message);
        process.exit(1);
    }
}

// Always run main when this script is executed directly
main();
