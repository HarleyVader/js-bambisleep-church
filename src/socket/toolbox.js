/**
 * Toolbox Socket Handlers - Example socket module
 */

import { toolbox } from '../toolbox/index.js';

export default function toolboxSocketHandlers(io) {
    io.on('connection', (socket) => {
        
        // Handle tool execution via socket
        socket.on('toolbox:execute', async (data, callback) => {
            try {
                const { tool, method, params } = data;
                const result = await toolbox.execute(tool, method, params);
                
                if (callback && typeof callback === 'function') {
                    callback({
                        success: true,
                        result: result
                    });
                }

                // Broadcast updates for certain operations
                if (tool === 'linkManager' && ['addLink', 'voteLink'].includes(method)) {
                    socket.broadcast.emit('toolbox:linkUpdate', result);
                }

                if (tool === 'analytics' && method === 'trackEvent') {
                    socket.broadcast.emit('toolbox:analyticsUpdate', result);
                }

            } catch (error) {
                if (callback && typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            }
        });

        // Handle tool discovery
        socket.on('toolbox:getTools', (callback) => {
            try {
                const tools = toolbox.getAllToolsInfo();
                if (callback && typeof callback === 'function') {
                    callback({
                        success: true,
                        tools: tools
                    });
                }
            } catch (error) {
                if (callback && typeof callback === 'function') {
                    callback({
                        success: false,
                        error: error.message
                    });
                }
            }
        });

        // Handle real-time analytics
        socket.on('toolbox:trackSession', async (action) => {
            try {
                const analytics = toolbox.getTool('analytics');
                if (analytics) {
                    await analytics.trackSession({
                        userId: socket.id,
                        action: action
                    });
                }
            } catch (error) {
                console.warn('Error tracking session:', error.message);
            }
        });

        // Auto-track session start
        socket.emit('toolbox:sessionStart');
        
        // Track session end on disconnect
        socket.on('disconnect', async () => {
            try {
                const analytics = toolbox.getTool('analytics');
                if (analytics) {
                    await analytics.trackSession({
                        userId: socket.id,
                        action: 'end'
                    });
                }
            } catch (error) {
                console.warn('Error tracking session end:', error.message);
            }
        });
    });
}
