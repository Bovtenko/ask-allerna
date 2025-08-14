export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API failed with status: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (jsonError) {
      const threatLevel = responseText.toLowerCase().includes('critical') ? 'CRITICAL' :
                         responseText.toLowerCase().includes('high') ? 'HIGH' :
                         responseText.toLowerCase().includes('medium') ? 'MEDIUM' : 'LOW';
      
      analysis = {
        threatLevel: threatLevel,
        incidentType: "Social Engineering Analysis",
        riskScore: threatLevel === 'CRITICAL' ? 90 : 75,
        immediateAction: "Report to IT security immediately",
        redFlags: ["Analysis completed"],
        explanation: responseText,
        nextSteps: ["Report this incident to your IT security team immediately", "Follow company procedures"]
      };
    }
    
    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ 
      error: "Analysis failed",
      analysis: {
        threatLevel: "ERROR",
        incidentType: "System Error",
        riskScore: 0,
        immediateAction: "Try again",
        redFlags: ["System temporarily unavailable"],
        explanation: "Please try again in a moment.",
        nextSteps: ["Try again", "Contact support if issues persist"]
      }
    });
  }
}