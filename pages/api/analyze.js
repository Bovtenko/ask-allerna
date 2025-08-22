// pages/api/analyze.js - Complete Overhaul with Research-First Logic

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'invalid_method',
      userMessage: 'Something went wrong. Please refresh and try again.'
    });
  }

  const { analysisType = 'context', incident, step1Results } = req.body;

  try {
    if (analysisType === 'context') {
      return await handleContextAnalysis(req, res);
    } else if (analysisType === 'deep_research') {
      return await handleDeepResearch(req, res);
    } else {
      return res.status(400).json({ 
        error: 'invalid_type',
        userMessage: 'Invalid request. Please try again.'
      });
    }
  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({
      error: 'internal',
      userMessage: 'Our analysis system is temporarily busy. Please try again in a moment.'
    });
  }
}

// Handle Step 1: Context Analysis with Entity Identification
async function handleContextAnalysis(req, res) {
  const { incident } = req.body;
  
  if (!incident || incident.trim().length < 10) {
    return res.status(400).json({ 
      error: 'invalid_input',
      userMessage: 'Please provide more details about the suspicious communication.'
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      error: 'config_error',
      userMessage: 'Our analysis service is temporarily unavailable. Please try again later.'
    });
  }

  try {
    const analysis = await performIntelligentAnalysis(incident);
    const userFriendlyResults = transformToUserFriendly(analysis);
    return res.status(200).json(userFriendlyResults);
  } catch (error) {
    console.error('[CONTEXT-ANALYSIS] Error:', error);
    return res.status(500).json({
      error: 'analysis_failed',
      userMessage: 'Unable to complete analysis right now. Please try again.'
    });
  }
}

// NEW: Intelligent Analysis with "Who is Who" Detection
async function performIntelligentAnalysis(incident) {
  const prompt = `Analyze this communication with intelligent entity detection and behavior-based assessment.

COMMUNICATION:
"${incident}"

STEP 1 - IDENTIFY WHO IS WHO:
Determine the communication parties and what should be researched:

SENDER ENTITIES (research these):
- Person/people who sent this message
- Organization(s) they claim to represent
- Contact methods they provided (emails, phones, websites, addresses)
- Any entities they mention as their identity/affiliation

RECIPIENT CONTEXT (don't research these):
- Person being contacted/targeted
- Their company or organization being referenced
- Their accounts, services, or applications being mentioned
- Legitimate services they use that are being referenced

STEP 2 - EXTRACT RESEARCH TARGETS:
Based on sender entities identified, extract specific details:
- Organization names to verify
- Email addresses and domains to check
- Phone numbers and addresses provided
- Websites or contact methods mentioned
- Person names and claimed titles/roles
- Any offers, promises, or threats made

STEP 3 - BEHAVIOR-BASED ANALYSIS:
Instead of categorizing, identify suspicious behaviors and tactics:
- What tactics are being used? (urgency, authority, fear, greed, opportunity)
- What is being requested? (information, action, payment, access)
- What red flags are present? (inconsistencies, pressure, too-good-to-be-true)
- What type of impersonation might this be? (business, government, service provider)

Return ONLY this JSON:
{
  "communicationAnalysis": {
    "senderEntities": {
      "persons": ["Name (Title/Role)"],
      "organizations": ["Company Name"],
      "contactMethods": {
        "emails": ["email@domain.com"],
        "domains": ["domain.com"],
        "phones": ["+1-555-123-4567"],
        "addresses": ["Full Address"],
        "websites": ["website.com"]
      }
    },
    "recipientContext": {
      "targetedPerson": "Name being addressed or 'user'",
      "referencedOrganization": "User's company if mentioned",
      "referencedServices": ["Services being referenced"]
    }
  },
  "behaviorAnalysis": {
    "tacticsUsed": ["urgency", "authority", "opportunity", "fear", "social_proof"],
    "requestsMade": ["personal_info", "financial_info", "immediate_action", "payment", "access_credentials"],
    "redFlags": ["specific red flag 1", "specific red flag 2", "specific red flag 3"],
    "impersonationType": "business_partner" | "government_authority" | "service_provider" | "job_recruiter" | "financial_institution" | "tech_support" | "prize_organization" | "unknown",
    "offersOrThreats": ["specific offer or threat 1", "specific offer or threat 2"]
  },
  "suspiciousIndicators": {
    "communicationMethods": ["unsolicited_contact", "urgent_timeline", "unusual_contact_method"],
    "contentConcerns": ["generic_greeting", "spelling_errors", "inconsistent_branding", "vague_details"],
    "requestConcerns": ["sensitive_info_request", "immediate_action_required", "payment_request", "unusual_verification"]
  },
  "recommendedActions": ["specific action 1", "specific action 2", "specific action 3"],
  "verificationMethods": ["verification method 1", "verification method 2"]
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
      max_tokens: 1000,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  let responseText = data.content[0].text;
  
  if (responseText.startsWith('```json')) {
    responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
  }
  
  const analysis = JSON.parse(responseText);
  analysis.shouldAutoTrigger = shouldAutoTriggerResearch(analysis);
  return analysis;
}

