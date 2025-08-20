// pages/api/analyze.js - Clean API File (NO REACT CODE!)

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
      maxTokens = 500;
      
      fullPrompt = `Analyze this text for security threats and identify only the MOST IMPORTANT spans to highlight.

Text: "${incident}"

Rules:
- Only highlight 3-5 CRITICAL items maximum
- Focus on the most dangerous elements only
- Prioritize: financial amounts, phone numbers, messaging apps, suspicious contact methods
- DO NOT highlight common words or entire sentences
- Keep highlights SHORT and SPECIFIC

Categorize by threat level:
- high_risk: Phone numbers, financial amounts ($250, $2250), crypto/wire transfers
- suspicious: WhatsApp, Telegram, messaging app names only
- organization: Company names only (like "Bind Media")

IMPORTANT: Return maximum 5 highlights total. Focus on quality over quantity.

Return ONLY this JSON format:
{
  "highlights": [
    {"start": 0, "end": 10, "type": "high_risk", "text": "example text"}
  ]
}`;

    } else if (analysisType === 'basic') {
      // BASIC ANALYSIS - Haiku 3.5 for cost efficiency
      model = "claude-3-5-haiku-20241022";
      maxTokens = 400;
      
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
      maxTokens = 1200;
      tools = [{
        "type": "web_search_20250305",
        "name": "web_search"
      }];

      const basicContext = basicResults ? `
Previous basic analysis found:
- Observations: ${basicResults.whatWeObserved}
- Red flags: ${basicResults.redFlagsToConsider?.join(', ')}
` : '';

      fullPrompt = `You are a cybersecurity expert conducting detailed verification analysis with web search capabilities.

${basicContext}

Communication to analyze: ${incident}

INSTRUCTIONS:
1. Use web_search to verify any claimed organizations, phone numbers, or domains mentioned
2. Search for recent scam reports involving similar contacts or patterns
3. Look up official contact information for any organizations mentioned
4. Search for current threat intelligence and security advisories

After conducting your research, respond with ONLY this JSON structure (no other text):

{
  "businessVerification": {
    "claimedOrganization": "Name of organization mentioned in communication",
    "officialContacts": ["Official phone numbers from web search", "Verified email addresses", "Official websites found"],
    "comparisonFindings": ["How claimed contacts compare to official ones", "Verification results from web search"],
    "officialAlerts": ["Any fraud warnings found about this organization"]
  },
  "threatIntelligence": {
    "knownScamReports": ["Scam reports found about these specific contacts", "Fraud database results"],
    "similarIncidents": ["Similar attack patterns found online", "Related scam campaigns"],
    "securityAdvisories": ["Official security warnings found"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Current phishing trends found", "Industry-specific threats"],
    "recentCampaigns": ["Ongoing scam campaigns found", "Recent attack patterns"],
    "officialWarnings": ["Government or security vendor alerts"]
  },
  "analysisType": "advanced"
}

IMPORTANT: Base all findings on actual web search results. If no relevant information is found through search, indicate this clearly in each section.`;
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
    console.log('[API] Full response structure:', JSON.stringify(data, null, 2));
    
    if (!data.content || !data.content[0]) {
      throw new Error('Invalid response format from Anthropic API');
    }

    let responseText = "";
    
    // Handle both text and tool_use content
    for (const content of data.content) {
      if (content.type === "text") {
        responseText += content.text;
      }
    }
    
    if (!responseText) {
      throw new Error('No text content found in Anthropic API response');
    }
    
    console.log('[API] Response length:', responseText.length);
    console.log('[API] Response preview:', responseText.substring(0, 500));
    
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
        const lastCompleteEntry = cleanedResponse.lastIndexOf('"},');
        if (lastCompleteEntry > -1) {
          cleanedResponse = cleanedResponse.substring(0, lastCompleteEntry + 2) + '\n  ]\n}';
        } else {
          cleanedResponse = cleanedResponse + '\n  ]\n}';
        }
      }
      
      analysis = JSON.parse(cleanedResponse);
      console.log('[API] JSON parsed successfully for', analysisType);
      console.log('[API] Parsed analysis structure:', Object.keys(analysis));
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      console.log('[API] Full response that failed to parse:', responseText);
      
      // Enhanced fallback based on analysis type
      if (analysisType === 'highlight') {
        analysis = {
          highlights: []
        };
      } else if (analysisType === 'basic') {
        const hasWhatsApp = incident.toLowerCase().includes('whatsapp');
        const hasJobOffer = incident.toLowerCase().includes('job') || incident.toLowerCase().includes('work');
        const hasFinancialAmount = /\$\d+/.test(incident);
        
        analysis = {
          whatWeObserved: "Communication contains elements that require further verification",
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
      } else if (analysisType === 'advanced') {
        // More detailed fallback for advanced analysis
        analysis = {
          businessVerification: {
            claimedOrganization: "Analysis requires manual verification due to parsing error",
            officialContacts: ["Visit organization's official website for verified contact information"],
            comparisonFindings: ["Manual comparison of provided contacts with official sources needed"],
            officialAlerts: ["Check organization's official fraud alert page if available"]
          },
          threatIntelligence: {
            knownScamReports: ["Search fraud databases manually for reports involving these contacts"],
            similarIncidents: ["Research similar communication patterns in security forums"],
            securityAdvisories: ["Check CISA.gov and FBI IC3 for related advisories"]
          },
          currentThreatLandscape: {
            industryTrends: ["Consult current cybersecurity reports for industry-specific threats"],
            recentCampaigns: ["Monitor security vendor blogs for recent campaign reports"],
            officialWarnings: ["Review government security alerts and advisories"]
          },
          analysisType: "advanced"
        };
      }
    }

    console.log('[API] Final analysis object keys:', Object.keys(analysis));
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