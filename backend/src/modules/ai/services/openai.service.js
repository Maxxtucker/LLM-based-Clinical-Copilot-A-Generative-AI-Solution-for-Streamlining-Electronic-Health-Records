require('dotenv').config();
const OpenAI = require('openai');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { BufferMemory } = require('langchain/memory');
const { LLMChain } = require('langchain/chains');
const { ChatPromptTemplate, MessagesPlaceholder } = require('langchain/prompts');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const conversationStore = new Map();
const SESSION_TTL_MS = 1000 * 60 * 30; // 30 minutes of inactivity per conversation

function pruneExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of conversationStore.entries()) {
    if (now - session.lastUsed > SESSION_TTL_MS) {
      conversationStore.delete(id);
    }
  }
}

const cleanupInterval = setInterval(pruneExpiredSessions, 5 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();

function getConversationMemory(conversationId) {
  if (!conversationId) return null;

  const key = String(conversationId);
  const now = Date.now();
  const existing = conversationStore.get(key);

  if (existing) {
    existing.lastUsed = now;
    return existing.memory;
  }

  const memory = new BufferMemory({
    memoryKey: 'history',
    returnMessages: true,
  });

  conversationStore.set(key, {
    memory,
    lastUsed: now,
  });

  return memory;
}

function analyzePromptForFormatting(prompt = '', systemMessage = '') {
  const promptLower = typeof prompt === 'string' ? prompt.toLowerCase() : '';
  const systemMessageLower = typeof systemMessage === 'string' ? systemMessage.toLowerCase() : '';
  const requiresTable =
    promptLower.includes('🚨🚨🚨 critical: this query requires a table') ||
    promptLower.includes('you must respond with a markdown table') ||
    promptLower.includes('show') ||
    promptLower.includes('list') ||
    promptLower.includes('find') ||
    promptLower.includes('compare') ||
    promptLower.includes('similar') ||
    promptLower.includes('pattern') ||
    promptLower.includes('patients with') ||
    promptLower.includes('patients who') ||
    promptLower.includes('patients having') ||
    promptLower.includes('which patients') ||
    promptLower.includes('what patients') ||
    (promptLower.includes('analyze') && promptLower.includes('treatment')) ||
    (promptLower.includes('treatments') &&
      (promptLower.includes('worked') || promptLower.includes('successful'))) ||
    promptLower.includes('outcomes') ||
    promptLower.includes('elderly patients') ||
    promptLower.includes('heart conditions') ||
    systemMessageLower.includes('🚨🚨🚨 critical: table formatting requirements');

  return {
    requiresTable,
    temperature: requiresTable ? 0.3 : 0.7,
    maxTokens: requiresTable ? 3000 : 2000,
  };
}

function normalizeLangChainResponse(result) {
  if (!result) return null;
  if (typeof result === 'string') return result;
  if (typeof result.text === 'string') return result.text;
  if (typeof result.response === 'string') return result.response;
  return null;
}

async function generateWithLangChain({
  prompt,
  systemMessage,
  temperature,
  maxTokens,
  conversationId,
}) {
  const memory = getConversationMemory(conversationId);
  if (!memory) {
    throw new Error('Conversation memory not available');
  }

  const chatModel = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature,
    maxTokens,
  });

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ['system', systemMessage || 'You are a helpful AI assistant.'],
    new MessagesPlaceholder('history'),
    ['human', '{input}'],
  ]);

  const chain = new LLMChain({
    llm: chatModel,
    prompt: promptTemplate,
    memory,
  });

  const response = await chain.call({ input: prompt });
  const text = normalizeLangChainResponse(response);

  if (!text) {
    throw new Error('LangChain response did not include text');
  }

  return text;
}

async function generateStatelessResponse({ prompt, systemMessage, temperature, maxTokens }) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemMessage || 'You are a helpful AI assistant.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens,
    temperature,
  });

  return response.choices[0].message.content;
}

/**
 * Generate AI response using OpenAI + LangChain memory (when conversationId present)
 */
async function generateAIResponse(
  prompt,
  systemMessage = 'You are a helpful AI assistant.',
  conversationId = null
) {
  try {
    console.log('Using GPT-4o-mini for AI response generation');

    const { requiresTable, temperature, maxTokens } = analyzePromptForFormatting(
      prompt,
      systemMessage
    );

    console.log(`Table required: ${requiresTable}, Temperature: ${temperature}, Max tokens: ${maxTokens}`);

    if (conversationId) {
      try {
        return await generateWithLangChain({
          prompt,
          systemMessage,
          temperature,
          maxTokens,
          conversationId,
        });
      } catch (langChainError) {
        console.error('LangChain conversation pipeline failed, falling back to stateless call:', langChainError);
      }
    }

    return await generateStatelessResponse({
      prompt,
      systemMessage,
      temperature,
      maxTokens,
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

module.exports = { generateAIResponse };
