// pages/api/analyze.js - Complete API with Corrected Perplexity Sonar Reasoning Pro

// Perplexity Research Function - Uses Sonar Reasoning Pro for business verification
const callPerplexityResearch = async (investigationTargets) => {
  try {
    // Build focused research query from investigation targets
    const businesses = investigationTargets.businessesToVerify?.join(', ') || '';
    const contacts = investigationTargets.contactsToCheck?.join(', ') || '';
    const patterns = investigationTargets.suspiciousPatterns?.join(', ') || '';
    
    // Skip if no targets to research
    if (!businesses && !contacts && !patterns) {
      console.log('[PERPLEXITY] No investigation targets provided, skipping research');
      return null;
    }
    
const researchQuery = `Conduct targeted cybersecurity research with specific searches:

PRIORITY SEARCHES (execute each specifically):
1. "${businesses} fraud alert 2025" - Find company's official scam warnings from their website
2. "BBB Scam Tracker ${businesses}" - Search BBB database for recent reports
3. "${contacts} scam report" - Check if these specific contacts are reported as fraudulent
4. "${patterns} scam 2025" - Find current trend analysis and official warnings

BUSINESS VERIFICATION FOR: ${businesses}
- Official website and verified contact information
- Recent fraud alerts posted by the company itself
- BBB profile and any scam reports
- Government or security vendor advisories

CONTACT VERIFICATION FOR: ${contacts}
- Cross-reference with official company contacts
- Search scam databases and reporting sites
- Check for previous fraud reports involving these numbers/emails

THREAT INTELLIGENCE FOR: ${patterns}
- Current 2025 security advisories about these attack methods
- Recent campaign reports from security vendors
- Government warnings (FTC, FBI, CISA) about similar patterns

IMPORTANT: Provide exact dates, specific citations, and direct quotes. Focus on findings from 2024-2025 for current relevance.`;
    console.log('[PERPLEXITY] Making research request for targets:', { businesses, contacts, patterns });
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-reasoning-pro', // ✅ Correct model name for Sonar Reasoning Pro
        messages: [{ 
          role: 'user', 
          content: researchQuery 
        }],
        max_tokens: 3000, // ✅ Increased tokens as recommended by Perplexity
        temperature: 0.1,
        return_citations: true // ✅ Confirmed correct parameter for citations
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('[PERPLEXITY] Error response:', response.status, errorText);
      throw new Error(`Perplexity API responded with status: ${response.status}`);
    }

    const data = await response.json();
console.log('[PERPLEXITY] Research completed successfully');
console.log('[PERPLEXITY] Usage:', data.usage);

// Check for low context and log warning
if (data.usage && data.usage.search_context_size === 'low') {
  console.log('[PERPLEXITY] Warning: Low search context - research may be incomplete');
}

console.log('[PERPLEXITY] Research preview:', data.choices[0].message.content.substring(0, 200));

return data.choices[0].message.content;
    
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('[PERPLEXITY] Research error:', error);
    return null;
  }
};

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
      console.log('[API] Error: Anthropic API key not configured');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    console.log('[API] Building prompt for analysis type:', analysisType);
    
    let fullPrompt;
    let model;
    let maxTokens;
    
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
      // ADVANCED ANALYSIS WITH PERPLEXITY SONAR REASONING PRO
      console.log('[API] Starting advanced analysis with Perplexity Sonar Reasoning Pro...');
      
      if (!process.env.PERPLEXITY_API_KEY) {
        console.log('[API] Warning: Perplexity API key not configured, using fallback');
      }
      
      const targets = basicResults?.investigationTargets || {};
      console.log('[API] Investigation targets:', targets);
      
      // Step 1: Get research from Perplexity Sonar Reasoning Pro
      let researchResults = null;
      if (process.env.PERPLEXITY_API_KEY) {
        researchResults = await callPerplexityResearch(targets);
      }
      
      if (!researchResults) {
        // Fallback if Perplexity fails or is unavailable
        console.log('[API] Perplexity research failed or unavailable, using enhanced fallback');
        
        // Create enhanced fallback based on investigation targets
        const businessNames = targets.businessesToVerify?.join(', ') || 'the claimed organization';
        const contactInfo = targets.contactsToCheck?.join(', ') || 'the provided contacts';
        const patterns = targets.suspiciousPatterns?.join(', ') || 'the communication patterns';
        
        const fallbackAnalysis = {
          businessVerification: {
            claimedOrganization: businessNames,
            officialContacts: [`Visit ${businessNames} official website for verified contact information`, "Check company's 'Contact Us' page for official phone and email", "Look for official social media accounts with verification badges"],
            comparisonFindings: [`Manual comparison needed between ${contactInfo} and official sources`, "Verify domain matches official company website", "Check if contact methods match company's standard communication practices"],
            officialAlerts: [`Check ${businessNames} official website for fraud alert section`, "Look for scam warnings on company's security or news pages", "Search for company statements about fraudulent communications"]
          },
          threatIntelligence: {
            knownScamReports: [`Search BBB scam tracker for reports involving ${contactInfo}`, "Check FBI IC3 database for similar fraud reports", "Look up reports on scammer.info and similar databases"],
            similarIncidents: [`Search for similar ${patterns} in recent security advisories`, "Check recent fraud alerts from FTC and CISA", "Look for pattern matches in cybersecurity vendor reports"],
            securityAdvisories: ["Review CISA.gov for related security advisories", "Check FBI IC3 public service announcements", "Monitor FTC fraud alerts for similar schemes"]
          },
          currentThreatLandscape: {
            industryTrends: [`Research current trends related to ${patterns}`, "Check cybersecurity vendor threat reports for similar patterns", "Review government fraud statistics for related schemes"],
            recentCampaigns: ["Monitor security blogs for recent campaign reports", "Check threat intelligence feeds for similar attack patterns", "Review recent fraud warnings from financial institutions"],
            officialWarnings: ["Check government consumer protection sites for relevant warnings", "Review law enforcement fraud alerts", "Monitor industry-specific security advisories"]
          },
          analysisType: "advanced"
        };
        return res.status(200).json(fallbackAnalysis);
      }
      
      // Step 2: Use Haiku to format Perplexity results into our JSON structure
      model = "claude-3-5-haiku-20241022";
      maxTokens = 800;
      
      fullPrompt = `Format the following research results into our JSON structure.

RESEARCH RESULTS FROM PERPLEXITY SONAR REASONING PRO:
${researchResults}

INVESTIGATION TARGETS:
- Businesses: ${targets.businessesToVerify?.join(', ') || 'None'}
- Contacts: ${targets.contactsToCheck?.join(', ') || 'None'}
- Patterns: ${targets.suspiciousPatterns?.join(', ') || 'None'}

Convert this research into ONLY this JSON format (no other text):
{
  "businessVerification": {
    "claimedOrganization": "Main organization from research",
    "officialContacts": ["Official contacts found in research with sources"],
    "comparisonFindings": ["How provided contacts compare to official ones found"],
    "officialAlerts": ["Any fraud warnings or alerts found in research"]
  },
  "threatIntelligence": {
    "knownScamReports": ["Specific scam reports found about these contacts/patterns"],
    "similarIncidents": ["Similar incidents found in research"],
    "securityAdvisories": ["Security advisories found in research"]
  },
  "currentThreatLandscape": {
    "industryTrends": ["Current trends found in research"],
    "recentCampaigns": ["Recent campaigns found in research"],
    "officialWarnings": ["Government/official warnings found in research"]
  },
  "analysisType": "advanced"
}

Extract findings from the research and organize them into these categories. If no information was found for a category, include explanatory text about what to check manually. Include relevant citations when possible.`;
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
    console.log('[API] Anthropic usage:', data.usage);
    
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