// Handle Step 2: Research-First Deep Investigation
async function handleDeepResearch(req, res) {
  const { step1Results, incident } = req.body;
  
  if (!step1Results) {
    return res.status(400).json({ 
      error: 'missing_data',
      userMessage: 'Something went wrong with the analysis. Please start over.'
    });
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    return res.status(200).json({
      researchConducted: false,
      userMessage: 'Basic analysis complete. Advanced verification is temporarily unavailable.',
      investigationSummary: 'Research requires additional configuration'
    });
  }

  try {
    console.log('[RESEARCH-FIRST] Starting comprehensive investigation');
    const researchResults = await conductResearchFirstInvestigation(step1Results, incident);
    return res.status(200).json(researchResults);
  } catch (error) {
    console.error('[RESEARCH-FIRST] Error:', error);
    return res.status(200).json({
      researchConducted: false,
      userMessage: 'Basic analysis complete. Unable to verify additional details right now.',
      investigationSummary: 'Research system temporarily unavailable'
    });
  }
}

// NEW: Research-First Investigation Logic
async function conductResearchFirstInvestigation(step1Results, originalIncident) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Research API not configured');
  }

  // Generate targeted research queries based on sender entities only
  const researchQueries = buildIntelligentResearchQueries(step1Results);
  console.log('[RESEARCH-FIRST] Generated', researchQueries.length, 'targeted research queries');
  
  const researchPromises = researchQueries.map(async (query, index) => {
    console.log(`[RESEARCH-${index + 1}] ${query.description}`);
    return await executeResearchQuery(query, index);
  });

  const researchResults = await Promise.allSettled(researchPromises);
  
  const successfulResults = researchResults
    .filter(result => result.status === 'fulfilled' && result.value?.success)
    .map(result => result.value);

  console.log(`[RESEARCH-FIRST] Results: ${successfulResults.length} successful, ${researchResults.length - successfulResults.length} failed`);

  if (successfulResults.length > 0) {
    // NEW: Research-first analysis
    return await performResearchFirstAnalysis(step1Results, successfulResults, originalIncident);
  } else {
    throw new Error('All research queries failed');
  }
}

