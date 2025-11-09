const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");
const { plan } = require("../services/promptPlanner");
const { generateAIResponse } = require("../services/openai.service");

/**
 * POST /api/ai/prompt
 * Accepts a user-written prompt and returns:
 *  - which pipeline to use (planId)
 *  - corresponding report data (if fetched)
 */
router.post("/prompt", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    // Determine which report pipeline fits the prompt
    const planId = plan(prompt);
    const base = `${req.protocol}://${req.get("host")}`;

    let data = null;
    let sourceUrl = "";

    // Route to correct internal report API
    if (planId === "weeklyVitals") {
      sourceUrl = `${base}/api/reports/trends/vitals?bucket=week`;
    } else if (planId === "cohortsVitals") {
      sourceUrl = `${base}/api/reports/cohorts/vitals`;
    } else {
      // Fallback (shouldn't happen, but safe to handle)
      sourceUrl = `${base}/api/reports/trends/vitals?bucket=week`;
    }

    // Fetch data from URL chosen
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      const msg = await response.text();
      console.error("Report fetch failed:", msg);
      return res.status(response.status).json({ error: "Failed to fetch report data" });
    }

    data = await response.json();

    // Send both plan and data to frontend
    res.json({
      planId,
      source: sourceUrl,
      data,
    });
  } catch (err) {
    console.error("Error in /api/ai/prompt:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/ai/generate
 * General AI endpoint for AI assistant
 */
router.post("/generate", async (req, res) => {
  try {
    const { prompt, systemMessage, conversationId } = req.body; //reads user text input (the question inputted)

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    console.log('🤖 Backend AI generating response for:', prompt.substring(0, 50) + '...');
    
    const text = await generateAIResponse(prompt, systemMessage, conversationId);

    res.json({ 
      text,
      success: true 
    }); //Send AI answer back to React app
  } catch (error) {
    console.error('Backend AI Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error.message 
    });
  }
});

module.exports = router;
