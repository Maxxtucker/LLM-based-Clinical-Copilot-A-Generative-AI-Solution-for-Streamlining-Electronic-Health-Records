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
    
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

module.exports = { generateAIResponse };
