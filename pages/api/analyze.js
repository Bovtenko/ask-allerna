// pages/api/analyze.js - Updated with AI Highlighting Support

export default async function handler(req, res) {
  console.log('[API] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('[API] Error: Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident, analysisType = 'basic', basicResults = null } = req.body;
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
    
    let fullPrompt;
    let model;
    let maxTokens;
    let tools = [];
    
    if (analysisType === 'highlight') {
      // AI HIGHLIGHTING - Haiku 3.5 for speed and cost efficiency
      model = "claude-3-5-haiku-20241022";
      maxTokens = 500; // Increased from 200 to handle longer highlighting responses
      
      fullPrompt = `Analyze this text for security threats and identify spans to highlight with their threat levels.

Text: "${incident}"

Identify and categorize text spans by threat level:
- high_risk: URLs, phone numbers, financial amounts, crypto, wire transfers
- medium_risk: urgency words, verification requests, personal info requests  
- suspicious: messaging apps (WhatsApp/Telegram), job offers, prizes, authority impersonation
- organization: legitimate company/brand names

IMPORTANT: Return a valid JSON with maximum 8 highlights to stay within token limits.

Return ONLY this JSON format:
{
  "highlights": [
    {"start": 0, "end": 10, "type": "high_risk", "text": "example text"}
  ]
}`;

    } else if (analysisType === 'basic') {
      // BASIC ANALYSIS - Haiku 3.5 for cost efficiency
      model = "claude-3-5-haiku-20241022";
      maxTokens = 300;
      
      fullPrompt = `You are a cybersecurity educator analyzing this communication for learning purposes.

Communication: ${incident}

Provide educational analysis focusing on patterns users should recognize. Even if the communication seems legitimate, include educational red flags that users should watch for in similar situations.

Respond with ONLY this JSON (no other text):
{
  "whatWeObserved": "Factual description of communication elements",
  "redFlagsToConsider": ["Educational pattern 1", "Educational pattern 2", "Educational pattern 3"],
  "verificationSteps": ["Specific step 1", "Specific step 2", "Specific step 3"],
  "whyVerificationMatters": "Educational explanation of verification importance",
  "organizationSpecificGuidance": "Basic guidance about claimed organization",
  "analysisType": "basic",
  "upgradeAvailable": true
}`;

    } else if (analysisType === 'advanced') {
      // ADVANCED ANALYSIS - Sonnet 4 with web search
      model = "claude-sonnet-4-20250514";
      maxTokens = 800;
      tools = [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 5
      }];

      const basicContext = basicResults ? `
Previous basic analysis found:
- Observations: ${basicResults.whatWeObserved}
- Red flags: ${basicResults.redFlagsToConsider?.join(', ')}
` : '';

      fullPrompt = `You are a cybersecurity expert conducting detailed verification analysis.

${basicContext}

Communication: ${incident}

Use web search to:
1. Verify claimed organization's official contacts
2. Search for scam reports about this organization
3. Find current threat intelligence
4. Look for similar attack patterns

Respond with ONLY this JSON (no other text):
{
  "businessVerification": {
    "claimedOrganization": "Organization name",
    "officialContacts": ["Contact 1", "Contact 2"],
    "comparisonFindings": ["Finding 1", "Finding 2"],
    "officialAlerts": ["Alert 1", "Alert 2"]
  },
  "threatIntelligence": {
    "knownScamReports": ["Report 1", "Report 2"],
    "similarIncidents": ["Incident 1", "Incident 2"],
    "securityAdvisories": ["Advisory 1", "Advisory 2"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Trend 1", "Trend 2"],
    "recentCampaigns": ["Campaign 1", "Campaign 2"],
    "officialWarnings": ["Warning 1", "Warning 2"]
  },
  "analysisType": "advanced"
}`;
    }

    console.log('[API] Making request - Model:', model, 'Tokens:', maxTokens);
    
    const anthropicPayload = {
      model: model,
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ 
        role: "user", 
        content: fullPrompt 
      }]
    };

    if (tools.length > 0) {
      anthropicPayload.tools = tools;
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
      throw new Error(`Anthropic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Response received, parsing...');
    
    if (!data.content || !data.content[0]) {
      throw new Error('Invalid response format from Anthropic API');
    }

    let responseText = "";
    
    for (const content of data.content) {
      if (content.type === "text") {
        responseText += content.text;
      }
    }
    
    if (!responseText) {
      throw new Error('No text content found in Anthropic API response');
    }
    
    console.log('[API] Response length:', responseText.length);
    console.log('[API] Response preview:', responseText.substring(0, 200));
    
    let analysis;

    try {
      // Clean response
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to fix truncated JSON for highlighting responses
      if (analysisType === 'highlight' && !cleanedResponse.trim().endsWith('}')) {
        console.log('[API] Detected truncated JSON, attempting to fix...');
        // Find the last complete highlight entry
        const lastCompleteEntry = cleanedResponse.lastIndexOf('"},');
        if (lastCompleteEntry > -1) {
          cleanedResponse = cleanedResponse.substring(0, lastCompleteEntry + 2) + '\n  ]\n}';
        } else {
          // Fallback: close the JSON properly
          cleanedResponse = cleanedResponse + '\n  ]\n}';
        }
      }
      
      analysis = JSON.parse(cleanedResponse);
      console.log('[API] JSON parsed successfully for', analysisType);
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      console.log('[API] Full response:', responseText);
      
      // Fallback based on analysis type
      if (analysisType === 'highlight') {
        // Highlighting fallback - return empty highlights
        analysis = {
          highlights: []
        };
      } else if (analysisType === 'basic') {
        // Basic analysis fallback
        const hasWhatsApp = incident.toLowerCase().includes('whatsapp');
        const hasJobOffer = incident.toLowerCase().includes('job') || incident.toLowerCase().includes('work');
        const hasFinancialAmount = /\$\d+/.test(incident);
        
        analysis = {
          whatWeObserved: "Communication requires manual analysis due to parsing error",
          redFlagsToConsider: [
            hasWhatsApp ? "Communication via WhatsApp instead of official channels" : "Verify sender through official channels",
            hasJobOffer ? "Unsolicited job offer with limited verification" : "Unexpected communication pattern",
            hasFinancialAmount ? "Financial amounts mentioned without context" : "Exercise standard caution"
          ],
          verificationSteps: [
            "Contact organization through official website",
            "Verify sender through official channels",
            "Research organization independently"
          ],
          whyVerificationMatters: "Independent verification helps confirm legitimacy and protects against social engineering attacks.",
          organizationSpecificGuidance: "Check official company website for contact verification procedures.",
          analysisType: "basic",
          upgradeAvailable: true
        };
      } else {
        // Advanced analysis fallback
        analysis = {
          businessVerification: {
            claimedOrganization: "Manual verification required due to system error",
            officialContacts: ["Search official website for contact information"],
            comparisonFindings: ["Manual comparison needed"],
            officialAlerts: ["Check official sources for fraud warnings"]
          },
          threatIntelligence: {
            knownScamReports: ["Manual research recommended"],
            similarIncidents: ["Check fraud databases manually"],
            securityAdvisories: ["Review official security advisories"]
          },
          currentThreatLandscape: {
            industryTrends: ["Consult current security reports"],
            recentCampaigns: ["Check recent threat intelligence"],
            officialWarnings: ["Review government security alerts"]
          },
          analysisType: "advanced"
        };
      }
    }

    console.log('[API] Returning analysis for', analysisType);
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('[API] Analysis error:', error);
    
    return res.status(500).json({
      error: true,
      message: error.message,
      analysisType: req.body.analysisType || 'basic'
    });
  }
}