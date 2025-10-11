// workers/lmstudio.js - LM Studio Worker for BambiSleep Church
import { parentPort } from 'worker_threads';
import { LMStudioClient } from '@lmstudio/sdk';
import { config } from '../utils/config.js';

// LM Studio configuration
let TARGET_MODEL_NAME, currentModel = null;
let LMS_TIMEOUT, SESSION_TIMEOUT;
let MAX_COMPLETION_TOKENS;

// Session management
const sessionHistories = {};
let lmStudioClient = null;

// Initialize configuration
function initializeConfig() {
    TARGET_MODEL_NAME = config.lmstudio.model;
    LMS_TIMEOUT = config.lmstudio.timeout;
    SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    MAX_COMPLETION_TOKENS = config.lmstudio.maxTokens;

    // Initialize LMStudio SDK client with proper WebSocket URL
    let lmStudioBaseUrl = config.lmstudio.url.replace('/v1/chat/completions', '').replace('/v1', '');

    // Convert HTTP URL to WebSocket URL for LMStudio SDK
    if (lmStudioBaseUrl.startsWith('http://')) {
        lmStudioBaseUrl = lmStudioBaseUrl.replace('http://', 'ws://');
    } else if (lmStudioBaseUrl.startsWith('https://')) {
        lmStudioBaseUrl = lmStudioBaseUrl.replace('https://', 'wss://');
    }

    lmStudioClient = new LMStudioClient({
        baseUrl: lmStudioBaseUrl
    });

    console.log('LM Studio SDK initialized');
    console.log('LM Studio WebSocket URL:', lmStudioBaseUrl);
    console.log('Target model:', TARGET_MODEL_NAME);
    console.log('Timeout:', LMS_TIMEOUT, 'ms');
}

// Worker message handling
if (parentPort) {
    parentPort.on('message', async (msg) => {
        try {
            switch (msg.type) {
                case 'chat':
                    await handleMessage(msg.prompt, msg.socketId, msg.username);
                    break;

                case 'auto_load_model':
                    await autoLoadBestModel();
                    break;

                case 'health':
                    parentPort.postMessage({
                        type: 'health_response',
                        healthy: true,
                        sessionCount: Object.keys(sessionHistories).length
                    });
                    break;

                default:
                    console.warn(`Unknown message type: ${msg.type}`);
            }
        } catch (error) {
            console.error('Worker error:', error);
            parentPort.postMessage({
                type: 'error',
                error: error.message,
                socketId: msg.socketId
            });
        }
    });
}

// Auto-load target model using native SDK
async function autoLoadBestModel() {
    try {
        console.log(`Loading target model: ${TARGET_MODEL_NAME}`);

        // Use LMStudio SDK to load the model
        currentModel = await lmStudioClient.llm.model(TARGET_MODEL_NAME);

        console.log(`Successfully loaded model: ${TARGET_MODEL_NAME}`);

        // Notify main thread
        if (parentPort) {
            parentPort.postMessage({
                type: 'model_loaded',
                modelId: TARGET_MODEL_NAME
            });
        }
        return true;

    } catch (error) {
        console.error('Auto-load model error:', error.message);

        // Try common variants of the model name
        const variants = [
            TARGET_MODEL_NAME.split('-').slice(0, 3).join('-'), // llama-3.2-8x3b
            TARGET_MODEL_NAME.split('-').slice(0, 2).join('-'), // llama-3.2
            'llama-3.2-1b-instruct', // Fallback model
            'llama-3.1-8b-instruct'  // Another fallback
        ];

        for (const variant of variants) {
            try {
                console.log(`Trying variant: ${variant}`);
                currentModel = await lmStudioClient.llm.model(variant);
                console.log(`Successfully loaded variant: ${variant}`);

                if (parentPort) {
                    parentPort.postMessage({
                        type: 'model_loaded',
                        modelId: variant
                    });
                }
                return true;
            } catch (variantError) {
                console.log(`Failed variant ${variant}: ${variantError.message}`);
            }
        }

        return false;
    }
}

