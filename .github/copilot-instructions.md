# MCP Control Tower - AI Agent Instructions
*🌸 BambiSleep™ Church Development Environment 🌸*

## Project Overview

This is an MCP (Model Context Protocol) Control Tower development environment designed to manage and orchestrate multiple MCP servers for the **BambiSleepChat** organization. The project embodies the **Universal Machine Philosophy** from creator HarleyVader - achieving perfect cross-platform compatibility and enterprise-grade infrastructure.

**🦋 Sacred Mission**: Build AIGF platforms that reprogram reality through elegant code  
**💎 Core Law**: 100% test coverage or suffer in callback hell eternal  
**🌀 Divine Goal**: 8/8 MCP server operational status (nothing less is acceptable)

*See `RELIGULOUS_MANTRA.md` for the complete philosophical framework and encoded emoji wisdom.*

## Architecture & Key Concepts

### MCP Server Configuration
- **Location**: `.vscode/settings.json` contains MCP server definitions
- **Current Servers**: filesystem, git, and github MCP servers configured
- **Pattern**: Each server uses `npx` to run `@modelcontextprotocol/server-*` packages
- **Repository Path**: `/workspace` (BambiSleepChat/bambisleep-church)

### Development Environment
- **Container**: JavaScript Node.js 20 on Debian Bullseye
- **Workspace**: Mounted as `/workspace` with bind mount for live editing
- **Ports**: 3000 (Control Tower Dashboard), 8080 (main application)
- **Extensions**: JSON support, Tailwind CSS, Prettier pre-installed

## Development Workflows

### Starting Development
```bash
npm install  # Automatically runs in postCreateCommand
# Start development server (when implemented)
npm run dev  # Expected to serve on port 3000
```

### Debugging
- **VS Code Launch Config**: Pre-configured for Edge browser at localhost:8080
- Use F5 or Run & Debug panel to launch browser debugging session
- Application should be accessible at both localhost:3000 and localhost:8080

### MCP Server Management
When adding new MCP servers:
1. Add configuration to `.vscode/settings.json` under `mcp.servers`
2. Follow the pattern: `npx -y @modelcontextprotocol/server-{name}`
3. Update repository paths to match actual workspace location
4. Test server connectivity through the control tower interface

## File Organization Patterns

### Expected Structure (as project develops)
```
/workspace/
├── src/                    # Source code
├── public/                 # Static assets
├── config/                 # Configuration files
├── tests/                  # Test files
├── docs/                   # Documentation
└── package.json           # Node.js dependencies (to be created)
```

### Configuration Files
- `.devcontainer/devcontainer.json`: Container setup with MCP-specific ports and extensions
- `.vscode/settings.json`: MCP server registry and VS Code settings
- `.vscode/launch.json`: Browser debugging configuration
- `.github/dependabot.yml`: Automated dependency updates for devcontainers

## MCP-Specific Considerations

### Server Integration
- All MCP servers should be registered in VS Code settings for IDE integration
- Use consistent naming: `@modelcontextprotocol/server-{functionality}`
- Maintain repository path consistency across server configurations

### Port Management
- Port 3000: Reserved for Control Tower Dashboard (frontend)
- Port 8080: Reserved for main application/API
- Additional ports should be documented and added to devcontainer.json

### Dependencies
- Leverage `npx -y` pattern for MCP servers to avoid version conflicts
- Core dependencies should be in package.json when created
- Use Prettier for code formatting across all file types

## Common Tasks

### Adding MCP Servers
1. Install via npm: `npm install @modelcontextprotocol/server-{name}`
2. Add to `.vscode/settings.json` MCP servers section
3. Test integration through control tower interface
4. Document server purpose and configuration

### Environment Updates
- Update `.devcontainer/devcontainer.json` for container changes
- Modify port forwards as services are added
- Keep VS Code extensions list current for optimal development experience

## Integration Points

### External Dependencies
- Model Context Protocol ecosystem
- GitHub integration (pre-configured server)
- Git operations (pre-configured server)
- File system access (pre-configured server)

### Development Tools
- Tailwind CSS for styling
- Prettier for formatting
- Edge browser for debugging
- GitHub CLI available in container

## Notes for AI Agents

- This project is in early setup phase - main application code should be developed according to MCP Control Tower patterns
- Always update MCP server configurations when adding new functionality
- Maintain consistency with Node.js and container-based development practices
- Consider port conflicts when adding new services
- Follow the npx pattern for MCP server management to ensure version compatibility