// QA System for BambiSleep knowledge agent with LMStudio integration
// This module provides question answering capabilities

import * as lmstudio from '../../lmstudio/client.js';

import knowledgeIndex from './knowledgeIndex.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'qa-system.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Log QA interactions for monitoring
 * @param {string} type The type of interaction
 * @param {object} data The data to log
 */
function logQA(type, data) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      ...data
    };
    
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to log QA interaction:', error.message);
  }
}

// Common BambiSleep questions and their templates
const QUESTION_TEMPLATES = {
  whatIs: {
    patterns: [
      /what is bambisleep/i,
      /who is bambi/i,
      /tell me about bambisleep/i
    ],
    template: "BambiSleep is {{whatIs}}. {{additional}}"
  },
  howWorks: {
    patterns: [
      /how does bambisleep work/i,
      /how does it do what it does/i,
      /what technique/i,
      /how does (it|bambisleep) function/i
    ],
    template: "BambiSleep works by {{howItWorks}}. {{additional}}"
  },
  audience: {
    patterns: [
      /who (is|are) the target audience/i,
      /who should listen/i,
      /who (is|are) bambis/i,
      /who is it for/i
    ],
    template: "BambiSleep is designed for {{targetAudience}}. {{additional}}"
  },
  benefits: {
    patterns: [
      /why (would|should) (someone|you|i) (want to )?listen/i,
      /what are the benefits/i,
      /what (is|are) the advantage/i
    ],
    template: "People listen to BambiSleep because {{benefits}}. {{additional}}"
  },
  risks: {
    patterns: [
      /why (would|should) (someone|you|i) not listen/i,
      /what are the risks/i,
      /is it dangerous/i,
      /what (is|are) the disadvantage/i
    ],
    template: "You should be cautious about BambiSleep if {{risks}}. {{additional}}"
  },
  requirements: {
    patterns: [
      /what (do|does) (someone|you|i) need/i,
      /how to listen/i,
      /what to do to listen/i,
      /what is required/i
    ],
    template: "To listen to BambiSleep, you need {{requirements}}. {{additional}}"
  }
};

/**
 * Find matching template for a question
 * @param {string} question Question to analyze
 * @returns {object|null} Matching template or null if no match
 */
function findMatchingTemplate(question) {
  const questionLower = question.toLowerCase();
  
  for (const [key, template] of Object.entries(QUESTION_TEMPLATES)) {
    for (const pattern of template.patterns) {
      if (pattern.test(questionLower)) {
        return {
          key,
          ...template
        };
      }
    }
  }
  
  return null;
}

/**
 * Format answer using template and information
 * @param {object} template Question template
 * @param {object} info Information to fill template
 * @param {object[]} sources Sources of information
 * @returns {string} Formatted answer
 */
function formatAnswer(template, info, sources) {
  let answer = template.template;
  
  // Replace template variables with actual information
  for (const [key, value] of Object.entries(info)) {
    if (value) {
      answer = answer.replace(`{{${key}}}`, value);
    } else {
      answer = answer.replace(`{{${key}}}`, '');
    }
  }
  
  // Add additional information from sources
  let additional = '';
  if (sources && sources.length > 0) {
    const bestSource = sources[0];
    if (bestSource.summary) {
      additional = bestSource.summary;
    }
  }
  
  // Add additional information
  answer = answer.replace('{{additional}}', additional);
  
  // Clean up any remaining template variables
  answer = answer.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up double spaces and periods
  answer = answer.replace(/\s+/g, ' ').replace(/\.\./g, '.').trim();
  
  return answer;
}

/**
 * Generate source citations
 * @param {object[]} sources Sources of information
 * @returns {string} Formatted citations
 */
function formatCitations(sources) {
  if (!sources || sources.length === 0) {
    return '';
  }
  
  return sources.map((source, index) => 
    `[${index + 1}] ${source.title} - ${source.url}`
  ).join('\n');
}

/**
 * Answer a question about BambiSleep with AI enhancement
 * @param {string} question Question to answer
 * @returns {Promise<object>} Answer object with text and sources
 */
