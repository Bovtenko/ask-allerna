// pages/api/analyze.js - Universal Context-Aware Threat Analysis System

// Stage 1: Universal Threat Intelligence Analysis
const analyzeCommunication = async (incident) => {
  try {
    const intelligencePrompt = `You are a threat intelligence analyst. Analyze this communication to understand the threat landscape and guide targeted research.

COMMUNICATION TO ANALYZE:
${incident}

Perform comprehensive threat analysis and entity extraction:

1. THREAT CLASSIFICATION
- Identify the primary threat type (employment_scam, romance_scam, tech_support_scam, bec_attack, phishing_credential, investment_fraud, government_impersonation, package_delivery_scam, cryptocurrency_scam, banking_fraud, etc.)
- Assess threat sophistication level (low, medium, high)
- Identify social engineering tactics used

2. ENTITY EXTRACTION
- Organizations: Any companies, agencies, services mentioned
- People: Names, roles, claimed relationships
- Financial: Amounts, payment methods, account details, cryptocurrency
- Technical: URLs, domains, email addresses, phone numbers, apps
- Temporal: Deadlines, urgency indicators, time pressures
- Emotional: Fear tactics, excitement, urgency, trust building

3. THREAT VECTORS
- Social engineering tactics (urgency, authority, scarcity, reciprocity, etc.)
- Technical methods (spoofing, typosquatting, credential harvesting)
- Financial methods (wire transfers, gift cards, cryptocurrency, etc.)

4. RESEARCH PRIORITIES
- What entities need verification most urgently?
- What official sources should be consulted?
- What scam databases should be searched?
- What government agencies might have relevant warnings?

Return ONLY this JSON structure:
{
  "threatType": "primary_threat_category",
  "threatSophistication": "low|medium|high",
  "socialEngineeringTactics": ["tactic1", "tactic2"],
  "entities": {
    "organizations": ["org1", "org2"],
    "people": ["person1", "person2"],
    "financial": ["amount1", "method1"],
    "technical": ["url1", "email1", "phone1"],
    "temporal": ["deadline1", "urgency1"],
    "emotional": ["fear_tactic1", "trust_building1"]
  },
  "researchPriorities": {
    "highPriority": ["most_critical_verification_needs"],
    "mediumPriority": ["secondary_verification_needs"],
    "lowPriority": ["tertiary_verification_needs"]
  },
  "recommendedSources": {
    "officialSources": ["company_websites", "government_agencies"],
    "scamDatabases": ["bbb_scam_tracker", "ftc_database"],
    "technicalAnalysis": ["domain_analysis", "phone_verification"]
  }
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 800,
        temperature: 0.1,
        messages: [{ role: "user", content: intelligencePrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Threat analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    
    // Clean and parse JSON
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    
    return JSON.parse(cleanedResponse);
    
  } catch (error) {
    console.error('[THREAT-ANALYSIS] Error:', error);
    return null;
  }
};

// Stage 2: Dynamic Multi-Source Research Based on Threat Intelligence
const conductTargetedResearch = async (threatIntel) => {
  try {
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log('[RESEARCH] Perplexity API key not configured');
      return null;
    }

    const entities = threatIntel.entities || {};
    const threatType = threatIntel.threatType || 'unknown';
    
    // Build dynamic research strategy based on threat type and entities
    const researchQueries = buildUniversalResearchQueries(threatType, entities);
    
    console.log('[RESEARCH] Conducting targeted research for threat type:', threatType);
    
    // Execute research in parallel for efficiency
    const researchPromises = researchQueries.map(async (query, index) => {
      console.log(`[RESEARCH] Query ${index + 1}:`, query.description);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [{ role: 'user', content: query.prompt }],
          max_tokens: 1500,
          temperature: 0.1,
          return_citations: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          category: query.category,
          description: query.description,
          results: data.choices[0].message.content,
          usage: data.usage
        };
      } else {
        console.error(`[RESEARCH] Query ${index + 1} failed:`, response.status);
        return {
          category: query.category,
          description: query.description,
          results: null,
          error: `Research failed with status ${response.status}`
        };
      }
    });

    const researchResults = await Promise.all(researchPromises);
    
    // Combine all research results
    const combinedResults = {
      threatType: threatType,
      totalQueries: researchQueries.length,
      results: researchResults,
      combinedFindings: researchResults.map(r => `
=== ${r.category.toUpperCase()}: ${r.description} ===
${r.results || r.error || 'No results'}
`).join('\n')
    };

    console.log('[RESEARCH] Research completed - Total queries:', researchQueries.length);
    return combinedResults;
    
  } catch (error) {
    console.error('[RESEARCH] Research error:', error);
    return null;
  }
};

// Universal Research Query Builder - Works for Any Threat Type
const buildUniversalResearchQueries = (threatType, entities) => {
  const queries = [];
  
  // 1. ORGANIZATION VERIFICATION (Universal)
  if (entities.organizations && entities.organizations.length > 0) {
    entities.organizations.forEach(org => {
      queries.push({
        category: 'organization_verification',
        description: `Official verification for ${org}`,
        prompt: `Find official information for organization: "${org}"

RESEARCH TASKS:
1. Official website and verified contact information
2. Legitimate business registration and licensing
3. Official social media accounts and verification badges
4. Any fraud alerts or scam warnings posted by the organization
5. Official recruitment/customer service processes
6. Comparison with suspicious contacts to identify mismatches

Focus on: Official websites, government business registries, verified social media, company fraud alert pages.
Provide: Exact URLs, phone numbers, email domains, and any official warnings with dates.`
      });
    });
  }

  // 2. CONTACT AND TECHNICAL VERIFICATION (Universal)
  const allContacts = [
    ...(entities.technical || []),
    ...(entities.financial || []).filter(item => item.includes('@') || item.includes('http') || /[\+\d\-\(\)\s]{10,}/.test(item))
  ];
  
  if (allContacts.length > 0) {
    queries.push({
      category: 'contact_verification',
      description: 'Suspicious contact analysis',
      prompt: `Analyze these suspicious contacts for fraud indicators:

CONTACTS TO ANALYZE: ${allContacts.join(', ')}

ANALYSIS TASKS:
1. Domain analysis (official vs. typosquatting, high-risk TLDs like .work, .tk, .info)
2. Phone number verification (official company numbers vs. suspicious numbers)
3. Email domain verification (official company domains vs. lookalike domains)
4. Scam database searches (BBB Scam Tracker, scammer.info, FTC database)
5. Technical analysis (SSL certificates, domain age, registration details)

Focus on: Scam reporting sites, domain analysis tools, official company contact verification.
Provide: Risk assessment for each contact with specific technical details.`
    });
  }

  // 3. THREAT-SPECIFIC INTELLIGENCE (Dynamic based on threat type)
  const threatSpecificQueries = getThreatSpecificQueries(threatType, entities);
  queries.push(...threatSpecificQueries);

  // 4. GOVERNMENT AND OFFICIAL WARNINGS (Universal but Threat-Adapted)
  queries.push({
    category: 'official_warnings',
    description: 'Current government and security warnings',
    prompt: `Find current official warnings and statistics for threat type: "${threatType}"

RESEARCH TASKS:
1. FTC fraud alerts and statistics for 2024-2025
2. FBI IC3 warnings and complaint data
3. CISA cybersecurity advisories
4. State attorney general fraud alerts
5. Better Business Bureau scam patterns
6. Security vendor threat reports and advisories

Focus on: Government websites (.gov), official security advisories, current fraud statistics.
Provide: Specific warnings, current threat trends, official reporting mechanisms with contact details.`
  });

  return queries;
};

// Threat-Specific Research Queries
const getThreatSpecificQueries = (threatType, entities) => {
  const queries = [];
  
  switch (threatType) {
    case 'employment_scam':
      queries.push({
        category: 'employment_specific',
        description: 'Employment scam intelligence',
        prompt: `Research employment and recruitment scam patterns:

1. Current employment scam statistics and trends for 2025
2. Fake job posting and recruitment fraud patterns
3. Work-from-home scam techniques and warnings
4. Official guidance on verifying job opportunities
5. Common employment scam red flags and indicators

Focus on: Department of Labor warnings, FTC employment fraud alerts, legitimate recruitment practices.`
      });
      break;
      
    case 'romance_scam':
      queries.push({
        category: 'romance_specific',
        description: 'Romance scam intelligence',
        prompt: `Research romance and dating scam patterns:

1. Current romance scam statistics and financial losses for 2024-2025
2. Online dating fraud techniques and warning signs
3. Military/overseas romance scam patterns
4. Cryptocurrency and gift card payment scam methods
5. Official guidance from dating platforms and law enforcement

Focus on: FTC romance scam alerts, dating platform fraud policies, military impersonation warnings.`
      });
      break;
      
    case 'tech_support_scam':
      queries.push({
        category: 'tech_support_specific',
        description: 'Tech support scam intelligence',
        prompt: `Research tech support and computer repair scam patterns:

1. Current tech support scam techniques and warnings
2. Software company impersonation tactics
3. Remote access scam methods and prevention
4. Pop-up and phone-based tech support fraud
5. Official guidance from major tech companies

Focus on: Microsoft/Apple/Google scam warnings, FTC tech support fraud alerts, cybersecurity advisories.`
      });
      break;
      
    case 'bec_attack':
      queries.push({
        category: 'bec_specific',
        description: 'Business Email Compromise intelligence',
        prompt: `Research Business Email Compromise and vendor fraud patterns:

1. Current BEC attack statistics and financial losses
2. Vendor payment redirection scam techniques
3. CEO fraud and executive impersonation methods
4. Wire transfer and payment fraud indicators
5. Business fraud prevention guidelines

Focus on: FBI IC3 BEC alerts, financial industry fraud warnings, business security best practices.`
      });
      break;
      
    case 'investment_fraud':
      queries.push({
        category: 'investment_specific',
        description: 'Investment and financial fraud intelligence',
        prompt: `Research investment fraud and financial scam patterns:

1. Current investment scam statistics and SEC warnings
2. Cryptocurrency and trading platform fraud
3. Ponzi scheme and pyramid scam indicators
4. High-yield investment program (HYIP) scams
5. Official guidance from financial regulators

Focus on: SEC investor alerts, FINRA fraud warnings, cryptocurrency scam databases.`
      });
      break;
      
    default:
      // Generic threat research for unknown patterns
      queries.push({
        category: 'generic_threat',
        description: 'General fraud pattern analysis',
        prompt: `Research general fraud patterns and social engineering techniques:

1. Current social engineering and fraud statistics
2. Common scam techniques and psychological manipulation
3. Identity theft and personal information harvesting
4. Phishing and credential theft methods
5. General fraud prevention guidance

Focus on: FTC general fraud alerts, CISA social engineering warnings, identity theft resources.`
      });
  }
  
  return queries;
};

// Stage 3: Universal Analysis and Classification
const formatUniversalAnalysis = async (incident, threatIntel, researchResults) => {
  try {
    const formatPrompt = `You are an expert cybersecurity analyst. Create a comprehensive analysis report based on threat intelligence and research findings.

ORIGINAL COMMUNICATION:
${incident}

THREAT INTELLIGENCE:
${JSON.stringify(threatIntel, null, 2)}

RESEARCH FINDINGS:
${researchResults?.combinedFindings || 'Research data unavailable'}

Create a comprehensive analysis that works for any type of threat. Extract specific, actionable information from the research findings.

Return ONLY this JSON structure:
{
  "scamClassification": {
    "primaryType": "Specific scam type (e.g., Employment Impersonation Scam, Romance Scam, etc.)",
    "subType": "Specific technique or variant",
    "sophisticationLevel": "low|medium|high",
    "confidence": "low|medium|high"
  },
  "entityVerification": {
    "organizations": [
      {
        "claimed": "Organization as presented in communication",
        "official": "Verified official information",
        "status": "legitimate|impersonated|fake|unknown",
        "officialContacts": ["verified contact methods"],
        "fraudAlerts": ["any official warnings with dates"]
      }
    ],
    "contacts": [
      {
        "contact": "suspicious contact",
        "type": "email|phone|url|domain",
        "riskLevel": "HIGH|MEDIUM|LOW",
        "analysis": "Specific reason for risk assessment",
        "isLegitimate": false,
        "officialAlternative": "verified alternative if available"
      }
    ]
  },
  "threatAnalysis": {
    "socialEngineeringTactics": ["specific tactics identified"],
    "technicalMethods": ["technical attack methods"],
    "targetedInformation": ["what information/access being sought"],
    "urgencyIndicators": ["time pressure tactics used"],
    "credibilityTactics": ["methods used to appear legitimate"]
  },
  "verificationGuidance": {
    "immediateActions": ["specific steps to take right now"],
    "verificationSteps": ["how to verify legitimacy through official channels"],
    "redFlags": ["specific warning signs in this communication"],
    "officialChannels": ["how to contact organizations through verified methods"]
  },
  "threatIntelligence": {
    "similarIncidents": ["known similar cases with details"],
    "currentTrends": ["relevant current fraud trends"],
    "officialWarnings": ["government/agency warnings with sources"],
    "reportingMechanisms": ["where and how to report this incident"]
  },
  "riskAssessment": {
    "overallRisk": "CRITICAL|HIGH|MEDIUM|LOW",
    "identityTheftRisk": "HIGH|MEDIUM|LOW",
    "financialRisk": "HIGH|MEDIUM|LOW",
    "dataCompromiseRisk": "HIGH|MEDIUM|LOW",
    "recommendedResponse": "ignore|verify_carefully|report_immediately"
  },
  "actionableRecommendations": {
    "doNotDo": ["specific things to avoid"],
    "doImmediately": ["urgent actions to take"],
    "verifyBefore": ["things to verify before any action"],
    "reportTo": ["specific agencies/organizations to contact with full details"]
  }
}

CRITICAL REQUIREMENTS:
1. Base all findings on the research results - cite specific sources where available
2. Provide specific, actionable guidance rather than generic advice
3. Include exact contact information for reporting and verification
4. Distinguish between legitimate organizations being impersonated vs. completely fake entities
5. Assess risk levels based on actual threat indicators found in research
6. Include current statistics and trends from the research findings`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1500,
        temperature: 0.1,
        messages: [{ role: "user", content: formatPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis formatting failed: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    // Clean and parse JSON
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    
    const analysis = JSON.parse(cleanedResponse);
    analysis.analysisType = "advanced";
    
    return analysis;
    
  } catch (error) {
    console.error('[ANALYSIS] Formatting error:', error);
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
      // AI HIGHLIGHTING - Universal pattern detection
      model = "claude-3-5-haiku-20241022";
      maxTokens = 500;
      
      fullPrompt = `Analyze this text for security threats and highlight the most critical elements regardless of threat type.

Text: "${incident}"

Universal highlighting rules:
- Highlight 3-5 CRITICAL security indicators maximum
- Focus on: financial amounts, contact methods, URLs, urgency language, suspicious claims
- Categorize by universal risk levels:
  * high_risk: Financial amounts, phone numbers, suspicious URLs, cryptocurrency
  * medium_risk: Urgency words, verification requests, app downloads
  * suspicious: Messaging apps, unsolicited offers, personal information requests
  * organization: Any company/organization names mentioned

Return ONLY this JSON format:
{
  "highlights": [
    {"start": 0, "end": 10, "type": "high_risk", "text": "example text"}
  ]
}`;

    } else if (analysisType === 'basic') {
      // ENHANCED BASIC ANALYSIS - Universal threat detection
      model = "claude-3-5-haiku-20241022";
      maxTokens = 700;
      
      fullPrompt = `You are a cybersecurity expert providing universal threat analysis for any type of communication.

Communication: ${incident}

Analyze this communication for any type of threat (employment scam, romance scam, tech support scam, phishing, BEC, investment fraud, etc.). Extract universal threat indicators and entities.

Respond with ONLY this JSON (no other text):
{
  "whatWeObserved": "Detailed factual description of communication elements - who, what, when, how delivered, key claims made",
  "redFlagsToConsider": ["Universal security pattern 1", "Universal security pattern 2", "Universal security pattern 3", "Universal security pattern 4"],
  "verificationSteps": ["Universal verification step 1", "Universal verification step 2", "Universal verification step 3"],
  "whyVerificationMatters": "Universal explanation of why independent verification is crucial for any suspicious communication",
  "organizationSpecificGuidance": "Guidance about verifying any claimed organization or entity through official channels",
  "investigationTargets": {
    "businessesToVerify": ["Extract any organizations, companies, agencies, services mentioned"],
    "contactsToCheck": ["Extract all contact methods: phone numbers, email addresses, URLs, messaging apps"],
    "suspiciousPatterns": ["Identify universal threat patterns: urgency tactics, financial requests, credential harvesting, impersonation"],
    "searchQueries": ["Universal verification searches", "Threat-specific database searches", "Official warning lookups"]
  },
  "analysisType": "basic",
  "upgradeAvailable": true
}`;

    } else if (analysisType === 'advanced') {
      // UNIVERSAL ADVANCED ANALYSIS PIPELINE
      console.log('[API] Starting universal threat analysis pipeline...');
      
      // Stage 1: Threat Intelligence Analysis
      console.log('[API] Stage 1: Analyzing threat landscape...');
      const threatIntel = await analyzeCommunication(incident);
      
      if (!threatIntel) {
        console.log('[API] Threat analysis failed, using fallback');
        return res.status(200).json({
          scamClassification: { primaryType: "Analysis Error - Manual Review Required" },
          analysisType: "advanced",
          error: "Threat intelligence analysis failed"
        });
      }
      
      console.log('[API] Threat intelligence completed:', threatIntel.threatType);
      
      // Stage 2: Dynamic Research Based on Threat Type
      console.log('[API] Stage 2: Conducting targeted research...');
      const researchResults = await conductTargetedResearch(threatIntel);
      
      // Stage 3: Universal Analysis and Formatting
      console.log('[API] Stage 3: Formatting comprehensive analysis...');
      const analysis = await formatUniversalAnalysis(incident, threatIntel, researchResults);
      
      if (!analysis) {
        console.log('[API] Analysis formatting failed, using enhanced fallback');
        return res.status(200).json({
          scamClassification: {
            primaryType: threatIntel.threatType || "Unknown Threat",
            subType: "Analysis formatting failed",
            sophisticationLevel: "unknown",
            confidence: "low"
          },
          riskAssessment: {
            overallRisk: "HIGH",
            recommendedResponse: "verify_carefully"
          },
          analysisType: "advanced",
          error: "Analysis formatting failed but threat intelligence available"
        });
      }
      
      console.log('[API] Universal analysis completed successfully');
      return res.status(200).json(analysis);
    }

    // Handle basic and highlight analysis types
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
      
      // Universal fallback based on analysis type
      if (analysisType === 'highlight') {
        analysis = {
          highlights: []
        };
      } else if (analysisType === 'basic') {
        analysis = {
          whatWeObserved: "Communication contains elements that require verification through official channels",
          redFlagsToConsider: [
            "Unsolicited communication from unknown sender",
            "Requests for personal or financial information", 
            "Urgency or pressure tactics used",
            "Contact methods outside official channels"
          ],
          verificationSteps: [
            "Contact the claimed organization through their official website",
            "Verify any claims independently through trusted sources",
            "Do not click links or provide information before verification"
          ],
          whyVerificationMatters: "Independent verification protects against social engineering, fraud, and identity theft attempts.",
          organizationSpecificGuidance: "Always verify communications through official channels before taking any action or providing information.",
          investigationTargets: {
            businessesToVerify: ["Any organization mentioned in the communication"],
            contactsToCheck: ["All contact methods provided"],
            suspiciousPatterns: ["Communication method and verification requests"],
            searchQueries: ["Official organization verification", "Scam reports for similar patterns"]
          },
          analysisType: "basic",
          upgradeAvailable: true
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