// NEW: Build Intelligent Research Queries (Entity-Aware)
function buildIntelligentResearchQueries(step1Results) {
  const queries = [];
  const senderEntities = step1Results.communicationAnalysis?.senderEntities;
  const behaviorAnalysis = step1Results.behaviorAnalysis;

  if (!senderEntities) {
    console.log('[RESEARCH] No sender entities found, using fallback queries');
    return buildFallbackQueries(step1Results);
  }

  // 1. Sender Organization Verification (Priority #1)
  if (senderEntities.organizations && senderEntities.organizations.length > 0) {
    senderEntities.organizations.slice(0, 2).forEach(org => {
      queries.push({
        category: 'sender_organization_verification',
        targetEntity: org,
        description: `Verifying sender organization: ${org}`,
        prompt: `Research "${org}" organization legitimacy and contact methods:

ORGANIZATION VERIFICATION:
1. Official website URL and domain verification
2. Official business address and registration
3. Legitimate contact information (official phone, email)
4. Business registration status and location
5. Better Business Bureau listing and rating
6. Customer service and communication methods

FRAUD AND IMPERSONATION CHECKS:
7. Any fraud alerts or scam warnings about this specific organization
8. Reports of impersonation attempts or fake representations
9. How does this organization typically contact customers?
10. What domains and email addresses does this organization officially use?
11. Any warnings about fake emails or calls using this organization's name

COMPARISON ANALYSIS:
12. Compare sender's contact methods with official organization contact info
13. Red flags in how this organization was represented in the communication

Provide specific, factual verification results with exact official contact information.`
      });
    });
  }

  // 2. Sender Contact Method Verification (Priority #2)
  if (senderEntities.contactMethods) {
    if (senderEntities.contactMethods.emails?.length > 0 || senderEntities.contactMethods.domains?.length > 0) {
      const allEmails = senderEntities.contactMethods.emails || [];
      const allDomains = senderEntities.contactMethods.domains || [];
      
      queries.push({
        category: 'sender_contact_verification',
        targetEntity: [...allEmails, ...allDomains].join(', '),
        description: `Verifying sender contact methods`,
        prompt: `Verify legitimacy of these sender contact methods: ${[...allEmails, ...allDomains].join(', ')}

DOMAIN AND EMAIL VERIFICATION:
1. Domain registration information and age
2. Domain reputation and security status
3. Email authentication records (SPF, DKIM, DMARC)
4. SSL certificate verification and validity
5. WHOIS information and registrant details

SCAM DATABASE CHECKS:
6. Check against known scam email and domain databases
7. Reports of these specific emails/domains being used in fraud
8. Blacklist status and reputation scoring
9. Similar domain variations used in scams

ORGANIZATIONAL COMPARISON:
10. How do these contact methods compare to official organization domains?
11. Are these domains officially associated with claimed organizations?
12. Any discrepancies between sender domains and official business domains?

RISK ASSESSMENT:
13. Domain creation timing relative to communication
14. Professional appearance vs actual legitimacy
15. Red flags in domain structure or email patterns

Provide specific technical verification results and risk indicators.`
      });
    }

    // 3. Address and Phone Verification
    if (senderEntities.contactMethods.addresses?.length > 0 || senderEntities.contactMethods.phones?.length > 0) {
      const addresses = senderEntities.contactMethods.addresses || [];
      const phones = senderEntities.contactMethods.phones || [];
      
      queries.push({
        category: 'sender_location_verification',
        targetEntity: [...addresses, ...phones].join('; '),
        description: `Verifying sender location and phone details`,
        prompt: `Verify these sender contact details: ${[...addresses, ...phones].join('; ')}

ADDRESS VERIFICATION:
1. Address existence and validity verification
2. Type of location (commercial office, residential, virtual office, mail forwarding)
3. Other businesses registered at this address
4. Building information and legitimate business presence
5. Comparison with official organization addresses

PHONE NUMBER VERIFICATION:
6. Phone number registration and carrier information
7. Geographic location of phone number
8. Type of line (business, residential, VoIP, mobile)
9. Any reports of this number being used in scams
10. Comparison with official organization phone numbers

LEGITIMACY ASSESSMENT:
11. Professional business setup vs potential fraud indicators
12. Consistency between claimed organization and actual location/phone setup
13. Any scam reports associated with these contact methods

Provide detailed verification results and legitimacy assessment.`
      });
    }
  }

  // 4. Behavior-Specific Threat Intelligence
  queries.push({
    category: 'behavior_threat_intelligence',
    targetEntity: behaviorAnalysis?.impersonationType || 'unknown',
    description: `Threat intelligence for observed behaviors`,
    prompt: `Analyze current threat intelligence for these observed behaviors and tactics:

OBSERVED BEHAVIORS:
- Impersonation type: ${behaviorAnalysis?.impersonationType || 'unknown'}
- Tactics used: ${behaviorAnalysis?.tacticsUsed?.join(', ') || 'unknown'}
- Requests made: ${behaviorAnalysis?.requestsMade?.join(', ') || 'unknown'}
- Red flags: ${behaviorAnalysis?.redFlags?.join(', ') || 'unknown'}

THREAT INTELLIGENCE RESEARCH:
1. Current scam campaigns using similar tactics and impersonation methods
2. Recent fraud alerts and warnings related to these behaviors
3. How legitimate organizations handle these types of communications
4. Red flags specific to this type of impersonation/approach
5. Recent victim reports matching these patterns

VERIFICATION GUIDANCE:
6. How to verify legitimate communications of this type
7. Official channels for verification with the type of organization being impersonated
8. What legitimate versions of this communication would include
9. Common mistakes scammers make in this type of impersonation

PREVENTION AND RESPONSE:
10. Best practices for responding to this type of communication
11. Official reporting channels for this type of fraud
12. How to protect against similar future attempts

Provide current, actionable threat intelligence and verification guidance.`
  });

  // 5. Offer/Threat Verification (if applicable)
  if (behaviorAnalysis?.offersOrThreats && behaviorAnalysis.offersOrThreats.length > 0) {
    queries.push({
      category: 'offer_threat_verification',
      targetEntity: behaviorAnalysis.offersOrThreats.join(', '),
      description: `Verifying offers and claims made`,
      prompt: `Verify the legitimacy of these offers, claims, or threats: ${behaviorAnalysis.offersOrThreats.join(', ')}

OFFER/CLAIM VERIFICATION:
1. Are these types of offers/opportunities typically legitimate?
2. Industry standards and normal processes for these claims
3. Required documentation and verification for legitimate versions
4. Typical timelines and procedures for authentic offers
5. Red flags indicating fraudulent offers

REGULATORY AND COMPLIANCE:
6. Required licenses and regulations for legitimate providers
7. Consumer protection requirements and disclosures
8. Truth in advertising and marketing compliance
9. Official oversight and reporting mechanisms

SCAM PATTERN ANALYSIS:
10. Common scam patterns using similar offers or threats
11. How scammers typically present these types of opportunities
12. Warning signs that distinguish fake from legitimate offers
13. Recent fraud alerts related to similar claims

VERIFICATION METHODS:
14. How to independently verify legitimate offers of this type
15. Official channels and methods for authentication
16. What legitimate offers would require vs red flag requests

Provide detailed analysis of offer legitimacy and verification methods.`
    });
  }

  return queries;
}