export async function answerQuestion(question) {
  // Log the question
  logQA('question', { question });
  
  // Get information from knowledge index
  const answerInfo = knowledgeIndex.findAnswerInfo(question);
  
  // Try to use LMStudio for intelligent answering first
  let lmstudioAvailable = false;
  try {
    lmstudioAvailable = await lmstudio.isAvailable();
  } catch (error) {
    console.error('Error checking LMStudio availability:', error.message);
    logQA('lmstudio-check-error', { message: error.message });
  }
  
  if (lmstudioAvailable) {
    try {
      const startTime = Date.now();
      
      // Even if no specific sources are found, provide some general knowledge context
      const generalContext = [
        {
          title: "BambiSleep Overview",
          content: "BambiSleep is a hypnosis system using audio, visuals, and scripts to induce a trance state. It often focuses on themes of mental relaxation, transformation, and role-play. Always use responsibly and be aware of content warnings."
        }
      ];
      
      // Combine specific sources with general context
      const context = [...(answerInfo.sources || []), ...generalContext];
      
      const aiAnswer = await lmstudio.answerQuestion(question, context);
      const citations = formatCitations(answerInfo.sources);
      
      const responseTime = Date.now() - startTime;
      
      // Log the successful LMStudio response
      logQA('lmstudio-response', { 
        question, 
        responseTime, 
        sourceCount: answerInfo.sources?.length || 0,
        answerLength: aiAnswer.length 
      });
      
      return {
        question,
        answer: aiAnswer,
        citations,
        sources: answerInfo.sources || [],
        confidence: answerInfo.sources?.length > 0 ? 'high' : 'medium',
        enhanced: true,
        modelUsed: true
      };
    } catch (error) {
      console.error('LMStudio answering failed, falling back to templates:', error.message);
      logQA('lmstudio-error', { question, message: error.message });
    }
  } else {
    logQA('lmstudio-unavailable', { question });
  }
  
  // Fallback to template-based answering
  const template = findMatchingTemplate(question);
  
  // If we have a template and information, format structured answer
  if (template && answerInfo.information) {
    const answer = formatAnswer(template, answerInfo.information, answerInfo.sources);
    const citations = formatCitations(answerInfo.sources);
    
    logQA('template-answer', { 
      question, 
      template: template.key,
      sourceCount: answerInfo.sources?.length || 0
    });
    
    return {
      question,
      answer,
      citations,
      sources: answerInfo.sources || [],
      confidence: answerInfo.sources?.length > 0 ? 'high' : 'low',
      enhanced: false,
      modelUsed: false
    };
  }
  
  // If we don't have a template but have sources, return a generic answer
  if (answerInfo.sources && answerInfo.sources.length > 0) {
    const bestSource = answerInfo.sources[0];
    const answer = `Based on available information: ${bestSource.summary || bestSource.description || "This content appears to be related to BambiSleep."}`;
    const citations = formatCitations(answerInfo.sources);
    
    logQA('generic-answer', { 
      question, 
      sourceCount: answerInfo.sources.length
    });
    
    return {
      question,
      answer,
      citations,
      sources: answerInfo.sources,
      confidence: 'medium',
      enhanced: false,
      modelUsed: false
    };
  }
  
  // If we don't have any information, return a fallback answer
  logQA('fallback-answer', { question });
  
  return {
    question,
    answer: "I don't have enough information to answer that question about BambiSleep. You might want to check the official BambiSleep wiki for more information.",
    citations: '',
    sources: [],
    confidence: 'none',
    enhanced: false,
    modelUsed: false
  };
}

/**
 * Get suggestions for follow-up questions
 * @param {string} currentQuestion Current question
 * @returns {string[]} Array of suggested follow-up questions
 */
export function getSuggestedQuestions(currentQuestion) {
  const lowerQuestion = currentQuestion.toLowerCase();
  const suggestions = [];
  
  // General follow-up questions
  if (lowerQuestion.includes('what is') || lowerQuestion.includes('who is')) {
    suggestions.push("How does BambiSleep work?");
    suggestions.push("Who is the target audience for BambiSleep?");
  } 
  else if (lowerQuestion.includes('how does') || lowerQuestion.includes('how it works')) {
    suggestions.push("What is the target audience for BambiSleep?");
    suggestions.push("What do I need to listen to BambiSleep?");
  }
  else if (lowerQuestion.includes('audience') || lowerQuestion.includes('who should')) {
    suggestions.push("Why would someone want to listen to BambiSleep?");
    suggestions.push("Are there risks to listening to BambiSleep?");
  }
  else if (lowerQuestion.includes('why') && lowerQuestion.includes('listen')) {
    suggestions.push("Why would someone NOT want to listen to BambiSleep?");
    suggestions.push("What do I need to listen to BambiSleep?");
  }
  
  // Add some generally useful questions if we don't have enough
  if (suggestions.length < 3) {
    if (!lowerQuestion.includes('what is')) {
      suggestions.push("What is BambiSleep?");
    }
    if (!lowerQuestion.includes('risk') && !lowerQuestion.includes('not listen')) {
      suggestions.push("What are the risks of BambiSleep?");
    }
    if (!lowerQuestion.includes('need') && !lowerQuestion.includes('how to listen')) {
      suggestions.push("What do I need to listen to BambiSleep?");
    }
  }
  
  // Return up to 3 suggestions, removing any duplicates
  return [...new Set(suggestions)].slice(0, 3);
}

export default {
  answerQuestion,
  getSuggestedQuestions
};