// Check if model is currently loaded using SDK
async function getCurrentLoadedModel() {
    try {
        if (currentModel) {
            console.log(`Model already loaded in memory`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking loaded model:', error.message);
        return false;
    }
}

// Auto-detect and load model on startup
async function initializeModelSystem() {
    try {
        // Check if a model is already loaded
        const isLoaded = await getCurrentLoadedModel();

        if (isLoaded) {
            console.log(`Target model already loaded in memory`);
            return;
        }

        // Auto-load the target model
        const loaded = await autoLoadBestModel();
        if (!loaded) {
            console.error('CRITICAL: Failed to auto-load any model during initialization');
        }
    } catch (error) {
        console.error('Model initialization error:', error.message);
    }
}

// Handle chat messages using LMStudio SDK
async function handleMessage(userPrompt, socketId, username) {
    try {
        // Validate input
        if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
            console.warn(`Invalid prompt from ${username}`);
            sendResponse("Sorry, I couldn't understand your message. Please try again.", socketId, username);
            return;
        }

        // Auto-load model if none is currently loaded
        if (!currentModel) {
            console.log('No model loaded, attempting auto-load...');

            const loaded = await autoLoadBestModel();

            if (!loaded) {
                console.error('CRITICAL: Auto-load failed during chat request');
                sendResponse("Sorry, I'm having trouble loading the AI model. Please ensure LM Studio is running.", socketId, username);
                return;
            }
        }

        // Initialize session if needed
        if (!sessionHistories[socketId]) {
            sessionHistories[socketId] = [];
            sessionHistories[socketId].metadata = {
                createdAt: Date.now(),
                lastActivity: Date.now(),
                username
            };
        }

        // Update session activity
        sessionHistories[socketId].metadata.lastActivity = Date.now();
        sessionHistories[socketId].metadata.username = username;

        // Create conversation context with system message
        const systemMessage = `You are an AI assistant helping ${username} with BambiSleep related questions and content.`;

        // Build full conversation for context
        let conversation = systemMessage + '\n\n';

        // Add recent conversation history (keep last 5 exchanges)
        const recentHistory = sessionHistories[socketId].slice(-10);
        for (const msg of recentHistory) {
            if (msg.role === 'user') conversation += `User: ${msg.content}\n`;
            if (msg.role === 'assistant') conversation += `Assistant: ${msg.content}\n`;
        }

        conversation += `\nUser: ${userPrompt}\nAssistant:`;

        console.log(`Sending prompt to model via SDK`);

        // Use LMStudio SDK for response
        const result = await currentModel.respond(conversation, {
            maxTokens: MAX_COMPLETION_TOKENS,
            temperature: config.lmstudio.temperature
        });

        const finalContent = result.content;

        // Add both messages to session history
        sessionHistories[socketId].push({
            role: 'user',
            content: userPrompt
        });

        sessionHistories[socketId].push({
            role: 'assistant',
            content: finalContent
        });

        sendResponse(finalContent, socketId, username);

    } catch (error) {
        console.error(`Error in handleMessage: ${error.message}`);

        if (error.message.includes('not loaded') || error.message.includes('model')) {
            console.error('Model loading issue detected');
            sendResponse("Sorry, I'm having trouble with the AI model. Let me try to reload it...", socketId, username);

            // Try to reload model
            try {
                await autoLoadBestModel();
                sendResponse("Model reloaded! Please try your question again.", socketId, username);
            } catch (reloadError) {
                sendResponse("Sorry, I couldn't reload the model. Please ensure LM Studio is running.", socketId, username);
            }
        } else {
            sendResponse("Sorry, I encountered an error. Please try again.", socketId, username);
        }
    }
}

// Send response back to main thread
function sendResponse(response, socketId, username) {
    if (parentPort) {
        parentPort.postMessage({
            type: 'response',
            response,
            socketId,
            username
        });
    }
}

// Helper function to estimate token count
function estimateTokenCount(messages) {
    if (!Array.isArray(messages)) return 0;

    let totalTokens = 0;
    for (const message of messages) {
        if (message.content) {
            const words = message.content.trim().split(/\s+/).length;
            totalTokens += Math.ceil(words * 0.75); // Rough estimate
        }
    }
    return totalTokens;
}

// Helper function to trim context window
function trimContextWindow(messages, maxTokens) {
    if (!Array.isArray(messages) || messages.length === 0) return [];

    // Always keep system message (first message)
    const systemMessage = messages[0];
    const conversationMessages = messages.slice(1);

    // Start with system message
    let trimmedMessages = [systemMessage];
    let currentTokens = estimateTokenCount([systemMessage]);

    // Add messages from most recent backwards until we hit the limit
    for (let i = conversationMessages.length - 1; i >= 0; i--) {
        const message = conversationMessages[i];
        const messageTokens = estimateTokenCount([message]);

        if (currentTokens + messageTokens <= maxTokens) {
            trimmedMessages.splice(1, 0, message); // Insert after system message
            currentTokens += messageTokens;
        } else {
            break;
        }
    }

    return trimmedMessages;
}

// Garbage collection for session management
function collectGarbage() {
    const now = Date.now();
    let removed = 0;

    Object.keys(sessionHistories).forEach(socketId => {
        const session = sessionHistories[socketId];
        if (session.metadata && (now - session.metadata.lastActivity) > SESSION_TIMEOUT) {
            delete sessionHistories[socketId];
            removed++;
        }
    });

    if (removed > 0) {
        console.log(`Garbage collected ${removed} idle sessions`);
    }
}

// Run garbage collection every 5 minutes
setInterval(collectGarbage, 5 * 60 * 1000);

// Initialize everything on startup
(async () => {
    await initializeConfig();
    await initializeModelSystem();
    console.log('LM Studio worker started and ready');
})();

export { handleMessage };
