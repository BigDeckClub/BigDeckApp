/**
 * LLM Factory
 * Creates LLM instances for different providers
 */

import { ChatGroq } from '@langchain/groq';
import { config } from './config.js';

/**
 * Create an LLM instance based on configured provider
 * @param {Object} options - LLM options (temperature, streaming, etc.)
 * @returns {Object} LLM instance
 */
export function createLLM(options = {}) {
  const provider = config.llm.provider;
  const temperature = options.temperature ?? config.llm[provider].temperature;
  const streaming = options.streaming ?? false;

  switch (provider) {
    case 'groq':
      return createGroqLLM({ temperature, streaming });
    
    case 'openai':
      return createOpenAILLM({ temperature, streaming });
    
    case 'anthropic':
      return createAnthropicLLM({ temperature, streaming });
    
    case 'ollama':
      return createOllamaLLM({ temperature, streaming });
    
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Create Groq LLM instance (default, free)
 */
export function createGroqLLM(options = {}) {
  const { temperature = 0.7, streaming = false } = options;

  if (!config.llm.groq.apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  return new ChatGroq({
    apiKey: config.llm.groq.apiKey,
    model: config.llm.groq.model,
    temperature,
    streaming,
  });
}

/**
 * Create OpenAI LLM instance (GPT-4o, GPT-4, etc.)
 */
export function createOpenAILLM(options = {}) {
  const { temperature = 0.7, streaming = false } = options;

  if (!config.llm.openai.apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Dynamic import to avoid requiring the package if not used
  return import('@langchain/openai').then(({ ChatOpenAI }) => {
    return new ChatOpenAI({
      apiKey: config.llm.openai.apiKey,
      model: config.llm.openai.model,
      temperature,
      streaming,
    });
  });
}

/**
 * Create Anthropic LLM instance (Claude 3.5 Sonnet, etc.)
 */
export function createAnthropicLLM(options = {}) {
  const { temperature = 0.7, streaming = false } = options;

  if (!config.llm.anthropic.apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Dynamic import to avoid requiring the package if not used
  return import('@langchain/anthropic').then(({ ChatAnthropic }) => {
    return new ChatAnthropic({
      apiKey: config.llm.anthropic.apiKey,
      model: config.llm.anthropic.model,
      temperature,
      streaming,
    });
  });
}

/**
 * Create Ollama LLM instance (local, free)
 */
export function createOllamaLLM(options = {}) {
  const { temperature = 0.7, streaming = false } = options;

  // Dynamic import to avoid requiring the package if not used
  return import('@langchain/ollama').then(({ ChatOllama }) => {
    return new ChatOllama({
      baseUrl: config.llm.ollama.baseUrl,
      model: config.llm.ollama.model,
      temperature,
      streaming,
    });
  });
}

/**
 * Get display name for current LLM provider
 */
export function getLLMDisplayName() {
  const provider = config.llm.provider;
  const model = config.llm[provider].model;
  
  const names = {
    groq: `Groq (${model})`,
    openai: `OpenAI (${model})`,
    anthropic: `Anthropic (${model})`,
    ollama: `Ollama (${model})`,
  };

  return names[provider] || `${provider} (${model})`;
}

export default createLLM;
