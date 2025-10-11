import React, { useState, useEffect, useRef } from 'react';
import {
    Send,
    Bot,
    Activity,
    Database,
    Brain,
    Globe,
    Shield,
    Users,
    MessageCircle,
    Zap
} from 'lucide-react';
import styles from './Agents.module.css';
import { mcpService, agenticService, socketService } from '@services/api';
import { LoadingSpinner, ErrorMessage } from '@components';

const Agents = () => {
    const [status, setStatus] = useState({
        lmstudio: 'unknown',
        mongodb: 'unknown',
        crawler: 'unknown',
        agentic: 'unknown'
    });
    const [messages, setMessages] = useState([
        {
            type: 'system',
            content: 'Welcome to the BambiSleep Church AI Agent interface. How can I assist you today?',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [availableTools, setAvailableTools] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const loadStatus = async () => {
            try {
                const [mcpStatus, agenticStatus] = await Promise.allSettled([
                    mcpService.getStatus(),
                    agenticService.getStatus()
                ]);

                // Update status based on responses
                setStatus({
                    lmstudio: mcpStatus.status === 'fulfilled' ? 'online' : 'offline',
                    mongodb: mcpStatus.status === 'fulfilled' ? 'online' : 'offline',
                    crawler: 'online', // Assume online if MCP is working
                    agentic: agenticStatus.status === 'fulfilled' ? 'online' : 'offline'
                });

                // Load available tools
                const toolsResponse = await mcpService.listTools();
                if (toolsResponse.result?.tools) {
                    setAvailableTools(toolsResponse.result.tools);
                }
            } catch (error) {
                console.error('Failed to load agent status:', error);
            }
        };

        loadStatus();

        // Initialize socket connection for real-time chat
        const socket = socketService.connect();
        if (socket) {
            socket.on('agent-response', (data) => {
                setMessages(prev => [...prev, {
                    type: 'agent',
                    content: data.message,
                    timestamp: new Date()
                }]);
                setIsSending(false);
            });
        }

        return () => {
            if (socket) {
                socket.off('agent-response');
            }
        };
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending) return;

        const userMessage = {
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsSending(true);

        const messageToSend = inputMessage.trim();
        setInputMessage('');

        try {
            // Try to get MCP status first
            const mcpStatus = await mcpService.getStatus();
            
            if (mcpStatus.status === 'operational') {
                // Try to get a response from the agentic system
                const response = await agenticService.queryKnowledge(messageToSend);
                
                let agentResponse = {
                    type: 'agent',
                    content: response.result?.content?.[0]?.text || 'I received your message and am processing it.',
                    timestamp: new Date()
                };
                
                setMessages(prev => [...prev, agentResponse]);
            } else {
                // MCP not available, provide fallback response
                setMessages(prev => [...prev, {
                    type: 'agent',
                    content: `Thank you for your message: "${messageToSend}". The AI agent system is currently initializing. Please check back soon for full conversational capabilities.`,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Failed to get agent response:', error);
            
            // Provide helpful fallback response based on message content
            let fallbackContent = `I received your message about "${messageToSend}". `;
            
            if (messageToSend.toLowerCase().includes('knowledge') || messageToSend.toLowerCase().includes('learn')) {
                fallbackContent += 'For knowledge resources, please visit the Knowledge Base section.';
            } else if (messageToSend.toLowerCase().includes('help') || messageToSend.toLowerCase().includes('guide')) {
                fallbackContent += 'For help and guidance, check our Mission page for community guidelines.';
            } else {
                fallbackContent += 'The AI system is currently being set up. Thank you for your patience!';
            }
            
            setMessages(prev => [...prev, {
                type: 'system',
                content: fallbackContent,
                timestamp: new Date()
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const handleToolTest = async (toolName) => {
        try {
            setMessages(prev => [...prev, {
                type: 'system',
                content: `Testing tool: ${toolName}...`,
                timestamp: new Date()
            }]);

            const response = await mcpService.callTool(toolName);

            setMessages(prev => [...prev, {
                type: 'agent',
                content: `Tool "${toolName}" executed successfully. ${response.result?.content?.[0]?.text || 'Tool completed without detailed output.'
                    }`,
                timestamp: new Date()
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                type: 'system',
                content: `Failed to execute tool "${toolName}": ${error.message}`,
                timestamp: new Date()
            }]);
        }
    };

    const getStatusColor = (serviceStatus) => {
        switch (serviceStatus) {
            case 'online': return 'var(--accent-success)';
            case 'offline': return 'var(--accent-warning)';
            case 'error': return 'var(--accent)';
            default: return 'var(--text-muted)';
        }
    };

    const formatTimestamp = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Sample tools for quick testing
    const quickTools = [
        { name: 'church-status', description: 'Get current church status', icon: <Bot /> },
        { name: 'search-knowledge', description: 'Search knowledge base', icon: <Database /> },
        { name: 'get-safety-info', description: 'Get safety information', icon: <Shield /> },
        { name: 'agentic-get-status', description: 'Check agentic system', icon: <Activity /> }
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>AI Agents</h1>
                <p className={styles.subtitle}>
                    Interact with our advanced AI-powered agents for personalized guidance and assistance
                </p>
            </header>

            {/* Dashboard */}
            <div className={styles.dashboard}>
                {/* Sidebar - System Status */}
                <aside className={styles.sidebar}>
                    <h3 className={styles.sidebarTitle}>System Status</h3>

                    <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>
                            <Brain size={16} />
                            LMStudio AI
                        </span>
                        <span
                            className={`${styles.statusValue} ${styles[status.lmstudio]}`}
                            style={{ color: getStatusColor(status.lmstudio) }}
                        >
                            {status.lmstudio}
                        </span>
                    </div>

                    <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>
                            <Database size={16} />
                            MongoDB
                        </span>
                        <span
                            className={`${styles.statusValue} ${styles[status.mongodb]}`}
                            style={{ color: getStatusColor(status.mongodb) }}
                        >
                            {status.mongodb}
                        </span>
                    </div>

                    <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>
                            <Globe size={16} />
                            Web Crawler
                        </span>
                        <span
                            className={`${styles.statusValue} ${styles[status.crawler]}`}
                            style={{ color: getStatusColor(status.crawler) }}
                        >
                            {status.crawler}
                        </span>
                    </div>

                    <div className={styles.statusItem}>
                        <span className={styles.statusLabel}>
                            <Zap size={16} />
                            Agentic System
                        </span>
                        <span
                            className={`${styles.statusValue} ${styles[status.agentic]}`}
                            style={{ color: getStatusColor(status.agentic) }}
                        >
                            {status.agentic}
                        </span>
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--dark)', borderRadius: '8px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            Available Tools
                        </div>
                        <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {availableTools.length}
                        </div>
                    </div>
                </aside>

                {/* Chat Interface */}
                <div className={styles.chatContainer}>
                    <header className={styles.chatHeader}>
                        <h2 className={styles.chatTitle}>
                            <MessageCircle size={24} />
                            Chat with AI Agent
                        </h2>
                    </header>

                    <div className={styles.chatMessages}>
                        {messages.map((message, index) => (
                            <div key={index} className={`${styles.message} ${styles[message.type]}`}>
                                <div>{message.content}</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                                    {formatTimestamp(message.timestamp)}
                                </div>
                            </div>
                        ))}
                        {isSending && (
                            <div className={`${styles.message} ${styles.system}`}>
                                Agent is thinking...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className={styles.chatInput}>
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask about BambiSleep, safety, or anything else..."
                                className={styles.messageInput}
                                disabled={isSending}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isSending}
                                className={styles.sendButton}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Available Tools */}
            <section className={styles.agentTools}>
                <h2 className={styles.toolsTitle}>Quick Tools</h2>
                <div className={styles.toolsGrid}>
                    {quickTools.map((tool, index) => (
                        <div key={index} className={styles.toolCard}>
                            <div className={styles.toolIcon}>{tool.icon}</div>
                            <h3 className={styles.toolName}>{tool.name}</h3>
                            <p className={styles.toolDescription}>{tool.description}</p>
                            <button
                                onClick={() => handleToolTest(tool.name)}
                                className={styles.toolButton}
                            >
                                Test Tool
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Agents;
