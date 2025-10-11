// LMStudio Worker Manager - Interface to LMStudio worker thread
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import { log } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LMStudioManager {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.messageHandlers = new Map();
        this.messageId = 0;
    }

    // Initialize worker thread
    async initialize() {
        try {
            const workerPath = path.join(__dirname, '../../workers/lmstudio.js');
            this.worker = new Worker(workerPath);

            this.worker.on('message', (message) => {
                this.handleWorkerMessage(message);
            });

            this.worker.on('error', (error) => {
                log.error(`LMStudio worker error: ${error.message}`);
            });

            this.worker.on('exit', (code) => {
                if (code !== 0) {
                    log.error(`LMStudio worker stopped with exit code ${code}`);
                }
            });

            // Try to auto-load model
            this.sendMessage({ type: 'auto_load_model' });

            this.isInitialized = true;
            log.success('LMStudio worker initialized');
            return true;
        } catch (error) {
            log.error(`Failed to initialize LMStudio worker: ${error.message}`);
            return false;
        }
    }

    // Send message to worker
    sendMessage(message) {
        if (!this.worker || !this.isInitialized) {
            log.error('LMStudio worker not initialized');
            return null;
        }

        const messageId = ++this.messageId;
        message.messageId = messageId;

        this.worker.postMessage(message);
        return messageId;
    }

    // Send chat message to worker
    async sendChat(prompt, socketId, username) {
        return new Promise((resolve, reject) => {
            const messageId = this.sendMessage({
                type: 'chat',
                prompt,
                socketId,
                username
            });

            if (messageId) {
                // Set up response handler
                this.messageHandlers.set(messageId, { resolve, reject });

                // Timeout after 60 seconds
                setTimeout(() => {
                    if (this.messageHandlers.has(messageId)) {
                        this.messageHandlers.delete(messageId);
                        reject(new Error('Chat request timeout'));
                    }
                }, 60000);
            } else {
                reject(new Error('Failed to send chat message'));
            }
        });
    }

    // Handle messages from worker
    handleWorkerMessage(message) {
        switch (message.type) {
            case 'response':
                // Handle chat response - emit to socket or callback
                this.onChatResponse?.(message);
                break;

            case 'model_loaded':
                log.success(`Model loaded: ${message.modelId}`);
                break;

            case 'error':
                log.error(`Worker error: ${message.error}`);
                break;

            case 'health_response':
                log.info(`Worker health: ${message.healthy ? 'OK' : 'NOT OK'}, Sessions: ${message.sessionCount}`);
                break;

            default:
                console.log('Unknown worker message:', message);
        }

        // Handle specific message responses
        if (message.messageId && this.messageHandlers.has(message.messageId)) {
            const handler = this.messageHandlers.get(message.messageId);
            this.messageHandlers.delete(message.messageId);

            if (message.type === 'error') {
                handler.reject(new Error(message.error));
            } else {
                handler.resolve(message);
            }
        }
    }

    // Set chat response callback
    setChatResponseHandler(callback) {
        this.onChatResponse = callback;
    }

    // Check worker health
    checkHealth() {
        this.sendMessage({ type: 'health' });
    }

    // Check if model is loaded
    async checkModel() {
        return new Promise((resolve) => {
            if (!this.worker || !this.isInitialized) {
                resolve(false);
                return;
            }

            // For now, assume model is loaded if worker is running
            // This could be enhanced to actually check model status
            resolve(this.isInitialized);
        });
    }

    // Auto-load model
    autoLoadModel() {
        this.sendMessage({ type: 'auto_load_model' });
    }

    // Cleanup
    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.isInitialized = false;
            log.info('LMStudio worker terminated');
        }
    }
}
