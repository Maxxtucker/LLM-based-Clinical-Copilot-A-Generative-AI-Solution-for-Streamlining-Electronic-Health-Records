const { generateAIResponse } = require('../services/OpenAIService');

/**
 * Generate AI response using backend OpenAI service
 */
async function generateAIResponseEndpoint(req, res) {
  try {
    const { prompt, systemMessage } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Backend AI generating response for:', prompt.substring(0, 50) + '...');
    
    const response = await generateAIResponse(prompt, systemMessage);
    
    res.json({ 
      response,
      success: true 
    });
  } catch (error) {
    console.error('Backend AI Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error.message 
    });
  }
}

module.exports = { generateAIResponseEndpoint };
