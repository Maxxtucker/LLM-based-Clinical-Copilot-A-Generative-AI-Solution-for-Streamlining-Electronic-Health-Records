require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

/**
 * Generate AI response using OpenAI
 */
async function generateAIResponse(prompt, systemMessage = 'You are a helpful AI assistant.') {
  try {
    console.log('Using GPT-4o-mini for AI response generation');
    
    // Check if this is a multi-patient query that requires tables
    // Extract user query from prompt (look for "Clinical Query:" or similar patterns)
    const promptLower = typeof prompt === 'string' ? prompt.toLowerCase() : '';
    const systemMessageLower = typeof systemMessage === 'string' ? systemMessage.toLowerCase() : '';
    
    // Look for query indicators in the prompt
    const requiresTable = promptLower.includes('🚨🚨🚨 critical: this query requires a table') ||
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
                         (promptLower.includes('treatments') && (promptLower.includes('worked') || promptLower.includes('successful'))) ||
                         promptLower.includes('outcomes') ||
                         promptLower.includes('elderly patients') ||
                         promptLower.includes('heart conditions');
    
    // Lower temperature for table generation to be more deterministic
    // Higher max_tokens for tables which can be longer
    const temperature = requiresTable ? 0.3 : 0.7;
    const maxTokens = requiresTable ? 3000 : 2000;
    
    console.log(`Table required: ${requiresTable}, Temperature: ${temperature}, Max tokens: ${maxTokens}`);
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

module.exports = { generateAIResponse };
