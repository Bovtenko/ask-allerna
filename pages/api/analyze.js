export default async function handler(req, res) {
  console.log("=== TEST API CALL ===");
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple test response
  const analysis = {
    threatLevel: "LOW",
    incidentType: "Test - API Working!",
    riskScore: 25,
    immediateAction: "API test successful",
    redFlags: ["This is a test response"],
    explanation: "If you see this, your API endpoint is working correctly.",
    nextSteps: [
      "Report this incident to your IT security team or designated security personnel immediately",
      "API connection successful"
    ]
  };

  res.status(200).json({ analysis });
}