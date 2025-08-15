const PROMPTS = require('../../prompts.js'); // Add this import

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident } = req.body; // Changed from 'prompt'

    if (!incident) {
      throw new Error("No incident data provided");
    }

    // Build the complete prompt from components
    const fullPrompt = [
      PROMPTS.analysis.base,
      PROMPTS.analysis.balanced,
      PROMPTS.research.instruction,
      PROMPTS.research.domains,
      PROMPTS.research.phoneNumbers, 
      PROMPTS.research.patterns,
      PROMPTS.research.currentThreats,
      PROMPTS.evidence.requirement,
      PROMPTS.evidence.legitimateCheck,
      `\nINCIDENT TO ANALYZE: ${incident}`,
      PROMPTS.analysis.withThreatIntel,
      PROMPTS.format.jsonOnly,
      `Respond with this exact JSON format:`,
      PROMPTS.format.structure,
      PROMPTS.format.safetyNote,
      `DO NOT output anything other than valid JSON. Your response must start with { and end with }.`
    ].join('\n\n');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: "user", content: fullPrompt }] // Use fullPrompt
      })
    });

    // ... rest of your code stays the same until the fallback analysis
    
    // In your catch block for JSON parsing, add researchFindings:
    analysis = {
      threatLevel: "MEDIUM",
      incidentType: "Social Engineering Analysis", 
      riskScore: 60,
      immediateAction: "Review the analysis and report to IT security",
      redFlags: ["Analysis completed"],
      researchFindings: ["Unable to complete research due to parsing error"], // Add this
      explanation: responseText,
      nextSteps: [
        "Report this incident to your IT security team or designated security personnel immediately",
        "Follow company security procedures", 
        "Do not interact with suspicious content"
      ]
    };

  } catch (error) {
    // ... rest stays the same
  }
}