export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      throw new Error("No prompt provided");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307", // Using Haiku - this definitely exists and is cheaper
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API Error: ${response.status}`, errorText);
      throw new Error(`Claude API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean up the response
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (jsonError) {
      // Fallback if Claude doesn't return perfect JSON
      analysis = {
        threatLevel: "MEDIUM",
        incidentType: "Social Engineering Analysis",
        riskScore: 60,
        immediateAction: "Review the analysis and report to IT security",
        redFlags: ["Analysis completed"],
        explanation: responseText,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Follow company security procedures",
          "Do not interact with suspicious content"
        ]
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
        immediateAction: "Try again or contact support",
        redFlags: ["System temporarily unavailable"],
        explanation: `Error: ${error.message}`,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Try submitting again",
          "Contact support if issues continue"
        ]
      }
    });
  }
}