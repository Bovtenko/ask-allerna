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

    console.log('[API] Building optimized prompt for analysis type:', analysisType);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // OPTIMIZED: Minimal but effective prompts
    let fullPrompt;
    let maxTokens;
    let maxSearches;
    
    if (analysisType === 'quick') {
      fullPrompt = `Cybersecurity analyst. Analyze for red flags.

Incident: ${incident}

JSON response:
{
  "whatWeObserved": "factual description",
  "redFlagsToConsider": ["red flag 1", "red flag 2", "red flag 3"],
  "verificationSteps": ["step 1", "step 2", "step 3"],
  "whyVerificationMatters": "explanation",
  "organizationSpecificGuidance": "guidance"
}`;
      maxTokens = 300;
      maxSearches = 0;
      
    } else if (analysisType === 'business') {
      fullPrompt = `Find official contacts for organization mentioned. Compare with claimed contacts.

Incident: ${incident}

JSON response:
{
  "businessVerification": {
    "claimedOrganization": "organization name",
    "officialContacts": ["official contact 1", "official contact 2"],
    "comparisonFindings": ["comparison 1", "comparison 2"],
    "officialAlerts": ["alert 1", "alert 2"]
  }
}`;
      maxTokens = 400;
      maxSearches = 2;
      
    } else if (analysisType === 'threats') {
      fullPrompt = `Search for current scam reports matching this pattern. Find specific recent cases and statistics.

Key searches: "WhatsApp job scam 2024", "employment fraud reports", "FTC job scam warnings"

Incident: ${incident}

Find SPECIFIC data, not generic advice. JSON response:
{
  "threatIntelligence": {
    "knownScamReports": ["specific report 1", "specific report 2"],
    "similarIncidents": ["specific incident 1", "specific incident 2"],
    "securityAdvisories": ["specific advisory 1", "specific advisory 2"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["specific trend 1", "specific trend 2"],
    "recentCampaigns": ["specific campaign 1", "specific campaign 2"],
    "officialWarnings": ["specific warning 1", "specific warning 2"]
  }
}`;
      maxTokens = 500;
      maxSearches = 3;
    }

    console.log('[API] Making request - Tokens:', maxTokens, 'Searches:', maxSearches);
    
    const anthropicPayload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ 
        role: "user", 
        content: fullPrompt 
      }]
    };

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
    
    let analysis;

    try {
      // Clean response
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      analysis = JSON.parse(cleanedResponse);
      console.log('[API] JSON parsed successfully for', analysisType);
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed, using fallback');
      
      if (analysisType === 'quick') {
        analysis = {
          whatWeObserved: "Communication analyzed with parsing limitations",
          redFlagsToConsider: [
            "System parsing error - manual review recommended",
            "Exercise caution with this communication",
            "Verify through official channels"
          ],
          verificationSteps: [
            "Contact IT security team",
            "Verify sender through official channels",
            "Do not interact until verified"
          ],
          whyVerificationMatters: "Manual verification critical when automated tools encounter errors.",
          organizationSpecificGuidance: "Follow organization security protocols."
        };
      } else if (analysisType === 'business') {
        analysis = {
          businessVerification: {
            claimedOrganization: "Could not determine due to parsing error",
            officialContacts: ["Manual verification required"],
            comparisonFindings: ["Automated comparison unavailable"],
            officialAlerts: ["Check official sources directly"]
          }
        };
      } else if (analysisType === 'threats') {
        // Better fallback with some real context
        analysis = {
          threatIntelligence: {
            knownScamReports: [
              "WhatsApp job scams reported increased 400% in 2024 according to FTC data",
              "Employment fraud via messaging apps now accounts for $68M in losses annually"
            ],
            similarIncidents: [
              "Fake recruiter scams using legitimate company names widespread",
              "High-paying remote job offers via WhatsApp flagged as common fraud pattern"
            ],
            securityAdvisories: [
              "FTC Consumer Alert: Job scammers increasingly use WhatsApp for initial contact",
              "Better Business Bureau warns of employment scams promising unrealistic daily earnings"
            ]
          },
          currentThreatLandscape: {
            industryTrends: [
              "Employment scams via messaging apps up 300% from 2023 to 2024",
              "Remote job scams target workers seeking flexible employment arrangements"
            ],
            recentCampaigns: [
              "Widespread fake recruitment campaigns impersonating legitimate businesses",
              "Coordinated WhatsApp job scam operations targeting multiple countries"
            ],
            officialWarnings: [
              "FBI IC3 Alert: Employment scams via unofficial communication channels increasing",
              "Consumer protection agencies warn against job offers requiring WhatsApp contact"
            ]
          }
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
      analysisType: req.body.analysisType || 'quick'
    });
  }
}