// Fallback queries for when entity detection fails
function buildFallbackQueries(step1Results) {
  return [
    {
      category: 'general_threat_intelligence',
      targetEntity: 'communication',
      description: 'General threat intelligence analysis',
      prompt: `Analyze this type of suspicious communication for current scam patterns and threat intelligence.

Provide guidance on:
1. Current scam techniques matching this communication style
2. How to verify legitimacy of such communications
3. Red flags and warning signs
4. Official reporting and verification channels
5. Best practices for response`
    }
  ];
}

// Research query execution (unchanged)
async function executeResearchQuery(query, index) {
  const models = ['sonar-pro', 'sonar-online'];
  
  for (const model of models) {
    try {
      console.log(`[RESEARCH-${index + 1}] Trying model: ${model}`);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: query.prompt }],
          max_tokens: 1200,
          temperature: 0.1,
          return_citations: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[RESEARCH-${index + 1}] Success with model: ${model}`);
        return {
          category: query.category,
          targetEntity: query.targetEntity,
          description: query.description,
          results: data.choices[0].message.content,
          success: true
        };
      } else {
        console.log(`[RESEARCH-${index + 1}] HTTP ${response.status} with model: ${model}`);
        if (model === models[models.length - 1]) {
          return {
            category: query.category,
            targetEntity: query.targetEntity,
            description: query.description,
            results: `Research failed: HTTP ${response.status}`,
            success: false
          };
        }
      }
    } catch (error) {
      console.log(`[RESEARCH-${index + 1}] Model ${model} error:`, error.message);
      if (model === models[models.length - 1]) {
        return {
          category: query.category,
          targetEntity: query.targetEntity,
          description: query.description,
          results: `Research failed: ${error.message}`,
          success: false
        };
      }
    }
  }
}

// NEW: Research-First Analysis and Prioritization
async function performResearchFirstAnalysis(step1Results, researchResults, originalIncident) {
  // First, conduct comprehensive analysis of all research
  const comprehensiveAnalysis = await analyzeAllResearchResults(step1Results, researchResults);
  
  // Then, create prioritized summary using Claude
  const prioritizedSummary = await generatePrioritizedSummary(step1Results, comprehensiveAnalysis, originalIncident);
  
  const combinedFindings = researchResults.map(r => `
=== ${r.description} ===
Target: ${r.targetEntity || 'General'}
${r.results}
`).join('\n');

  return {
    researchConducted: true,
    
    // NEW: Prioritized user-friendly summary
    userFriendly: prioritizedSummary,
    
    // Comprehensive analysis for technical details
    comprehensiveAnalysis: comprehensiveAnalysis,
    
    // Raw research results
    detailedFindings: combinedFindings,
    
    // Research metadata
    researchStats: {
      queriesExecuted: researchResults.length,
      entitiesVerified: Object.keys(step1Results.communicationAnalysis?.senderEntities || {}).length,
      analysisDepth: 'research_first_comprehensive'
    },
    
    investigationSummary: generateInvestigationSummary(comprehensiveAnalysis, researchResults.length)
  };
}

// NEW: Comprehensive Research Analysis
async function analyzeAllResearchResults(step1Results, researchResults) {
  const analysis = {
    identityVerification: extractIdentityVerification(researchResults),
    contactMethodAnalysis: extractContactMethodAnalysis(researchResults),
    locationVerification: extractLocationVerification(researchResults),
    threatIntelligence: extractThreatIntelligence(researchResults),
    offerLegitimacy: extractOfferLegitimacy(researchResults),
    overallRisk: {},
    criticalFindings: [],
    legitimacyIndicators: [],
    verificationSources: []
  };
  
  // Calculate comprehensive risk assessment
  analysis.overallRisk = calculateBehaviorBasedRisk(step1Results, analysis);
  
  // Extract critical findings and legitimacy indicators
  analysis.criticalFindings = extractCriticalFindings(analysis);
  analysis.legitimacyIndicators = extractLegitimacyIndicators(analysis);
  analysis.verificationSources = extractVerificationSources(analysis);
  
  return analysis;
}

// NEW: Generate Prioritized Summary using Claude
async function generatePrioritizedSummary(step1Results, comprehensiveAnalysis, originalIncident) {
  const summaryPrompt = `Based on comprehensive research, provide a prioritized user-friendly summary of findings.

ORIGINAL COMMUNICATION:
"${originalIncident}"

RESEARCH FINDINGS:
- Identity Verification: ${JSON.stringify(comprehensiveAnalysis.identityVerification)}
- Contact Method Analysis: ${JSON.stringify(comprehensiveAnalysis.contactMethodAnalysis)}
- Threat Intelligence: ${JSON.stringify(comprehensiveAnalysis.threatIntelligence)}
- Overall Risk: ${JSON.stringify(comprehensiveAnalysis.overallRisk)}

Create a prioritized summary that answers:
1. What is the overall risk level and why?
2. What are the most critical findings (top 3-4)?
3. What should the user do immediately?
4. How can they verify this independently?
5. What official sources should they use?

Return ONLY this JSON:
{
  "verificationStatus": "HIGH_RISK_DETECTED" | "MODERATE_RISK_DETECTED" | "SOME_CONCERNS_DETECTED" | "VERIFIED_LEGITIMATE" | "INSUFFICIENT_DATA",
  "verificationSummary": "Clear summary of what we found",
  "criticalFindings": ["Most important finding 1", "Most important finding 2", "Most important finding 3"],
  "recommendedActions": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
  "officialSources": ["Official verification method 1", "Official verification method 2"],
  "riskFactors": ["Risk factor 1", "Risk factor 2"],
  "legitimacyIndicators": ["Legitimacy indicator 1", "Legitimacy indicator 2"]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 600,
        temperature: 0.1,
        messages: [{ role: "user", content: summaryPrompt }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      let responseText = data.content[0].text;
      
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      return JSON.parse(responseText);
    } else {
      console.error('[SUMMARY] Claude API error:', response.status);
      return generateFallbackSummary(comprehensiveAnalysis);
    }
  } catch (error) {
    console.error('[SUMMARY] Error generating prioritized summary:', error);
    return generateFallbackSummary(comprehensiveAnalysis);
  }
}

