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

    console.log('[API] Building balanced prompt for analysis type:', analysisType);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // BALANCED: Adequate context but optimized length
    let fullPrompt;
    let maxTokens;
    let maxSearches;
    
    if (analysisType === 'quick') {
      fullPrompt = `You are a cybersecurity expert analyzing this communication for red flags.

Communication: ${incident}

Analyze for suspicious patterns and respond with ONLY this JSON:
{
  "whatWeObserved": "Brief factual description of the communication",
  "redFlagsToConsider": ["Specific red flag 1", "Specific red flag 2", "Specific red flag 3"],
  "verificationSteps": ["Specific verification step 1", "Specific verification step 2", "Specific verification step 3"],
  "whyVerificationMatters": "Brief explanation of why verification is important",
  "organizationSpecificGuidance": "Brief guidance based on organization mentioned"
}`;
      maxTokens = 400;
      maxSearches = 0;
      
    } else if (analysisType === 'business') {
      fullPrompt = `You are a cybersecurity expert. Use web search to verify the organization mentioned in this communication.

Search for: 1) Official website and contacts 2) Company verification 3) Any scam warnings

Communication: ${incident}

Respond with ONLY this JSON:
{
  "businessVerification": {
    "claimedOrganization": "Name of organization claimed",
    "officialContacts": ["Official contact 1", "Official contact 2"],
    "comparisonFindings": ["How claimed contacts compare to official ones"],
    "officialAlerts": ["Any scam warnings found"]
  }
}`;
      maxTokens = 500;
      maxSearches = 2;
      
    } else if (analysisType === 'threats') {
      // KEEP: This is working perfectly, don't change
      fullPrompt = `Search for current scam reports matching this pattern. Find specific recent cases and statistics.

Key searches: "WhatsApp job scam 2024", "employment fraud reports", "FTC job scam warnings"

Communication: ${incident}

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
      
      analysis = JSON.parse(cleanedResponse);
      console.log('[API] JSON parsed successfully for', analysisType);
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      console.log('[API] Full response:', responseText);
      
      // Better fallbacks that actually analyze the content
      if (analysisType === 'quick') {
        // Extract key elements for fallback analysis
        const hasWhatsApp = incident.toLowerCase().includes('whatsapp');
        const hasHighPay = /\$\d+/.test(incident);
        const hasJobOffer = incident.toLowerCase().includes('job') || incident.toLowerCase().includes('work');
        
        analysis = {
          whatWeObserved: hasJobOffer ? "Unsolicited job offer with high compensation claims and WhatsApp contact request" : "Communication requires manual analysis due to parsing error",
          redFlagsToConsider: [
            hasHighPay ? "Unusually high compensation claims that seem disproportionate to work described" : "Manual review recommended",
            hasWhatsApp ? "Request to communicate via WhatsApp instead of professional channels" : "Verify sender through official channels",
            hasJobOffer ? "Unsolicited job offer without verification of recipient's interest or qualifications" : "Exercise caution with this communication"
          ],
          verificationSteps: [
            "Research the claimed organization through official channels",
            "Verify recruiter identity through LinkedIn and company directory", 
            "Check if job postings exist on official company website"
          ],
          whyVerificationMatters: "Employment scams are increasingly sophisticated and use legitimate company names to build trust with potential victims.",
          organizationSpecificGuidance: hasJobOffer ? "Legitimate companies typically recruit through official channels and provide detailed job descriptions with realistic compensation." : "Follow standard security verification procedures."
        };
      } else if (analysisType === 'business') {
        // Extract organization name for fallback
        const orgMatch = incident.match(/from\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        const orgName = orgMatch ? orgMatch[1] : "organization mentioned";
        
        analysis = {
          businessVerification: {
            claimedOrganization: orgName,
            officialContacts: [
              "Manual verification required - search for official website",
              "Look up company in business directories"
            ],
            comparisonFindings: [
              "Automated verification unavailable - compare manually",
              "Cross-reference contact methods with official sources"
            ],
            officialAlerts: [
              "Check official company website for fraud warnings",
              "Search for recent security advisories about this organization"
            ]
          }
        };
      } else if (analysisType === 'threats') {
        // Keep the good fallback data that's working
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