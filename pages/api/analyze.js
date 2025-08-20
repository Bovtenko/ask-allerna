// pages/api/analyze.js - Enhanced Two-Stage Analysis

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
      // ENHANCED BASIC ANALYSIS - Haiku 3.5 with comprehensive analysis and investigation targets
      model = "claude-3-5-haiku-20241022";
      maxTokens = 700;
      
      fullPrompt = `You are a cybersecurity expert providing comprehensive security education analysis.

Communication: ${incident}

Provide thorough educational analysis and extract specific items for potential verification. Even if the communication seems legitimate, include educational patterns users should recognize in similar situations.

Respond with ONLY this JSON (no other text):
{
  "whatWeObserved": "Detailed factual description of communication elements - who, what, when, how delivered, key claims made",
  "redFlagsToConsider": ["Educational pattern 1 (specific to this case)", "Educational pattern 2 (specific to this case)", "Educational pattern 3 (specific to this case)", "Educational pattern 4 (general security awareness)"],
  "verificationSteps": ["Specific verification step 1", "Specific verification step 2", "Specific verification step 3"],
  "whyVerificationMatters": "Educational explanation of why independent verification is crucial for this type of communication",
  "organizationSpecificGuidance": "Detailed guidance about the claimed organization and how to verify legitimately",
  "investigationTargets": {
    "businessesToVerify": ["Extract any company/organization names mentioned in the communication"],
    "contactsToCheck": ["Extract phone numbers, email addresses, domains, or websites mentioned"],
    "suspiciousPatterns": ["Identify specific suspicious patterns like 'WhatsApp job recruitment', 'vendor payment changes', 'urgent account verification'"],
    "searchQueries": ["Specific web search to verify company official contacts", "Search for recent scam reports about this pattern", "Look up official company fraud warnings"]
  },
  "analysisType": "basic",
  "upgradeAvailable": true
}`;

    } else if (analysisType === 'advanced') {
      // FOCUSED PROFESSIONAL ANALYSIS - Sonnet 4 with targeted web search
      model = "claude-sonnet-4-20250514";
      maxTokens = 800;
      tools = [{
        "type": "web_search_20250305",
        "name": "web_search"
      }];

      const targets = basicResults?.investigationTargets || {};
      const businessesToVerify = targets.businessesToVerify?.join(', ') || 'None specified';
      const contactsToCheck = targets.contactsToCheck?.join(', ') || 'None specified';
      const suspiciousPatterns = targets.suspiciousPatterns?.join(', ') || 'None specified';
      const searchQueries = targets.searchQueries?.join(', ') || 'None specified';

      fullPrompt = `Conduct targeted verification research based on preliminary analysis findings.

INVESTIGATION TARGETS FROM BASIC ANALYSIS:
- Businesses to verify: ${businessesToVerify}
- Contacts to check: ${contactsToCheck}
- Suspicious patterns: ${suspiciousPatterns}
- Specific searches needed: ${searchQueries}

INSTRUCTIONS:
1. Use web_search to verify ONLY the specific targets identified above
2. Focus searches on official company information and recent scam reports
3. Compare claimed contacts with official sources
4. Look for security advisories related to the identified patterns

Respond with ONLY this JSON structure (no other text):
{
  "businessVerification": {
    "claimedOrganization": "Primary organization mentioned in targets",
    "officialContacts": ["Verified official contact information found through web search"],
    "comparisonFindings": ["How the provided contacts compare to verified official contacts"],
    "officialAlerts": ["Any official fraud warnings or alerts found about this organization"]
  },
  "threatIntelligence": {
    "knownScamReports": ["Specific scam reports found about these contacts, patterns, or organization"],
    "similarIncidents": ["Similar attack patterns or incidents found through research"],
    "securityAdvisories": ["Official security warnings or advisories related to the identified patterns"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Current cybersecurity trends related to the identified patterns"],
    "recentCampaigns": ["Recent scam campaigns matching the suspicious patterns identified"],
    "officialWarnings": ["Government, law enforcement, or security vendor warnings"]
  },
  "analysisType": "advanced"
}

IMPORTANT: Only search for and report findings directly related to the investigation targets. Base all findings on actual web search results.`;
    }

    console.log('[API] Making request - Model:', model, 'Tokens:', maxTokens);
    
    // Enhanced request function with retry logic for overload errors
    const makeAnthropicRequest = async (payload, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify(payload)
        });

        if (response.status === 529) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          console.log(`[API] Overloaded, retrying in ${delay}ms (attempt ${i + 1}/${retries})`);
          if (i < retries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        return response;
      }
    };

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

    const response = await makeAnthropicRequest(anthropicPayload);

    console.log('[API] Anthropic response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[API] Anthropic error response:', errorText);
      
      // Special handling for overload errors in advanced analysis
      if (response.status === 529 && analysisType === 'advanced') {
        console.log('[API] Advanced analysis overloaded, providing fallback');
        const fallbackAnalysis = {
          businessVerification: {
            claimedOrganization: "Analysis unavailable due to high system load",
            officialContacts: ["Please verify contacts manually through official company website"],
            comparisonFindings: ["Manual verification required - system currently overloaded"],
            officialAlerts: ["Check company's official fraud alert page if available"]
          },
          threatIntelligence: {
            knownScamReports: ["Search fraud databases manually for reports involving these contacts"],
            similarIncidents: ["Check security forums for similar communication patterns"],
            securityAdvisories: ["Review CISA.gov and FBI IC3 for related advisories"]
          },
          currentThreatLandscape: {
            industryTrends: ["Consult current cybersecurity reports for relevant threats"],
            recentCampaigns: ["Monitor security vendor blogs for recent campaign reports"],
            officialWarnings: ["Review government security alerts and advisories"]
          },
          analysisType: "advanced"
        };
        return res.status(200).json(fallbackAnalysis);
      }
      
      throw new Error(`Anthropic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[API] Response received, parsing...');
    
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
    console.log('[API] Response preview:', responseText.substring(0, 300));
    
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
        const hasPhoneNumber = /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/.test(incident);
        
        analysis = {
          whatWeObserved: "Communication contains elements that require further verification based on observed patterns",
          redFlagsToConsider: [
            hasWhatsApp ? "Communication via WhatsApp instead of official channels" : "Verify sender through official channels",
            hasJobOffer ? "Unsolicited job offer requiring verification" : "Unexpected communication pattern",
            hasFinancialAmount ? "Financial amounts mentioned without clear context" : "Exercise standard verification",
            hasPhoneNumber ? "Phone contact provided - verify through official sources" : "Confirm contact legitimacy"
          ],
          verificationSteps: [
            "Contact organization through official website",
            "Verify sender through known official channels",
            "Research organization independently before responding"
          ],
          whyVerificationMatters: "Independent verification helps confirm legitimacy and protects against social engineering attacks that exploit trust.",
          organizationSpecificGuidance: "Check the organization's official website for contact verification procedures and fraud warnings.",
          investigationTargets: {
            businessesToVerify: ["Organization mentioned in communication"],
            contactsToCheck: ["Phone numbers and email addresses provided"],
            suspiciousPatterns: ["Communication method and contact patterns"],
            searchQueries: ["Organization official contact verification", "Recent scam reports with similar patterns"]
          },
          analysisType: "basic",
          upgradeAvailable: true
        };
      } else if (analysisType === 'advanced') {
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