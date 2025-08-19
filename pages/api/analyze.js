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

    console.log('[API] Building ultra-optimized prompt for analysis type:', analysisType);
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // ULTRA-OPTIMIZED: Minimal token limits and targeted searches
    let fullPrompt;
    let maxTokens;
    let maxSearches;
    
    if (analysisType === 'quick') {
      // Quick analysis - minimal tokens, no searches
      fullPrompt = [
        `You are a cybersecurity expert. Today is ${currentDate}.`,
        `Analyze this communication for security red flags. Focus on obvious suspicious patterns.`,
        `\nCommunication: ${incident}`,
        `Respond with ONLY this exact JSON format:`,
        `{
  "whatWeObserved": "Brief factual description of the communication",
  "redFlagsToConsider": ["Main red flag 1", "Main red flag 2", "Main red flag 3"],
  "verificationSteps": ["Verification step 1", "Verification step 2", "Verification step 3"],
  "whyVerificationMatters": "Brief explanation of why verification is important",
  "organizationSpecificGuidance": "Brief guidance based on organization mentioned"
}`,
        `IMPORTANT: Output ONLY valid JSON. No other text.`
      ].join('\n\n');
      maxTokens = 400; // Ultra-low for speed
      maxSearches = 0;
      
    } else if (analysisType === 'business') {
      // Business verification - focused searches only
      fullPrompt = [
        `You are a cybersecurity expert. Today is ${currentDate}.`,
        `Use web search to verify the organization mentioned in this communication.`,
        `Search strategy: 1) Find official website 2) Find official contact info 3) Look for scam warnings`,
        `\nCommunication: ${incident}`,
        `Respond with ONLY this exact JSON format:`,
        `{
  "businessVerification": {
    "claimedOrganization": "Name of organization claimed in communication",
    "officialContacts": ["Official contact method 1", "Official contact method 2"],
    "comparisonFindings": ["How claimed contacts compare to official ones"],
    "officialAlerts": ["Any scam warnings found about this organization"]
  }
}`,
        `IMPORTANT: Output ONLY valid JSON. No other text.`
      ].join('\n\n');
      maxTokens = 500; // Reduced for cost efficiency
      maxSearches = 2; // Minimal but effective
      
    } else if (analysisType === 'threats') {
      // Threat intelligence - targeted threat research
      fullPrompt = [
        `You are a cybersecurity expert. Today is ${currentDate}.`,
        `Use web search to find current threat intelligence about this type of communication.`,
        `Search strategy: 1) Recent scam reports 2) Official security warnings`,
        `\nCommunication: ${incident}`,
        `Respond with ONLY this exact JSON format:`,
        `{
  "threatIntelligence": {
    "knownScamReports": ["Recent scam report 1", "Recent scam report 2"],
    "similarIncidents": ["Similar incident pattern 1", "Similar incident pattern 2"],
    "securityAdvisories": ["Official warning 1", "Official warning 2"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Current threat trend 1", "Current threat trend 2"],
    "recentCampaigns": ["Recent campaign 1", "Recent campaign 2"],
    "officialWarnings": ["Official alert 1", "Official alert 2"]
  }
}`,
        `IMPORTANT: Output ONLY valid JSON. No other text.`
      ].join('\n\n');
      maxTokens = 500; // Optimized for cost
      maxSearches = 2; // Targeted searches only
    }

    console.log('[API] Making ultra-optimized request to Anthropic API...');
    console.log('[API] Config - Tokens:', maxTokens, 'Searches:', maxSearches);
    
    const anthropicPayload = {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      temperature: 0.1,
      messages: [{ 
        role: "user", 
        content: fullPrompt 
      }]
    };

    // Add web search tool only when needed
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
    console.log('[API] Raw response preview:', responseText.substring(0, 200));
    
    let analysis;

    try {
      // Clean the response text before parsing
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      analysis = JSON.parse(cleanedResponse);
      console.log('[API] JSON parsed successfully for', analysisType);
      
    } catch (parseError) {
      console.log('[API] JSON parsing failed:', parseError);
      console.log('[API] Full raw response:', responseText);
      
      // Comprehensive fallback responses
      if (analysisType === 'quick') {
        analysis = {
          whatWeObserved: "Communication analyzed - system encountered parsing issue but security patterns reviewed",
          redFlagsToConsider: [
            "System parsing error occurred - manual review strongly recommended",
            "Exercise heightened caution with this communication until verified",
            "Automated red flag detection temporarily limited"
          ],
          verificationSteps: [
            "Contact your IT security team immediately for manual analysis",
            "Verify sender through official channels before any interaction", 
            "Do not click links or provide information until verification complete"
          ],
          whyVerificationMatters: "When automated security tools encounter errors, manual verification becomes critical for protection against social engineering attacks.",
          organizationSpecificGuidance: "Follow your organization's incident response procedures for suspicious communications during system limitations."
        };
      } else if (analysisType === 'business') {
        analysis = {
          businessVerification: {
            claimedOrganization: "Organization analysis incomplete due to system error",
            officialContacts: [
              "Manual verification required - visit official website directly",
              "Contact organization through verified phone numbers only"
            ],
            comparisonFindings: [
              "Automated comparison unavailable - manual verification essential",
              "Cross-reference all contact details with official sources"
            ],
            officialAlerts: [
              "Check official company website for any fraud warnings",
              "Review security advisories from relevant authorities"
            ]
          }
        };
      } else if (analysisType === 'threats') {
        analysis = {
          threatIntelligence: {
            knownScamReports: [
              "Automated threat database lookup temporarily unavailable",
              "Check FTC fraud reports and IC3 complaints manually"
            ],
            similarIncidents: [
              "Manual research recommended through security vendor sites",
              "Review recent fraud patterns reported by authorities"
            ],
            securityAdvisories: [
              "Check official government cybersecurity advisories",
              "Review latest warnings from CISA and FBI"
            ]
          },
          currentThreatLandscape: {
            industryTrends: [
              "Current threat analysis temporarily limited",
              "Consult security vendor threat intelligence reports"
            ],
            recentCampaigns: [
              "Manual research recommended for latest campaigns",
              "Check recent security blog posts from major vendors"
            ],
            officialWarnings: [
              "Review official alerts from cybersecurity authorities",
              "Check latest advisories from relevant government agencies"
            ]
          }
        };
      }
    }

    console.log('[API] Successfully returning analysis for', analysisType);
    console.log('[API] Final cost estimate - Tokens:', maxTokens, 'Searches:', maxSearches);
    return res.status(200).json(analysis);

  } catch (error) {
    console.error('[API] Complete analysis error:', error);
    console.error('[API] Error stack:', error.stack);
    
    const fallbackAnalysis = {
      error: true,
      message: error.message,
      analysisType: req.body.analysisType || 'quick',
      fallbackGuidance: "Manual security review recommended due to system error"
    };
    
    return res.status(500).json(fallbackAnalysis);
  }
}