import PROMPTS from '../../prompts.js';

export default async function handler(req, res) {
  console.log('[API] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[API] Error: Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident } = req.body;
    console.log('[API] Incident length:', incident ? incident.length : 0);

    if (!incident) {
      console.log('[API] Error: No incident data provided');
      return res.status(400).json({ error: 'No incident data provided' });
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('[API] Error: API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('[API] Building prompt...');
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

    console.log('[API] Making request to Anthropic API with Claude 3.5 Sonnet...');
    
    const anthropicPayload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      temperature: 0.1,
      messages: [{ 
        role: "user", 
        content: fullPrompt 
      }]
    };

    console.log('[API] Payload prepared, sending request...');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(anthropicPayload)
    });

    console.log('[API] Anthropic response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[API] Anthropic error response:', errorText);
      throw new Error(`Anthropic API responded with status: ${response.status}. Error: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Response received, parsing...');
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.log('[API] Error: Invalid response format from Anthropic API', data);
      throw new Error('Invalid response format from Anthropic API');
    }

    const responseText = data.content[0].text;
    console.log('[API] Response text length:', responseText.length);
    
    let analysis;

    try {
      // Try to parse the JSON response
      analysis = JSON.parse(responseText);
      console.log('[API] JSON parsed successfully');
      
      // Ensure required fields exist with better defaults
      if (!analysis.whatWeObserved) analysis.whatWeObserved = "Analysis completed";
      if (!analysis.redFlagsToConsider) analysis.redFlagsToConsider = [];
      if (!analysis.verificationSteps) analysis.verificationSteps = [];
      if (!analysis.whyVerificationMatters) analysis.whyVerificationMatters = "Verification helps protect against social engineering";
      if (!analysis.organizationSpecificGuidance) analysis.organizationSpecificGuidance = "Follow your organization's security protocols";
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      console.log('[API] Raw response:', responseText);
      
      // Fallback if JSON parsing fails
      analysis = {
        whatWeObserved: "Analysis completed but formatting error occurred",
        redFlagsToConsider: ["System formatting error - manual review recommended"],
        verificationSteps: [
          "Contact your IT security team for manual analysis",
          "Follow standard verification procedures for suspicious communications"
        ],
        whyVerificationMatters: "When automated analysis encounters errors, human verification becomes even more critical for security.",
        organizationSpecificGuidance: `Analysis failed due to formatting error: ${parseError.message}. Raw response available for manual review.`
      };
    }

    console.log('[API] Returning successful analysis');
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('[API] Complete analysis error:', error);
    console.error('[API] Error stack:', error.stack);
    
    // Determine error type for better user messaging
    let errorType = "UNKNOWN_ERROR";
    let userMessage = "An unexpected error occurred";
    
    if (error.message.includes("API key")) {
      errorType = "API_KEY_ERROR";
      userMessage = "API configuration issue";
    } else if (error.message.includes("429")) {
      errorType = "RATE_LIMIT_ERROR";
      userMessage = "Service temporarily busy - please try again";
    } else if (error.message.includes("timeout")) {
      errorType = "TIMEOUT_ERROR";
      userMessage = "Request timed out - please try again";
    } else if (error.message.includes("network")) {
      errorType = "NETWORK_ERROR";
      userMessage = "Network connectivity issue";
    }

    // Return a comprehensive fallback response
    const fallbackAnalysis = {
      whatWeObserved: `System error occurred during analysis (${errorType})`,
      redFlagsToConsider: [
        "Automated analysis unavailable - manual review required",
        "Exercise extra caution with suspicious communications during system issues"
      ],
      verificationSteps: [
        "Report this incident to your IT security team immediately",
        "Use alternative verification methods (official phone numbers, in-person contact)",
        "Do not interact with suspicious content until verified",
        "Try the analysis again in a few minutes"
      ],
      whyVerificationMatters: "When automated security tools are unavailable, manual verification becomes critical. Your security team can provide guidance and alternative analysis methods.",
      organizationSpecificGuidance: `Technical error details: ${error.message}. Contact technical support if this persists. Error ID: ${errorType}-${Date.now()}`
    };

    console.log('[API] Returning fallback analysis due to error');
    
    // Also include the original error in the response for debugging
    const debugResponse = {
      ...fallbackAnalysis,
      debugInfo: {
        errorMessage: error.message,
        errorType: errorType,
        stack: error.stack?.substring(0, 500) // First 500 chars of stack trace
      }
    };
    
    return res.status(500).json(debugResponse);
  }
}