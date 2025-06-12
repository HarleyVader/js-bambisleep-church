/**
 * Centralized Configuration Manager for BambiSleep Church
 * Manages all application configuration with environment variable support
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }

        this.config = {};
        this.envPrefix = 'BAMBI_';
        this.configFiles = [
            path.join(process.cwd(), 'config', 'lmstudio-mcp-config.json'),
            path.join(process.cwd(), 'config', 'app-config.json')
        ];

        this.loadConfiguration();
        ConfigManager.instance = this;
    }

    /**
     * Load configuration from multiple sources
     */
    loadConfiguration() {
        // Start with defaults
        this.config = this.getDefaultConfig();

        // Load from JSON config files
        this.configFiles.forEach(configFile => {
            if (fs.existsSync(configFile)) {
                try {
                    const fileConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    this.config = this.deepMerge(this.config, fileConfig);
                } catch (error) {
                    console.warn(`⚠️ Failed to load config file ${configFile}:`, error.message);
                }
            }
        });

        // Override with environment variables
        this.loadEnvironmentVariables();

        console.log('📋 Configuration loaded successfully');
    }

    /**
     * Get default configuration
     */
    getDefaultConfig() {
        return {
            app: {
                name: 'BambiSleep Church',
                version: '1.0.0',
                port: 8888,
                environment: 'development',
                debug: false
            },
            database: {
                type: 'json',
                path: './data',
                backupEnabled: true,
                backupInterval: 3600000, // 1 hour
                maxLockTimeout: 5000,
                maxRetries: 3
            },
            server: {
                cors: {
                    enabled: true,
                    origins: ['http://localhost:8888', 'http://127.0.0.1:8888']
                },
                rateLimit: {
                    enabled: true,
                    windowMs: 900000, // 15 minutes
                    max: 100 // requests per window
                },
                compression: {
                    enabled: true,
                    level: 6
                }
            },
            lmstudio: {
                model: 'llama-3.2-3b-claude-3.7-sonnet-reasoning-distilled@q4_0',
                baseUrl: 'http://192.168.0.69:7777',
                apiPath: '/v1/chat/completions',
                maxTokens: 2000,
                temperature: 0.7,
                timeout: 30000,
                enabled: true
            },
            mcp: {
                protocolVersion: '2024-11-05',
                enabled: true,
                capabilities: {
                    tools: true,
                    resources: true,
                    prompts: true,
                    sampling: true
                },
                maxConcurrentTools: 5,
                a2aEnabled: true
            },
            agents: {
                discovery: {
                    enabled: true,
                    interval: 300000, // 5 minutes
                    maxConcurrentRequests: 3
                },
                feed: {
                    enabled: true,
                    validationStrict: false,
                    moderationEnabled: true
                },
                stats: {
                    enabled: true,
                    updateInterval: 60000, // 1 minute
                    retentionDays: 30
                }
            },
            errorTracking: {
                enabled: true,
                maxLogSize: 1000,
                persistToFile: true,
                realTimeEmission: true,
                logLevel: 'error'
            },
            features: {
                realTimeUpdates: true,
                contentValidation: true,
                userVoting: true,
                comments: true,
                contentCrawling: true,
                aiIntegration: true
            },
            security: {
                sessionSecret: 'bambi-sleep-secret-key',
                csrfProtection: false,
                helmet: {
                    enabled: true,
                    contentSecurityPolicy: false
                }
            },
            logging: {
                level: 'info',
                file: {
                    enabled: true,
                    path: './logs/app.log',
                    maxSize: '10MB',
                    maxFiles: 5
                },
                console: {
                    enabled: true,
                    colorize: true
                }
            }
        };
    }

    /**
     * Load environment variables with prefix
     */
    loadEnvironmentVariables() {
        const envMappings = {
            [`${this.envPrefix}PORT`]: 'app.port',
            [`${this.envPrefix}DEBUG`]: 'app.debug',
            [`${this.envPrefix}ENVIRONMENT`]: 'app.environment',
            [`${this.envPrefix}DB_PATH`]: 'database.path',
            [`${this.envPrefix}LM_MODEL`]: 'lmstudio.model',
            [`${this.envPrefix}LM_BASE_URL`]: 'lmstudio.baseUrl',
            [`${this.envPrefix}LM_MAX_TOKENS`]: 'lmstudio.maxTokens',
            [`${this.envPrefix}LM_TEMPERATURE`]: 'lmstudio.temperature',
            [`${this.envPrefix}LM_ENABLED`]: 'lmstudio.enabled',
            [`${this.envPrefix}MCP_ENABLED`]: 'mcp.enabled',
            [`${this.envPrefix}ERROR_TRACKING`]: 'errorTracking.enabled',
            [`${this.envPrefix}SESSION_SECRET`]: 'security.sessionSecret'
        };

        Object.entries(envMappings).forEach(([envVar, configPath]) => {
            const value = process.env[envVar];
            if (value !== undefined) {
                this.setNestedValue(this.config, configPath, this.parseValue(value));
            }
        });
    }

    /**
     * Parse environment variable value to appropriate type
     */
    parseValue(value) {
        // Boolean values
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;

        // Numeric values
        if (/^\d+$/.test(value)) return parseInt(value, 10);
        if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

        // String values
        return value;
    }

    /**
     * Set nested configuration value
     */
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
    }

    /**
     * Get nested configuration value
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Deep merge configuration objects
     */
    deepMerge(target, source) {
        const result = { ...target };

        Object.keys(source).forEach(key => {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        });

        return result;
    }

    /**
     * Get configuration value
     */
    get(path, defaultValue = null) {
        const value = this.getNestedValue(this.config, path);
        return value !== undefined ? value : defaultValue;
    }

    /**
     * Set configuration value
     */
    set(path, value) {
        this.setNestedValue(this.config, path, value);
    }

    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }

    /**
     * Get configuration section
     */
    getSection(section) {
        return this.config[section] || {};
    }

    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature) {
        return this.get(`features.${feature}`, false);
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return this.getSection('database');
    }

    /**
     * Get LMStudio configuration
     */
    getLMStudioConfig() {
        return this.getSection('lmstudio');
    }

    /**
     * Get MCP configuration
     */
    getMCPConfig() {
        return this.getSection('mcp');
    }

    /**
     * Get server configuration
     */
    getServerConfig() {
        return this.getSection('server');
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];

        // Validate required settings
        if (!this.get('app.port')) {
            errors.push('App port is required');
        }

        if (this.get('lmstudio.enabled') && !this.get('lmstudio.baseUrl')) {
            errors.push('LMStudio base URL is required when enabled');
        }

        if (this.get('mcp.enabled') && !this.get('lmstudio.enabled')) {
            console.warn('⚠️ MCP enabled but LMStudio is disabled - some features may not work');
        }

        // Validate port ranges
        const port = this.get('app.port');
        if (port < 1 || port > 65535) {
            errors.push('Port must be between 1 and 65535');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }

        console.log('✅ Configuration validation passed');
        return true;
    }

    /**
     * Reload configuration
     */
    reload() {
        console.log('🔄 Reloading configuration...');
        this.loadConfiguration();
        this.validate();
    }

    /**
     * Export configuration for debugging
     */
    export() {
        const exportConfig = { ...this.config };
        
        // Remove sensitive data
        if (exportConfig.security && exportConfig.security.sessionSecret) {
            exportConfig.security.sessionSecret = '[REDACTED]';
        }

        return exportConfig;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
}

// Export singleton instance
module.exports = ConfigManager.getInstance();
