export default async function handler(req, res) {
  console.log("=== API CALL START ===");
  console.log("Method:", req.method);
  console.log("API Key exists:", !!process.env.ANTHROPIC_API_KEY);
  console.log("API Key length:", process.env.ANTHROPIC_API_KEY?.length);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    console.log("Prompt received:", !!prompt);
    console.log("Prompt length:", prompt?.length);

    if (!prompt) {
      throw new Error("No prompt provided");
    }

    console.log("Making request to Claude API...");
    
    const requestBody = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    };
    
    console.log("Request body prepared");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(requestBody)
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API Error Response:", errorText);
      throw new Error(`Claude API failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Claude response received successfully");
    
    let responseText = data.content[0].text;
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (jsonError) {
      console.log("JSON parse failed, using fallback");
      analysis = {
        threatLevel: "MEDIUM",
        incidentType: "Social Engineering Analysis",
        riskScore: 60,
        immediateAction: "Review the analysis and report to IT security",
        redFlags: ["Analysis completed"],
        explanation: responseText,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Follow company security procedures"
        ]
      };
    }
    
    console.log("=== API CALL SUCCESS ===");
    res.status(200).json({ analysis });
    
  } catch (error) {
    console.error("=== API CALL ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
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
          "Try again later"
        ]
      }
    });
  }
}