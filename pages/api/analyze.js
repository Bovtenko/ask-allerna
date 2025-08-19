import PROMPTS from '../../prompts.js';

export default async function handler(req, res) {
  console.log('[API] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[API] Error: Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident, analysisType = 'quick' } = req.body;
    console.log('[API] Incident length:', incident ? incident.length : 0);
    console.log('[API] Analysis type:', analysisType);

    if (!incident) {
      console.log('[API] Error: No incident data provided');
      return res.status(400).json({ error: 'No incident data provided' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('[API] Error: API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('[API] Building prompt for analysis type:', analysisType);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // OPTIMIZED: Reduced token limits and search counts
    let fullPrompt;
    let maxTokens;
    let maxSearches;
    
    if (analysisType === 'quick') {
      // Quick analysis - no web search, basic patterns only
      fullPrompt = [
        PROMPTS.analysis.base,
        `IMPORTANT CONTEXT: Today is ${currentDate}. Use this date for any temporal analysis.`,
        PROMPTS.analysis.balanced,
        `QUICK ANALYSIS MODE: Focus on immediate red flags and basic verification steps. Do NOT use web search tools. Base analysis on patterns and formatting only.`,
        `\nINCIDENT TO ANALYZE: ${incident}`,
        `Respond with this exact JSON format:`,
        `{
  "whatWeObserved": "Neutral, factual description of communication elements",
  "redFlagsToConsider": ["MANDATORY: 2-4 immediate pattern-based red flags", "Focus on obvious formatting/language issues"],
  "verificationSteps": ["Basic verification steps", "Official contact methods"],
  "whyVerificationMatters": "Brief explanation of verification importance",
  "organizationSpecificGuidance": "General guidance based on claimed organization"
}`,
        `DO NOT output anything other than valid JSON. Your response must start with { and end with }.`
      ].join('\n\n');
      maxTokens = 600; // REDUCED from 800
      maxSearches = 0;
      
    } else if (analysisType === 'business') {
      // OPTIMIZED: Business verification - focused searches only
      fullPrompt = [
        PROMPTS.analysis.base,
        `IMPORTANT CONTEXT: Today is ${currentDate}. Use this date for any temporal analysis.`,
        `BUSINESS VERIFICATION MODE: Use web search to verify the claimed organization's official contact methods. FOCUS on finding official website and contact info only.`,
        `SEARCH STRATEGY: 1) Official company website 2) Official contact page 3) Scam warnings about this company`,
        `\nINCIDENT TO ANALYZE: ${incident}`,
        `Focus specifically on business verification. Respond with this exact JSON format:`,
        `{
  "businessVerification": {
    "claimedOrganization": "Name of organization claimed",
    "officialContacts": ["Official contact methods found through web search"],
    "comparisonFindings": ["How claimed contacts compare to official ones"],
    "officialAlerts": ["Any scam warnings found about this organization"]
  }
}`,
        `DO NOT output anything other than valid JSON. Your response must start with { and end with }.`
      ].join('\n\n');
      maxTokens = 700; // REDUCED from 1000
      maxSearches = 3; // REDUCED from 5
      
    } else if (analysisType === 'threats') {
      // OPTIMIZED: Threat intelligence - targeted searches only
      fullPrompt = [
        PROMPTS.analysis.base,
        `IMPORTANT CONTEXT: Today is ${currentDate}. Use this date for any temporal analysis.`,
        `THREAT INTELLIGENCE MODE: Use web search to find scam reports and current threat trends. FOCUS on recent reports only.`,
        `SEARCH STRATEGY: 1) Recent scam reports 2) FTC/government warnings 3) Current threat trends`,
        `\nINCIDENT TO ANALYZE: ${incident}`,
        `Focus specifically on threat intelligence. Respond with this exact JSON format:`,
        `{
  "threatIntelligence": {
    "knownScamReports": ["Recent scam reports found through web search"],
    "similarIncidents": ["Similar attack patterns found"],
    "securityAdvisories": ["Official warnings found through research"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Current scam trends found through web search"],
    "recentCampaigns": ["Recent phishing campaigns found"],
    "officialWarnings": ["Recent security alerts found"]
  }
}`,
        `DO NOT output anything other than valid JSON. Your response must start with { and end with }.`
      ].join('\n\n');
      maxTokens = 700; // REDUCED from 1200
      maxSearches = 3; // REDUCED from 8
    }

    console.log('[API] Making request to Anthropic API...');
    
    const anthropicPayload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ 
        role: "user", 
        content: fullPrompt 
      }]
    };

    // Add web search tool only for business and threats analysis
    if (maxSearches > 0) {
      anthropicPayload.tools = [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": maxSearches
      }];
    }

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
    
    if (!data.content || !data.content[0]) {
      console.log('[API] Error: Invalid response format from Anthropic API', data);
      throw new Error('Invalid response format from Anthropic API');
    }

    let responseText = "";
    
    for (const content of data.content) {
      if (content.type === "text") {
        responseText += content.text;
      }
    }
    
    if (!responseText && data.content[0].text) {
      responseText = data.content[0].text;
    }
    
    if (!responseText) {
      console.log('[API] Error: No text content found in response', data);
      throw new Error('No text content found in Anthropic API response');
    }
    
    console.log('[API] Response text length:', responseText.length);
    
    let analysis;

    try {
      analysis = JSON.parse(responseText);
      console.log('[API] JSON parsed successfully for', analysisType);
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      
      // Fallback based on analysis type
      if (analysisType === 'quick') {
        analysis = {
          whatWeObserved: "Analysis completed but formatting error occurred",
          redFlagsToConsider: ["System formatting error - manual review recommended"],
          verificationSteps: ["Contact your IT security team for manual analysis"],
          whyVerificationMatters: "When automated analysis encounters errors, human verification becomes critical.",
          organizationSpecificGuidance: "Analysis failed due to formatting error."
        };
      } else if (analysisType === 'business') {
        analysis = {
          businessVerification: {
            claimedOrganization: "Could not determine",
            officialContacts: ["Business verification temporarily unavailable"],
            comparisonFindings: ["Manual verification recommended"],
            officialAlerts: ["Check official website directly"]
          }
        };
      } else if (analysisType === 'threats') {
        analysis = {
          threatIntelligence: {
            knownScamReports: ["Threat database temporarily unavailable"],
            similarIncidents: ["Manual threat research recommended"],
            securityAdvisories: ["Check official security advisories directly"]
          },
          currentThreatLandscape: {
            industryTrends: ["Current threat data temporarily unavailable"],
            recentCampaigns: ["Manual research recommended"],
            officialWarnings: ["Check security vendor websites directly"]
          }
        };
      }
    }

    console.log('[API] Returning successful analysis for', analysisType);
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('[API] Complete analysis error:', error);
    
    // Return type-specific fallback
    const fallbackAnalysis = {
      error: true,
      message: error.message,
      analysisType: req.body.analysisType || 'quick'
    };
    
    return res.status(500).json(fallbackAnalysis);
  }
}