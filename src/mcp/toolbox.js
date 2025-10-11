// Automatic Tool Discovery and Loading System
// Fetches and integrates tools from MCP toolbox repositories
import { log } from '../utils/logger.js';
import { config } from '../utils/config.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ToolboxLoader {
    constructor() {
        this.loadedToolboxes = new Map();
        this.discoveryCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.toolsDirectory = path.join(__dirname, 'tools');
        this.watchedFiles = new Set();
    }

    /**
     * Load tools from multiple toolbox sources
     */
    async loadToolboxes(sources = []) {
        const allTools = [];

        // Load from specified sources only
        for (const source of sources) {
            try {
                const tools = await this.loadFromSource(source);
                allTools.push(...tools);
                log.info(`Loaded ${tools.length} tools from ${source.name || source.url}`);
            } catch (error) {
                log.error(`Failed to load toolbox from ${source.name || source.url}: ${error.message}`);
            }
        }

        return allTools;
    }

    /**
     * Load tools from local tools directory
     */
    async loadLocalTools() {
        const tools = [];

        try {
            // Check if tools directory exists
            if (!fs.existsSync(this.toolsDirectory)) {
                log.warn(`Tools directory does not exist: ${this.toolsDirectory}`);
                return tools;
            }

            const files = fs.readdirSync(this.toolsDirectory);
            const toolFiles = files.filter(file =>
                file.endsWith('.js') &&
                file !== 'index.js' &&
                !file.startsWith('.')
            );

            log.info(`Found ${toolFiles.length} tool files in ${this.toolsDirectory}`);

            for (const toolFile of toolFiles) {
                try {
                    const tool = await this.loadLocalTool(toolFile);
                    if (tool) {
                        tools.push(tool);
                        log.info(`✓ Loaded tool: ${tool.name} from ${toolFile}`);
                    }
                } catch (error) {
                    log.error(`✗ Failed to load tool from ${toolFile}: ${error.message}`);
                }
            }

        } catch (error) {
            throw new Error(`Failed to read tools directory: ${error.message}`);
        }

        return tools;
    }

    /**
     * Load a single tool from local file
     */
    async loadLocalTool(filename) {
        const toolPath = path.join(this.toolsDirectory, filename);
        const toolUrl = `file://${toolPath}`;

        try {
            // Dynamic import with cache busting for development
            const cacheBuster = `?v=${Date.now()}`;
            const toolModule = await import(toolUrl + cacheBuster);

            // Validate tool module structure
            if (!this.isValidLocalToolModule(toolModule)) {
                throw new Error(`Invalid tool module structure in ${filename}`);
            }

            // Create normalized tool object
            const tool = {
                name: toolModule.toolName || toolModule.default?.toolName,
                config: toolModule.config || toolModule.default?.config,
                handler: toolModule.handler || toolModule.default?.handler,
                metadata: {
                    source: `local:${filename}`,
                    loadedAt: new Date().toISOString(),
                    filePath: toolPath
                }
            };

            // Track this file for watching
            this.watchedFiles.add(toolPath);

            return tool;

        } catch (error) {
            throw new Error(`Failed to import tool module ${filename}: ${error.message}`);
        }
    }

    /**
     * Validate local tool module structure
     */
    isValidLocalToolModule(module) {
        // Check for named exports
        if (module.toolName && module.config && module.handler) {
            return true;
        }

        // Check for default export
        if (module.default && module.default.toolName && module.default.config && module.default.handler) {
            return true;
        }

        return false;
    }

    /**
     * Watch tools directory for changes (basic implementation)
     */
    watchToolsDirectory(callback) {
        if (!fs.existsSync(this.toolsDirectory)) {
            return null;
        }

        try {
            const watcher = fs.watch(this.toolsDirectory, { recursive: false }, (eventType, filename) => {
                if (filename && filename.endsWith('.js') && !filename.startsWith('.')) {
                    log.info(`Tool file ${eventType}: ${filename}`);
                    if (callback && typeof callback === 'function') {
                        callback(eventType, filename);
                    }
                }
            });

            log.info(`Watching tools directory: ${this.toolsDirectory}`);
            return watcher;
        } catch (error) {
            log.error(`Failed to watch tools directory: ${error.message}`);
            return null;
        }
    }

    /**
     * Load tools from a specific source
     */
    async loadFromSource(source) {
        const cacheKey = source.url || source.name;
        const cached = this.getCachedResult(cacheKey);

        if (cached) {
            log.info(`Using cached tools from ${source.name || source.url}`);
            return cached;
        }

        let tools = [];

        switch (source.type) {
            case 'github':
                tools = await this.loadFromGithub(source);
                break;
            case 'npm':
                tools = await this.loadFromNpm(source);
                break;
            case 'url':
                tools = await this.loadFromUrl(source);
                break;
            case 'builtin':
                tools = await this.loadBuiltinToolbox(source);
                break;
            default:
                throw new Error(`Unknown source type: ${source.type}`);
        }

        this.setCachedResult(cacheKey, tools);
        this.loadedToolboxes.set(cacheKey, { source, tools, loadedAt: Date.now() });

        return tools;
    }

    /**
     * Load tools from GitHub repository
     */
    async loadFromGithub(source) {
        const { owner, repo, path = 'tools', branch = 'main' } = source;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'BambiSleep-Church-MCP'
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
            }

            const files = await response.json();
            const tools = [];

            for (const file of files) {
                if (file.type === 'file' && file.name.endsWith('.js')) {
                    try {
                        const toolModule = await this.fetchAndEvaluateModule(file.download_url);
                        if (this.isValidTool(toolModule)) {
                            tools.push(this.normalizeTool(toolModule, file.name));
                        }
                    } catch (error) {
                        log.warn(`Failed to load tool from ${file.name}: ${error.message}`);
                    }
                }
            }

            return tools;
        } catch (error) {
            throw new Error(`Failed to load from GitHub: ${error.message}`);
        }
    }

    /**
     * Load tools from NPM package
     */
    async loadFromNpm(source) {
        try {
            // For demo purposes, we'll simulate NPM loading
            // In production, you'd use dynamic imports or npm registry API
            const packageName = source.package;
            log.warn(`NPM toolbox loading not yet implemented for ${packageName}`);
            return [];
        } catch (error) {
            throw new Error(`Failed to load from NPM: ${error.message}`);
        }
    }

    /**
     * Load tools from direct URL
     */
    async loadFromUrl(source) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/json')) {
                const toolboxConfig = await response.json();
                return this.processToolboxConfig(toolboxConfig);
            } else if (contentType?.includes('javascript')) {
                const toolModule = await this.fetchAndEvaluateModule(source.url);
                return this.isValidTool(toolModule) ? [this.normalizeTool(toolModule)] : [];
            }

            throw new Error(`Unsupported content type: ${contentType}`);
        } catch (error) {
            throw new Error(`Failed to load from URL: ${error.message}`);
        }
    }

    /**
     * Load builtin toolbox configurations
     */
    async loadBuiltinToolbox(source) {
        const builtinToolboxes = {
            'common-web-tools': () => this.createCommonWebTools(),
            'ai-assistant-tools': () => this.createAiAssistantTools(),
            'content-management-tools': () => this.createContentManagementTools()
        };

        const toolboxName = source.name;
        const createFn = builtinToolboxes[toolboxName];

        if (!createFn) {
            throw new Error(`Unknown builtin toolbox: ${toolboxName}`);
        }

        return createFn();
    }

    /**
     * Fetch and evaluate a JavaScript module from URL
     */
    async fetchAndEvaluateModule(url) {
        try {
            const response = await fetch(url);
            const code = await response.text();

            // Basic security check - only allow safe patterns
            if (this.containsUnsafeCode(code)) {
                throw new Error('Code contains potentially unsafe patterns');
            }

            // Create isolated evaluation context
            const module = { exports: {} };
            const require = (name) => {
                throw new Error(`require() not allowed in dynamic tools: ${name}`);
            };

            // Evaluate in controlled context
            const func = new Function('module', 'exports', 'require', code);
            func(module, module.exports, require);

            return module.exports.default || module.exports;
        } catch (error) {
            throw new Error(`Module evaluation failed: ${error.message}`);
        }
    }

    /**
     * Check if code contains potentially unsafe patterns
     */
    containsUnsafeCode(code) {
        const unsafePatterns = [
            /require\s*\(\s*['"]fs['"]/, // File system access
            /require\s*\(\s*['"]child_process['"]/, // Process execution
            /process\.exit/, // Process termination
            /eval\s*\(/, // Code evaluation
            /Function\s*\(/, // Function constructor
            /import\s*\(\s*['"]/, // Dynamic imports
            /\.constructor/, // Constructor access
            /__proto__/, // Prototype pollution
        ];

        return unsafePatterns.some(pattern => pattern.test(code));
    }

    /**
     * Validate if an object is a valid MCP tool
     */
    isValidTool(tool) {
        return tool &&
            typeof tool.name === 'string' &&
            typeof tool.description === 'string' &&
            typeof tool.handler === 'function' &&
            (tool.inputSchema || tool.config?.inputSchema);
    }

    /**
     * Normalize tool format to MCP standard
     */
    normalizeTool(tool, filename) {
        return {
            name: tool.name,
            config: {
                title: tool.title || tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema || tool.config?.inputSchema,
                outputSchema: tool.outputSchema || tool.config?.outputSchema
            },
            handler: tool.handler,
            metadata: {
                source: filename || 'unknown',
                loadedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Process toolbox configuration file
     */
    processToolboxConfig(config) {
        const tools = [];

        if (config.tools && Array.isArray(config.tools)) {
            for (const toolConfig of config.tools) {
                if (this.isValidToolConfig(toolConfig)) {
                    tools.push(this.createToolFromConfig(toolConfig));
                }
            }
        }

        return tools;
    }

    /**
     * Validate toolbox configuration
     */
    isValidToolConfig(config) {
        return config &&
            typeof config.name === 'string' &&
            typeof config.description === 'string' &&
            (config.endpoint || config.handler);
    }

    /**
     * Create tool from configuration
     */
    createToolFromConfig(config) {
        let handler;

        if (config.handler) {
            handler = config.handler;
        } else if (config.endpoint) {
            handler = this.createHttpToolHandler(config.endpoint, config.method || 'POST');
        } else {
            throw new Error('Tool config must have either handler or endpoint');
        }

        return {
            name: config.name,
            config: {
                title: config.title || config.name,
                description: config.description,
                inputSchema: config.inputSchema,
                outputSchema: config.outputSchema
            },
            handler
        };
    }

    /**
     * Create HTTP-based tool handler
     */
    createHttpToolHandler(endpoint, method = 'POST') {
        return async (params) => {
            try {
                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'BambiSleep-Church-MCP'
                    },
                    body: JSON.stringify(params)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify(result)
                    }],
                    structuredContent: result
                };
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `Tool execution failed: ${error.message}`
                    }],
                    isError: true
                };
            }
        };
    }

    /**
     * Create common web tools
     */
    createCommonWebTools() {
        return [
            {
                name: 'web-search',
                config: {
                    title: 'Web Search',
                    description: 'Search the web for information',
                    inputSchema: {
                        query: { type: 'string', description: 'Search query' },
                        limit: { type: 'number', description: 'Number of results', default: 5 }
                    }
                },
                handler: async ({ query, limit = 5 }) => {
                    // Placeholder - would integrate with search API
                    return {
                        content: [{
                            type: 'text',
                            text: `Web search not yet implemented for query: ${query}`
                        }],
                        isError: false
                    };
                }
            }
        ];
    }

    /**
     * Create AI assistant tools
     */
    createAiAssistantTools() {
        return [
            {
                name: 'text-summary',
                config: {
                    title: 'Text Summarizer',
                    description: 'Summarize long text content',
                    inputSchema: {
                        text: { type: 'string', description: 'Text to summarize' },
                        maxLength: { type: 'number', description: 'Maximum summary length', default: 200 }
                    }
                },
                handler: async ({ text, maxLength = 200 }) => {
                    // Basic summarization (would use AI service in production)
                    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
                    const summary = sentences.slice(0, Math.ceil(sentences.length * 0.3)).join('. ') + '.';

                    return {
                        content: [{
                            type: 'text',
                            text: summary.slice(0, maxLength)
                        }],
                        structuredContent: { summary: summary.slice(0, maxLength) }
                    };
                }
            }
        ];
    }

    /**
     * Create content management tools
     */
    createContentManagementTools() {
        return [
            {
                name: 'content-validator',
                config: {
                    title: 'Content Validator',
                    description: 'Validate content format and safety',
                    inputSchema: {
                        content: { type: 'string', description: 'Content to validate' },
                        type: { type: 'string', enum: ['text', 'html', 'markdown'], description: 'Content type' }
                    }
                },
                handler: async ({ content, type }) => {
                    const validation = {
                        isValid: true,
                        warnings: [],
                        length: content.length,
                        type: type
                    };

                    // Basic validation checks
                    if (content.length > 10000) {
                        validation.warnings.push('Content is quite long');
                    }

                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify(validation, null, 2)
                        }],
                        structuredContent: validation
                    };
                }
            }
        ];
    }

    /**
     * Cache management
     */
    getCachedResult(key) {
        const cached = this.discoveryCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCachedResult(key, data) {
        this.discoveryCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get information about loaded toolboxes
     */
    getLoadedToolboxes() {
        const result = [];
        for (const [key, toolbox] of this.loadedToolboxes) {
            result.push({
                key,
                source: toolbox.source,
                toolCount: toolbox.tools.length,
                loadedAt: toolbox.loadedAt
            });
        }
        return result;
    }

    /**
     * Get tool information including local tools
     */
    getToolInfo() {
        const info = {
            localTools: [],
            externalToolboxes: [],
            totalTools: 0
        };

        for (const [key, toolbox] of this.loadedToolboxes) {
            const toolboxInfo = {
                key,
                source: toolbox.source,
                toolCount: toolbox.tools.length,
                loadedAt: toolbox.loadedAt,
                isLocal: toolbox.source?.type === 'local'
            };

            if (toolboxInfo.isLocal) {
                info.localTools.push(toolboxInfo);
            } else {
                info.externalToolboxes.push(toolboxInfo);
            }

            info.totalTools += toolbox.tools.length;
        }

        return info;
    }

    /**
     * Reload a specific local tool
     */
    async reloadLocalTool(filename) {
        const toolPath = path.join(this.toolsDirectory, filename);

        try {
            // Clear module cache if using require (not needed for dynamic import)
            const tool = await this.loadLocalTool(filename);

            if (tool) {
                // Update the loaded tools
                const key = `local:${filename}`;
                this.loadedToolboxes.set(key, {
                    source: { type: 'local', filename },
                    tools: [tool],
                    loadedAt: Date.now()
                });

                log.info(`Reloaded tool: ${tool.name} from ${filename}`);
                return tool;
            }
        } catch (error) {
            log.error(`Failed to reload tool ${filename}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.discoveryCache.clear();
        this.loadedToolboxes.clear();
        this.watchedFiles.clear();
        log.info('ToolboxLoader cleaned up');
    }
}

export default ToolboxLoader;
