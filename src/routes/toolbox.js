/**
 * Toolbox API Routes - Example route module
 */

import express from 'express';
import { toolbox } from '../toolbox/index.js';

const router = express.Router();

// Get available tools
router.get('/toolbox/tools', (req, res) => {
    try {
        const tools = toolbox.getAllToolsInfo();
        res.json({
            success: true,
            tools: tools,
            count: tools.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Execute tool method
router.post('/toolbox/execute', async (req, res) => {
    try {
        const { tool, method, params } = req.body;
        
        if (!tool || !method) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: tool, method'
            });
        }

        const result = await toolbox.execute(tool, method, params);
        
        res.json({
            success: true,
            result: result,
            tool: tool,
            method: method
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            tool: req.body.tool,
            method: req.body.method
        });
    }
});

// Health check
router.get('/toolbox/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tools: toolbox.getAvailableTools()
    });
});

// Get tool info
router.get('/toolbox/tools/:toolName', (req, res) => {
    try {
        const { toolName } = req.params;
        const toolInfo = toolbox.getToolInfo(toolName);
        
        if (!toolInfo) {
            return res.status(404).json({
                success: false,
                error: `Tool '${toolName}' not found`
            });
        }

        res.json({
            success: true,
            tool: toolInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
