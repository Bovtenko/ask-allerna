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
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229", // Using stable model name
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API failed with status: ${response.status}`, errorText);
      throw new Error(`Claude API failed with status: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean up the response text
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      console.log("Raw response:", responseText);
      
      // Fallback analysis if JSON parsing fails
      const threatLevel = responseText.toLowerCase().includes('critical') ? 'CRITICAL' :
                         responseText.toLowerCase().includes('high') ? 'HIGH' :
                         responseText.toLowerCase().includes('medium') ? 'MEDIUM' : 'LOW';
      
      analysis = {
        threatLevel: threatLevel,
        incidentType: "Social Engineering Analysis",
        riskScore: threatLevel === 'CRITICAL' ? 90 : threatLevel === 'HIGH' ? 75 : 50,
        immediateAction: "Report to IT security immediately",
        redFlags: ["Analysis completed - review manually"],
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
        explanation: `Error: ${error.message}. Please try again or contact support if the problem persists.`,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Check your internet connection",
          "Try submitting again",
          "Contact support if issues continue"
        ]
      }
    });
  }
}