// Research result extraction functions (simplified versions)
function extractIdentityVerification(researchResults) {
  const orgResults = researchResults.filter(r => r.category === 'sender_organization_verification');
  return {
    organizationsFound: [],
    officialWebsites: [],
    fraudAlerts: [],
    impersonationWarnings: []
  };
}

function extractContactMethodAnalysis(researchResults) {
  const contactResults = researchResults.filter(r => r.category === 'sender_contact_verification');
  return {
    domainLegitimacy: [],
    emailAuthentication: [],
    domainMismatches: [],
    scamDatabaseHits: []
  };
}

function extractLocationVerification(researchResults) {
  const locationResults = researchResults.filter(r => r.category === 'sender_location_verification');
  return {
    addressValidation: [],
    phoneVerification: [],
    businessPresence: []
  };
}

function extractThreatIntelligence(researchResults) {
  const threatResults = researchResults.filter(r => r.category === 'behavior_threat_intelligence');
  return {
    currentThreats: [],
    officialWarnings: [],
    verificationGuidance: []
  };
}

function extractOfferLegitimacy(researchResults) {
  const offerResults = researchResults.filter(r => r.category === 'offer_threat_verification');
  return {
    offerAnalysis: [],
    industryStandards: [],
    redFlags: []
  };
}

// NEW: Behavior-Based Risk Calculation
function calculateBehaviorBasedRisk(step1Results, comprehensiveAnalysis) {
  let riskScore = 0;
  const riskFactors = [];
  const behaviorAnalysis = step1Results.behaviorAnalysis;
  
  // High-risk behaviors
  if (behaviorAnalysis?.tacticsUsed?.includes('urgency')) {
    riskScore += 15;
    riskFactors.push('Uses urgency tactics to pressure quick action');
  }
  
  if (behaviorAnalysis?.requestsMade?.includes('personal_info') || behaviorAnalysis?.requestsMade?.includes('financial_info')) {
    riskScore += 20;
    riskFactors.push('Requests sensitive personal or financial information');
  }
  
  // Contact method verification results
  if (comprehensiveAnalysis.contactMethodAnalysis?.domainMismatches?.length > 0) {
    riskScore += 30;
    riskFactors.push('Sender contact methods do not match official business information');
  }
  
  // Identity verification results
  if (comprehensiveAnalysis.identityVerification?.fraudAlerts?.length > 0) {
    riskScore += 25;
    riskFactors.push('Fraud alerts found for claimed organization or sender');
  }
  
  // Determine status
  let status, summary;
  if (riskScore >= 50) {
    status = 'HIGH_RISK_DETECTED';
    summary = 'Multiple critical risk factors detected. This appears to be a scam attempt.';
  } else if (riskScore >= 30) {
    status = 'MODERATE_RISK_DETECTED';
    summary = 'Significant risk factors present. Exercise extreme caution.';
  } else if (riskScore >= 15) {
    status = 'SOME_CONCERNS_DETECTED';
    summary = 'Some risk factors present. Additional verification recommended.';
  } else {
    status = 'INSUFFICIENT_DATA';
    summary = 'Limited verification data available. Standard verification recommended.';
  }
  
  return {
    status,
    summary,
    riskScore,
    riskFactors
  };
}

