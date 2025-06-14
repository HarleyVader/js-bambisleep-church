// LM Studio API client for BambiSleep knowledge agent

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Log file for LMStudio API interactions
const logFile = path.join(logDir, 'lmstudio.log');

/**
 * Log interactions with LMStudio API
 * @param {string} type The type of interaction
 * @param {any} data The data to log
 */
function logInteraction(type, data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      ...data
    };
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to log LMStudio interaction:', error.message);
  }
}

// LMStudio configuration
const LMSTUDIO_CONFIG = {
  baseURL: process.env.LMSTUDIO_URL || 'http://localhost:1234/v1',
  apiKey: process.env.LMSTUDIO_API_KEY || '',
  timeout: parseInt(process.env.LMSTUDIO_TIMEOUT || '30000'),
  maxTokens: parseInt(process.env.LMSTUDIO_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.LMSTUDIO_TEMPERATURE || '0.7'),
  model: process.env.LMSTUDIO_MODEL || 'local-model',
  retries: parseInt(process.env.LMSTUDIO_RETRIES || '3'),
  retryDelay: parseInt(process.env.LMSTUDIO_RETRY_DELAY || '1000')
};

// Initialize axios instance for LMStudio API
const lmstudioClient = axios.create({
  baseURL: LMSTUDIO_CONFIG.baseURL,
  timeout: LMSTUDIO_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    ...(LMSTUDIO_CONFIG.apiKey && { 'Authorization': `Bearer ${LMSTUDIO_CONFIG.apiKey}` })
  }
});

/**
 * Send a completion request to LMStudio
 * @param {string} prompt The prompt to send
 * @param {object} options Optional parameters
 * @returns {Promise<string>} The model's response
 */
export async function complete(prompt, options = {}) {
  const startTime = Date.now();
  
  // Track retries
  let retries = 0;
  let lastError = null;
  
  // Log the request
  logInteraction('request', { 
    prompt: prompt.slice(0, 100) + (prompt.length > 100 ? '...' : ''),
    options
  });
  
  while (retries <= LMSTUDIO_CONFIG.retries) {
    try {
      const response = await lmstudioClient.post('/chat/completions', {
        messages: [
          { role: "system", content: "You are an AI assistant specialized in BambiSleep hypnosis content." },
          { role: "user", content: prompt }
        ],
        model: options.model || LMSTUDIO_CONFIG.model,
        max_tokens: options.maxTokens || LMSTUDIO_CONFIG.maxTokens,
        temperature: options.temperature || LMSTUDIO_CONFIG.temperature,
        stop: options.stop || undefined,
        stream: false
      });
      
      const responseText = response.data.choices[0].message.content.trim();
      
      // Log the successful response
      logInteraction('response', {
        duration: Date.now() - startTime,
        responseLength: responseText.length,
        responsePreview: responseText.slice(0, 100) + (responseText.length > 100 ? '...' : '')
      });
      
      return responseText;
    } catch (error) {
      lastError = error;
      retries++;
      
      // Log the error
      logInteraction('error', {
        message: error.message,
        code: error.code,
        retry: retries
      });
      
      // Wait before retrying
      if (retries <= LMSTUDIO_CONFIG.retries) {
        await new Promise(resolve => setTimeout(resolve, LMSTUDIO_CONFIG.retryDelay * retries));
      }
    }
  }
  
  // Log the final error
  logInteraction('error-final', {
    message: lastError.message,
    code: lastError.code,
    duration: Date.now() - startTime
  });
  
  console.error('LMStudio API error after retries:', lastError.message);
  return null;
}

/**
 * Analyze text content using LMStudio model
 * @param {string} text Text to analyze
 * @returns {Promise<object>} Analysis results
 */
export async function analyze(text) {
  const prompt = `Analyze this BambiSleep-related content and provide a JSON response with:
- summary: Brief summary (max 100 chars)
- category: One of [official, audio, videos, images, scripts, community]
- relevance: Score 1-10 for BambiSleep relevance
- keywords: Array of 3-5 relevant keywords
- adult_content: boolean indicating if content is adult/NSFW
- safety_rating: 1-10 where 1 is safest for general audiences, 10 is adults only

Content: "${text.slice(0, 1500)}"

Respond with ONLY a valid JSON object and no other text.`;

  try {
    const response = await complete(prompt, { maxTokens: 500, temperature: 0.3 });
    if (!response) {
      return { 
        summary: text.slice(0, 100), 
        category: 'community', 
        relevance: 5, 
        keywords: [],
        adult_content: false,
        safety_rating: 5
      };
    }

    // Extract JSON from response (in case model adds extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;

    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary || text.slice(0, 100),
      category: parsed.category || 'community',
      relevance: Math.max(1, Math.min(10, parsed.relevance || 5)),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      adult_content: parsed.adult_content === true,
      safety_rating: Math.max(1, Math.min(10, parsed.safety_rating || 5))
    };
  } catch (error) {
    console.error('Analysis parsing error:', error.message);
    logInteraction('parse-error', { message: error.message });
    return { 
      summary: text.slice(0, 100), 
      category: 'community', 
      relevance: 5, 
      keywords: [],
      adult_content: false,
      safety_rating: 5
    };
  }
}

/**
 * Answer BambiSleep questions using LMStudio model
 * @param {string} question The question to answer
 * @param {object[]} context Knowledge base context
 * @returns {Promise<string>} The answer
 */
export async function answerQuestion(question, context = []) {
  const contextText = context.map(item => 
    `Source: ${item.title}\n${item.content || item.description}`
  ).join('\n\n');

  const prompt = `You are a knowledgeable assistant about BambiSleep hypnosis content. Answer the following question based on the provided context. Be helpful, accurate, and include appropriate safety warnings when relevant.

For BambiSleep-related questions:
- Be factual and accurate based on the context provided
- Provide safety information when appropriate
- Acknowledge when information might be incomplete
- Never invent facts or information not present in the context
- If uncertain, state that clearly rather than guessing

Context:
${contextText.slice(0, 3000)}

Question: ${question}

Answer:`;

  try {
    const response = await complete(prompt, { maxTokens: 800, temperature: 0.6 });
    if (!response) {
      return "I'm sorry, I don't have enough information to answer that question accurately at the moment. Please try again later or ask a different question.";
    }
    return response;
  } catch (error) {
    console.error('Question answering error:', error.message);
    logInteraction('qa-error', { question, message: error.message });
    return "I'm sorry, I encountered an error while processing your question. Please try again later.";
  }
}

/**
 * Check if LMStudio API is available
 * @returns {Promise<boolean>} True if API is available
 */
export async function isAvailable() {
  try {
    const response = await lmstudioClient.get('/models');
    return response.status === 200;
  } catch (error) {
    console.error('LMStudio API check failed:', error.message);
    return false;
  }
}

/**
 * Get available models from LMStudio
 * @returns {Promise<string[]>} List of available model IDs
 */
export async function getAvailableModels() {
  try {
    const response = await lmstudioClient.get('/models');
    return response.data.data.map(model => model.id);
  } catch (error) {
    console.error('Failed to get LMStudio models:', error.message);
    return [];
  }
}
