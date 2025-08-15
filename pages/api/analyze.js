import PROMPTS from '../../prompts.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident } = req.body;

    if (!incident) {
      return res.status(400).json({ error: 'No incident data provided' });
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
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
        messages: [{ role: "user", content: fullPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Anthropic API');
    }

    const responseText = data.content[0].text;
    let analysis;

    try {
      // Try to parse the JSON response
      analysis = JSON.parse(responseText);
      
      // Ensure required fields exist
      if (!analysis.threatLevel) analysis.threatLevel = "MEDIUM";
      if (!analysis.researchFindings) analysis.researchFindings = [];
      if (!analysis.riskScore) analysis.riskScore = 50;
      if (!analysis.immediateAction) analysis.immediateAction = "Review and assess";
      if (!analysis.redFlags) analysis.redFlags = [];
      if (!analysis.explanation) analysis.explanation = "Analysis completed";
      if (!analysis.nextSteps) analysis.nextSteps = ["Follow security protocols"];
      
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('JSON parsing failed:', parseError);
      analysis = {
        threatLevel: "MEDIUM",
        incidentType: "Social Engineering Analysis", 
        riskScore: 60,
        immediateAction: "Review the analysis and report to IT security",
        redFlags: ["Analysis completed"],
        researchFindings: ["Unable to complete research due to parsing error"],
        explanation: responseText,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Follow company security procedures", 
          "Do not interact with suspicious content"
        ]
      };
    }

    return res.status(200).json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return a fallback response instead of just an error
    const fallbackAnalysis = {
      threatLevel: "UNKNOWN",
      incidentType: "Analysis Error",
      riskScore: 50,
      immediateAction: "Manual review required",
      redFlags: ["System error occurred"],
      researchFindings: ["Analysis could not be completed"],
      explanation: `Analysis failed: ${error.message}`,
      nextSteps: [
        "Try again in a few moments",
        "If the issue persists, contact technical support",
        "Exercise caution with the suspicious content"
      ]
    };

    return res.status(500).json(fallbackAnalysis);
  }
}