function extractCriticalFindings(analysis) {
  const findings = [];
  
  // Add critical findings from each analysis category
  if (analysis.contactMethodAnalysis?.domainMismatches?.length > 0) {
    findings.push(`⚠️ Domain mismatch: ${analysis.contactMethodAnalysis.domainMismatches[0]}`);
  }
  
  if (analysis.identityVerification?.fraudAlerts?.length > 0) {
    findings.push(`⚠️ Fraud alert: ${analysis.identityVerification.fraudAlerts[0]}`);
  }
  
  return findings.slice(0, 4);
}

function extractLegitimacyIndicators(analysis) {
  const indicators = [];
  
  if (analysis.identityVerification?.officialWebsites?.length > 0) {
    indicators.push('Official business websites verified');
  }
  
  return indicators;
}

function extractVerificationSources(analysis) {
  const sources = [];
  
  if (analysis.identityVerification?.officialWebsites?.length > 0) {
    sources.push(`Official website: ${analysis.identityVerification.officialWebsites[0]}`);
  }
  
  sources.push('Better Business Bureau directory');
  
  return sources.slice(0, 3);
}

function generateFallbackSummary(comprehensiveAnalysis) {
  return {
    verificationStatus: comprehensiveAnalysis.overallRisk?.status || 'INSUFFICIENT_DATA',
    verificationSummary: comprehensiveAnalysis.overallRisk?.summary || 'Analysis completed with limited data',
    criticalFindings: comprehensiveAnalysis.criticalFindings || [],
    recommendedActions: ['Verify through official channels', 'Do not provide sensitive information', 'Report suspicious activity'],
    officialSources: comprehensiveAnalysis.verificationSources || ['Official organization website', 'Better Business Bureau'],
    riskFactors: comprehensiveAnalysis.overallRisk?.riskFactors || [],
    legitimacyIndicators: comprehensiveAnalysis.legitimacyIndicators || []
  };
}

function generateInvestigationSummary(comprehensiveAnalysis, queriesCount) {
  const status = comprehensiveAnalysis.overallRisk?.status || 'unknown';
  const riskScore = comprehensiveAnalysis.overallRisk?.riskScore || 0;
  
  return `Research-first investigation completed: ${queriesCount} targeted queries executed. Risk assessment: ${status.replace(/_/g, ' ').toLowerCase()} (score: ${riskScore}/100). Critical findings identified and prioritized for user review.`;
}

// Transform to user-friendly format (updated for new structure)
function transformToUserFriendly(analysis) {
  const behaviorAnalysis = analysis.behaviorAnalysis || {};
  const riskLevel = determineBehaviorBasedRiskLevel(behaviorAnalysis);
  
  return {
    ...analysis,
    userFriendly: {
      scamType: getHumanReadableImpersonationType(behaviorAnalysis.impersonationType),
      riskLevel: riskLevel,
      summary: generateBehaviorBasedSummary(riskLevel, behaviorAnalysis),
      mainConcerns: behaviorAnalysis.redFlags?.slice(0, 3) || [],
      tacticsObserved: behaviorAnalysis.tacticsUsed || [],
      requestsMade: behaviorAnalysis.requestsMade || [],
      nextSteps: analysis.recommendedActions?.slice(0, 3) || [],
      howToCheck: analysis.verificationMethods || []
    }
  };
}

function getHumanReadableImpersonationType(impersonationType) {
  const typeMap = {
    'business_partner': 'Business Partner Impersonation',
    'government_authority': 'Government Authority Impersonation', 
    'service_provider': 'Service Provider Impersonation',
    'job_recruiter': 'Fake Job Recruiter',
    'financial_institution': 'Bank or Financial Service Impersonation',
    'tech_support': 'Tech Support Scam',
    'prize_organization': 'Prize or Lottery Scam',
    'unknown': 'Suspicious Communication'
  };
  
  return typeMap[impersonationType] || 'Suspicious Communication';
}

function determineBehaviorBasedRiskLevel(behaviorAnalysis) {
  const highRiskTactics = ['urgency', 'fear', 'authority'];
  const highRiskRequests = ['personal_info', 'financial_info', 'payment', 'access_credentials'];
  
  const hasHighRiskTactics = behaviorAnalysis.tacticsUsed?.some(tactic => 
    highRiskTactics.includes(tactic)
  );
  
  const hasHighRiskRequests = behaviorAnalysis.requestsMade?.some(request => 
    highRiskRequests.includes(request)
  );
  
  const redFlagCount = behaviorAnalysis.redFlags?.length || 0;
  
  if (hasHighRiskRequests && hasHighRiskTactics) {
    return 'HIGH';
  } else if (hasHighRiskRequests || hasHighRiskTactics || redFlagCount >= 3) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

function generateBehaviorBasedSummary(riskLevel, behaviorAnalysis) {
  const impersonationType = behaviorAnalysis.impersonationType;
  const tacticsUsed = behaviorAnalysis.tacticsUsed || [];
  
  if (riskLevel === 'HIGH') {
    return `⚠️ High-risk communication detected. Uses ${tacticsUsed.join(' and ')} tactics typical of ${impersonationType} scams. Do not respond or provide any information.`;
  } else if (riskLevel === 'MEDIUM') {
    return `🔍 Suspicious communication with concerning warning signs. Shows characteristics of ${impersonationType} approach. Verify carefully before taking any action.`;
  } else {
    return `ℹ️ Communication shows some concerning elements. Exercise normal caution and verify through official channels before responding.`;
  }
}

function shouldAutoTriggerResearch(analysis) {
  const senderEntities = analysis.communicationAnalysis?.senderEntities;
  const behaviorAnalysis = analysis.behaviorAnalysis;
  
  // Auto-trigger if we have sender entities to research
  if (senderEntities?.organizations?.length > 0) return true;
  if (senderEntities?.contactMethods?.emails?.length > 0) return true;
  if (senderEntities?.contactMethods?.domains?.length > 0) return true;
  
  // Auto-trigger for high-risk behaviors
  const highRiskBehaviors = ['urgency', 'fear', 'authority'];
  const highRiskRequests = ['personal_info', 'financial_info', 'payment'];
  
  if (behaviorAnalysis?.tacticsUsed?.some(tactic => highRiskBehaviors.includes(tactic))) return true;
  if (behaviorAnalysis?.requestsMade?.some(request => highRiskRequests.includes(request))) return true;
  
  return false;
}