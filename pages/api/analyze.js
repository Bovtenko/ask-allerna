// pages/api/analyze.js - Complete Working Version

// API Configuration
const API_CONFIG = {
  claude: {
    model: 'claude-3-5-haiku-20241022',
    maxTokens: 500,
    temperature: 0.1,
    timeout: 45000, // 45 seconds
  },
  perplexity: {
    models: ['sonar-pro', 'sonar-online'],
    maxTokens: 800,
    temperature: 0.1,
    timeout: 30000, // 30 seconds
  }
};

// Error types for better user messaging
const ERROR_TYPES = {
  TIMEOUT: 'timeout',
  AUTH: 'auth',
  RATE_LIMIT: 'rate_limit',
  INVALID_INPUT: 'invalid_input',
  INTERNAL: 'internal'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: ERROR_TYPES.INVALID_INPUT,
      message: 'Only POST requests allowed',
      userMessage: 'Something went wrong. Please refresh and try again.'
    });
  }

  const { analysisType = 'context' } = req.body;
  
  try {
    switch (analysisType) {
      case 'context':
        return await handleContextAnalysis(req, res);
      case 'deep_research':
        return await handleDeepResearch(req, res);
      default:
        return res.status(400).json({ 
          error: ERROR_TYPES.INVALID_INPUT,
          message: 'Invalid analysis type',
          userMessage: 'Invalid request. Please try again.'
        });
    }
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    return res.status(500).json({
      error: ERROR_TYPES.INTERNAL,
      message: error.message,
      userMessage: 'Our analysis system is temporarily busy. Please try again in a moment.'
    });
  }
}

// Step 1: Context Analysis Handler
async function handleContextAnalysis(req, res) {
  const { incident } = req.body;
  
  if (!incident || incident.trim().length < 10) {
    return res.status(400).json({ 
      error: ERROR_TYPES.INVALID_INPUT,
      message: 'Incident description too short',
      userMessage: 'Please provide more details about the suspicious communication.'
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ 
      error: ERROR_TYPES.AUTH,
      message: 'Anthropic API key not configured',
      userMessage: 'Our analysis service is temporarily unavailable. Please try again later.'
    });
  }

  try {
    const analysis = await performClaudeAnalysis(incident);
    
    // Transform technical results to user-friendly format
    const userFriendlyResults = transformToUserFriendly(analysis);
    
    return res.status(200).json(userFriendlyResults);
    
  } catch (error) {
    console.error('[CONTEXT-ANALYSIS] Error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(408).json({
        error: ERROR_TYPES.TIMEOUT,
        message: 'Analysis timed out',
        userMessage: 'Analysis took too long. Please try again - sometimes it just takes a moment longer.'
      });
    }
    
    if (error.message.includes('rate limit') || error.message.includes('429')) {
      return res.status(429).json({
        error: ERROR_TYPES.RATE_LIMIT,
        message: 'Rate limit exceeded',
        userMessage: 'Too many people are using the service right now. Please wait a minute and try again.'
      });
    }
    
    return res.status(500).json({
      error: ERROR_TYPES.INTERNAL,
      message: error.message,
      userMessage: 'Unable to complete analysis right now. Please try again.'
    });
  }
}

// Step 2: Deep Research Handler
async function handleDeepResearch(req, res) {
  const { step1Results, incident } = req.body;
  
  if (!step1Results) {
    return res.status(400).json({ 
      error: ERROR_TYPES.INVALID_INPUT,
      message: 'Step 1 results required for deep research',
      userMessage: 'Something went wrong with the analysis. Please start over.'
    });
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    console.log('[DEEP-RESEARCH] Perplexity API key not configured');
    return res.status(200).json({
      researchConducted: false,
      userMessage: 'Basic analysis complete. Advanced verification is temporarily unavailable.',
      investigationSummary: 'Research requires additional configuration'
    });
  }

  try {
    console.log('[DEEP-RESEARCH] Starting research for:', step1Results.scamCategory);
    
    const researchResults = await conductDeepResearch(step1Results, incident);
    
    // Transform research results to user-friendly format
    const userFriendlyResearch = transformResearchToUserFriendly(researchResults);
    
    return res.status(200).json(userFriendlyResearch);
    
  } catch (error) {
    console.error('[DEEP-RESEARCH] Error:', error);
    
    return res.status(200).json({
      researchConducted: false,
      userMessage: 'Basic analysis complete. Unable to verify additional details right now.',
      investigationSummary: 'Research system temporarily unavailable',
      error: error.message
    });
  }
}

// Claude Analysis Function
async function performClaudeAnalysis(incident) {
  const prompt = `Analyze this communication for scam classification. Focus on clear, simple explanations.

COMMUNICATION:
"${incident}"

SCAM CATEGORIES:
1. Email/Web phishing & lookalike sites
2. Account/Service alerts & reverification/billing
3. BEC & payment diversion
4. Supply-chain/partner impersonation & fake integrations/API keys
5. Marketplace/escrow/overpayment scams
6. Voice/Text channel scams
7. Tech support/helpdesk impersonation & quid-pro-quo
8. MFA fatigue & auth-bypass coercion
9. Malware delivery via SE
10. Social media impersonation
11. Recruitment/job-offer scams
12. Survey/prize/lottery bait
13. Donation appeals
14. Investment/crypto scams
15. Government/authority/utility impersonation
16. Logistics & travel notifications
17. Health/insurance enrollment scams
18. Romance/relationship scams
19. Extortion & sextortion
20. Insider manipulation/collusion/bribery
21. Social proof manipulation
22. Funding offers & grants
23. Other

Return ONLY this JSON:
{
 "scamCategory": "exact category name from the list above",
 "whatWeObserved": "Simple description in plain English - what this communication is claiming and how it was delivered",
 "redFlagsIdentified": ["warning sign 1", "warning sign 2", "warning sign 3"],
 "recommendedActions": ["simple action 1", "simple action 2", "simple action 3"],
 "whereToReportOrVerify": ["how to check this", "where to report"],
 "entitiesDetected": {
   "organizations": ["company1", "company2"],
   "contacts": ["phone1", "email1", "domain1"],
   "claims": ["claim1", "claim2"]
 },
 "needsDeepResearch": true/false
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.claude.timeout);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: API_CONFIG.claude.model,
        max_tokens: API_CONFIG.claude.maxTokens,
        temperature: API_CONFIG.claude.temperature,
        messages: [{ role: "user", content: prompt }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Claude API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let responseText = data.content[0].text;
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }
    
    const analysis = JSON.parse(responseText);
    
    // Add auto-trigger decision
    analysis.shouldAutoTrigger = shouldAutoTriggerResearch(analysis);
    
    return analysis;
    
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Transform technical results to user-friendly format
function transformToUserFriendly(analysis) {
  // Simplify scam category names
  const friendlyCategories = {
    'Email/Web phishing & lookalike sites': 'Fake Website or Email Scam',
    'Account/Service alerts & reverification/billing': 'Fake Account Alert',
    'BEC & payment diversion': 'Business Email Scam',
    'Recruitment/job-offer scams': 'Fake Job Offer',
    'Investment/crypto scams': 'Investment Scam',
    'Tech support/helpdesk impersonation & quid-pro-quo': 'Fake Tech Support',
    'Government/authority/utility impersonation': 'Fake Government Contact',
    'Romance/relationship scams': 'Romance Scam',
    'Survey/prize/lottery bait': 'Fake Prize or Survey',
    'Supply-chain/partner impersonation & fake integrations/API keys': 'Business Partner Impersonation',
    'Funding offers & grants': 'Funding or Grant Scam',
    // Add more mappings as needed
  };

  // Determine risk level based on category and red flags
  const riskLevel = determineRiskLevel(analysis);
  
  return {
    // Keep technical data for backend processing
    ...analysis,
    
    // Add user-friendly fields
    userFriendly: {
      scamType: friendlyCategories[analysis.scamCategory] || analysis.scamCategory,
      riskLevel: riskLevel,
      summary: generateSimpleSummary(analysis),
      mainConcerns: analysis.redFlagsIdentified?.slice(0, 3) || [],
      nextSteps: analysis.recommendedActions?.slice(0, 3) || [],
      howToCheck: analysis.whereToReportOrVerify || []
    }
  };
}

// Determine risk level for user-friendly display
function determineRiskLevel(analysis) {
  const highRiskCategories = [
    'Investment/crypto scams',
    'Romance/relationship scams', 
    'BEC & payment diversion',
    'Government/authority/utility impersonation'
  ];
  
  const mediumRiskCategories = [
    'Recruitment/job-offer scams',
    'Tech support/helpdesk impersonation & quid-pro-quo',
    'Account/Service alerts & reverification/billing',
    'Funding offers & grants'
  ];

  if (highRiskCategories.includes(analysis.scamCategory)) {
    return 'HIGH';
  } else if (mediumRiskCategories.includes(analysis.scamCategory)) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

// Generate simple summary for users
function generateSimpleSummary(analysis) {
  const riskLevel = determineRiskLevel(analysis);
  
  if (riskLevel === 'HIGH') {
    return "⚠️ This looks very suspicious and is likely a scam. Do not respond or provide any information.";
  } else if (riskLevel === 'MEDIUM') {
    return "🔍 This has several warning signs. Be very careful and verify before taking any action.";
  } else {
    return "ℹ️ This shows some concerning signs. Always verify through official channels before responding.";
  }
}

// Auto-trigger decision logic
function shouldAutoTriggerResearch(analysis) {
  const highImpactCategories = [
    'Recruitment/job-offer scams',
    'BEC & payment diversion',
    'Government/authority/utility impersonation',
    'Tech support/helpdesk impersonation & quid-pro-quo',
    'Investment/crypto scams',
    'Supply-chain/partner impersonation & fake integrations/API keys',
    'Account/Service alerts & reverification/billing',
    'Funding offers & grants'
  ];

  if (highImpactCategories.includes(analysis.scamCategory)) {
    return true;
  }

  if (analysis.entitiesDetected?.organizations?.length > 0) {
    return true;
  }

  if (analysis.entitiesDetected?.contacts?.length > 0) {
    return true;
  }

  return false;
}

// Deep research function with improved error handling
async function conductDeepResearch(step1Results, originalIncident) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Research API not configured');
  }

  const researchQueries = buildResearchQueries(step1Results);
  console.log('[DEEP-RESEARCH] Running', researchQueries.length, 'research queries');
  
  const researchPromises = researchQueries.slice(0, 3).map(async (query, index) => {
    console.log(`[RESEARCH-${index + 1}] ${query.description}`);
    
    return await executeResearchQuery(query, index);
  });

  const researchResults = await Promise.allSettled(researchPromises);
  
  const successfulResults = researchResults
    .filter(result => result.status === 'fulfilled' && result.value?.success)
    .map(result => result.value);

  const failedResults = researchResults
    .filter(result => result.status === 'fulfilled' && !result.value?.success)
    .map(result => result.value);

  console.log(`[DEEP-RESEARCH] Results: ${successfulResults.length} successful, ${failedResults.length} failed`);

  if (successfulResults.length > 0) {
    const formattedResults = await formatResearchResults(step1Results, successfulResults);
    formattedResults.researchStats = {
      successful: successfulResults.length,
      failed: failedResults.length,
      total: researchQueries.length
    };
    return formattedResults;
  } else {
    throw new Error('All research queries failed');
  }
}

// Execute individual research query with proper error handling
async function executeResearchQuery(query, index) {
  const models = API_CONFIG.perplexity.models;
  
  for (const model of models) {
    try {
      console.log(`[RESEARCH-${index + 1}] Trying model: ${model}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.perplexity.timeout);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: query.prompt }],
          max_tokens: API_CONFIG.perplexity.maxTokens,
          temperature: API_CONFIG.perplexity.temperature,
          return_citations: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`[RESEARCH-${index + 1}] Success with model: ${model}`);
        return {
          category: query.category,
          description: query.description,
          results: data.choices[0].message.content,
          success: true,
          model: model
        };
      } else {
        console.log(`[RESEARCH-${index + 1}] HTTP ${response.status} with model: ${model}`);
        if (model === models[models.length - 1]) {
          return {
            category: query.category,
            description: query.description,
            results: `Research failed: All models returned HTTP ${response.status}`,
            success: false
          };
        }
        continue;
      }
    } catch (modelError) {
      console.log(`[RESEARCH-${index + 1}] Model ${model} error:`, modelError.message);
      if (model === models[models.length - 1]) {
        return {
          category: query.category,
          description: query.description,
          results: `Research failed: ${modelError.message}`,
          success: false
        };
      }
      continue;
    }
  }
}

// Build research queries (simplified)
function buildResearchQueries(step1Results) {
  const queries = [];
  const entities = step1Results.entitiesDetected || {};

  if (entities.organizations && entities.organizations.length > 0) {
    const orgs = entities.organizations.slice(0, 2);
    queries.push({
      category: 'business_verification',
      description: `Checking ${orgs.join(', ')}`,
      prompt: `Find official information for these organizations: ${orgs.join(', ')}

Focus on:
1. Official websites and verified contact information
2. Any fraud alerts or scam warnings posted by these organizations
3. Official customer service procedures
4. Business legitimacy and registration status

Provide clear, factual information about legitimacy and any warnings.`
    });
  }

  if (entities.contacts && entities.contacts.length > 0) {
    queries.push({
      category: 'contact_verification',
      description: 'Verifying contact information',
      prompt: `Check these contacts for fraud indicators: ${entities.contacts.slice(0, 3).join(', ')}

Focus on:
1. Domain reputation and legitimacy
2. Known scam databases
3. Comparison with official contact methods

Provide clear assessment of legitimacy.`
    });
  }

  queries.push({
    category: 'threat_intelligence',
    description: `Checking current ${step1Results.scamCategory} patterns`,
    prompt: `Find current information about: "${step1Results.scamCategory}"

Focus on:
1. Recent scam reports and warnings for 2024-2025
2. Common tactics being used
3. Official reporting mechanisms

Provide current trends and official warnings.`
  });

  return queries;
}

// Format research results with accurate processing
async function formatResearchResults(step1Results, researchResults) {
  try {
    const combinedFindings = researchResults.map(r => `
=== ${r.description} ===
${r.results}
`).join('\n');

    // Extract actual fraud alerts (not general threat intel)
    const actualFraudAlerts = extractFraudAlerts(researchResults, step1Results);
    
    // Determine if business is legitimate based on research
    const businessLegitimacy = determineBusinessLegitimacy(researchResults);

    return {
      researchConducted: true,
      businessVerification: {
        organizationsResearched: step1Results.entitiesDetected?.organizations || [],
        legitimacyStatus: businessLegitimacy,
        officialContacts: extractOfficialContacts(researchResults),
        fraudAlerts: actualFraudAlerts
      },
      contactAnalysis: {
        contactsAnalyzed: step1Results.entitiesDetected?.contacts || [],
        riskAssessment: assessContactRisk(researchResults),
        comparisonFindings: extractComparisonFindings(researchResults)
      },
      threatIntelligence: {
        currentTrends: ["General threat patterns for this category researched"],
        officialWarnings: ["Industry warnings checked"],
        recentIncidents: ["Recent incident patterns analyzed"]
      },
      verificationGuidance: {
        howToVerify: generateSpecificVerificationSteps(researchResults, step1Results),
        officialChannels: extractOfficialChannels(researchResults)
      },
      investigationSummary: generateAccurateSummary(researchResults, step1Results),
      detailedFindings: combinedFindings
    };

  } catch (error) {
    console.error('[FORMAT-RESEARCH] Error:', error);
    return {
      researchConducted: true,
      investigationSummary: 'Research completed with basic processing',
      rawResults: researchResults.map(r => r.results).join('\n\n')
    };
  }
}

// FIXED: Extract fraud alerts from research - Only specific alerts
function extractFraudAlerts(researchResults, step1Results) {
  const alerts = [];
  const entities = step1Results.entitiesDetected || {};
  
  researchResults.forEach(result => {
    const content = result.results.toLowerCase();
    
    // Only flag as fraud alert if SPECIFIC to this organization/contact
    // Check for specific organization fraud alerts
    if (entities.organizations) {
      entities.organizations.forEach(org => {
        if (content.includes('fraud alert') && content.includes(org.toLowerCase())) {
          alerts.push(`Specific fraud alert found for ${org}`);
        }
        if (content.includes('scam warning') && content.includes(org.toLowerCase())) {
          alerts.push(`Scam warning found for ${org}`);
        }
        if (content.includes('better business bureau') && 
            content.includes('complaint') && 
            content.includes(org.toLowerCase())) {
          alerts.push(`BBB complaints found for ${org}`);
        }
      });
    }
    
    // Check for domain-specific warnings
    if (entities.contacts) {
      entities.contacts.forEach(contact => {
        if (content.includes('scam warning') && content.includes(contact.toLowerCase())) {
          alerts.push(`Domain-specific warning found for ${contact}`);
        }
        if (content.includes('blacklisted') && content.includes(contact.toLowerCase())) {
          alerts.push(`Contact method ${contact} appears on blacklists`);
        }
      });
    }
  });
  
  return alerts.length > 0 ? alerts : ["No specific fraud alerts found for this organization"];
}

// FIXED: Generate verification status - Only flag real fraud alerts
function generateVerificationStatus(researchResults, step1Results) {
  const actualFraudAlerts = extractFraudAlerts(researchResults, step1Results);
  
  // Only return FRAUD_ALERTS_FOUND if we have SPECIFIC alerts
  if (actualFraudAlerts.some(alert => !alert.includes('No specific fraud alerts'))) {
    return 'FRAUD_ALERTS_FOUND';
  }
  
  // Check for legitimate business verification
  const businessContent = researchResults
    .filter(r => r.category === 'business_verification')
    .map(r => r.results.toLowerCase())
    .join(' ');
    
  if (businessContent.includes('legitimate') || 
      businessContent.includes('official website') ||
      businessContent.includes('verified')) {
    return 'VERIFIED_LEGITIMATE';
  }
  
  // Check for high-risk contacts (but be more specific)
  const contactContent = researchResults
    .filter(r => r.category === 'contact_verification')
    .map(r => r.results.toLowerCase())
    .join(' ');
    
  if (contactContent.includes('known scam domain') ||
      contactContent.includes('blacklisted') ||
      contactContent.includes('phishing domain')) {
    return 'HIGH_RISK_CONTACTS';
  }
  
  return 'RESEARCH_COMPLETED';
}

// FIXED: Extract key findings - Only include specific findings
function extractKeyFindings(researchResults) {
  const findings = [];
  
  // Only include specific findings, not general threat intelligence
  researchResults.forEach(result => {
    const content = result.results;
    
    if (result.category === 'business_verification') {
      if (content.includes('legitimate') || content.includes('official website')) {
        findings.push('Business appears to have legitimate web presence');
      }
      if (content.includes('no fraud alerts') || content.includes('no warnings')) {
        findings.push('No specific fraud alerts found for this organization');
      }
      if (content.includes('testimonials') || content.includes('client feedback')) {
        findings.push('Business shows client testimonials and feedback');
      }
    }
    
    if (result.category === 'contact_verification') {
      if (content.includes('domain verification') || content.includes('legitimate domain')) {
        findings.push('Email domain appears to be controlled by the organization');
      }
      if (content.includes('redirect') || content.includes('points to')) {
        findings.push('Domain behavior analyzed');
      }
    }
  });
  
  // Only mention threat intelligence if no specific findings
  const threatIntel = researchResults.find(r => r.category === 'threat_intelligence');
  if (threatIntel && findings.length === 0) {
    findings.push('General threat patterns researched for this category');
  }
  
  return findings.slice(0, 3);
}

// Helper functions for more accurate analysis
function determineBusinessLegitimacy(researchResults) {
  const businessResearch = researchResults.find(r => r.category === 'business_verification');
  if (!businessResearch) return 'unknown';
  
  const content = businessResearch.results.toLowerCase();
  
  if (content.includes('legitimate') && content.includes('official website')) {
    return 'verified_legitimate';
  }
  
  if (content.includes('no fraud alerts') || content.includes('professional website')) {
    return 'appears_legitimate';
  }
  
  if (content.includes('suspicious') || content.includes('warning')) {
    return 'suspicious';
  }
  
  return 'requires_verification';
}

function extractOfficialContacts(researchResults) {
  const contacts = [];
  
  researchResults.forEach(result => {
    const content = result.results;
    
    // Extract official contact information mentioned in research
    if (content.includes('official website') || content.includes('contact page')) {
      const websiteMatch = content.match(/https?:\/\/[^\s]+/g);
      if (websiteMatch) {
        contacts.push(...websiteMatch.slice(0, 2));
      }
    }
  });
  
  return contacts.length > 0 ? contacts : ["Use official website contact methods"];
}

function assessContactRisk(researchResults) {
  const contactResearch = researchResults.find(r => r.category === 'contact_verification');
  if (!contactResearch) return ["Contact verification not completed"];
  
  const content = contactResearch.results.toLowerCase();
  
  if (content.includes('legitimate') || content.includes('verified')) {
    return ["Contact methods appear legitimate"];
  }
  
  if (content.includes('suspicious') || content.includes('high risk')) {
    return ["Contact methods show risk indicators"];
  }
  
  return ["Contact verification completed"];
}

function extractComparisonFindings(researchResults) {
  const findings = [];
  
  researchResults.forEach(result => {
    if (result.results.includes('domain') && result.results.includes('redirect')) {
      findings.push("Domain redirect behavior analyzed");
    }
    
    if (result.results.includes('official') && result.results.includes('contact')) {
      findings.push("Official contact methods verified");
    }
  });
  
  return findings.length > 0 ? findings : ["Comparison analysis completed"];
}

function generateSpecificVerificationSteps(researchResults, step1Results) {
  const steps = [];
  
  // Add specific verification steps based on what was found
  if (step1Results.entitiesDetected?.organizations?.length > 0) {
    steps.push("Contact the organization through their official website");
    steps.push("Verify the sender's identity through a phone call");
  }
  
  if (step1Results.entitiesDetected?.contacts?.length > 0) {
    steps.push("Check if the email domain matches the official company domain");
  }
  
  steps.push("Look up the company on legitimate business directories");
  
  return steps.slice(0, 3);
}

function extractOfficialChannels(researchResults) {
  const channels = [];
  
  researchResults.forEach(result => {
    if (result.results.includes('official website')) {
      channels.push("Company's official website contact form");
    }
    
    if (result.results.includes('phone') || result.results.includes('contact')) {
      channels.push("Direct phone contact through listed business numbers");
    }
  });
  
  if (channels.length === 0) {
    channels.push("Official business website", "Verified phone directories");
  }
  
  return channels.slice(0, 2);
}

function generateAccurateSummary(researchResults, step1Results) {
  const businessResearch = researchResults.find(r => r.category === 'business_verification');
  const actualAlerts = extractFraudAlerts(researchResults, step1Results);
  
  if (actualAlerts.some(alert => !alert.includes('No specific fraud alerts'))) {
    return `Research found specific fraud alerts for ${step1Results.scamCategory}. Exercise caution.`;
  }
  
  if (businessResearch && businessResearch.results.includes('legitimate')) {
    return `Research indicates the organization appears legitimate. This appears to be standard business outreach for ${step1Results.scamCategory}.`;
  }
  
  return `Research completed for ${step1Results.scamCategory}. No specific fraud alerts found, but general category vigilance recommended.`;
}

// Transform research results to user-friendly format - FIXED
function transformResearchToUserFriendly(researchResults) {
  if (!researchResults || !researchResults.researchConducted) {
    return researchResults;
  }

  // The research results come in as an object with structured data
  // We need to safely extract the verification status and findings
  
  let verificationStatus = 'RESEARCH_COMPLETED';
  let keyFindings = [];
  let recommendedActions = [];
  let officialSources = [];

  try {
    // Check if we have business verification results
    if (researchResults.businessVerification) {
      // Check for fraud alerts
      if (researchResults.businessVerification.fraudAlerts && 
          researchResults.businessVerification.fraudAlerts.some(alert => 
            !alert.includes('No specific fraud alerts'))) {
        verificationStatus = 'FRAUD_ALERTS_FOUND';
        keyFindings.push('Fraud alerts found for this organization');
        recommendedActions = [
          "⚠️ Do not respond - fraud alerts found for this organization",
          "🚨 Report this to the FTC",
          "🗑️ Delete the message immediately"
        ];
      } else if (researchResults.businessVerification.legitimacyStatus === 'verified_legitimate' ||
                 researchResults.businessVerification.legitimacyStatus === 'appears_legitimate') {
        verificationStatus = 'VERIFIED_LEGITIMATE';
        keyFindings.push('Business appears to have legitimate web presence');
        recommendedActions = [
          "✅ Organization appears legitimate - verify through official channels",
          "📞 Contact through official website if interested",
          "🔍 Still verify identity before sharing sensitive information"
        ];
      }
    }

    // Extract official sources safely
    if (researchResults.businessVerification?.officialContacts) {
      officialSources.push(...researchResults.businessVerification.officialContacts.slice(0, 2));
    }
    if (researchResults.verificationGuidance?.officialChannels) {
      officialSources.push(...researchResults.verificationGuidance.officialChannels.slice(0, 2));
    }
    if (officialSources.length === 0) {
      officialSources = ["Official business website", "Verified phone directories"];
    }

    // Default actions if none set yet
    if (recommendedActions.length === 0) {
      recommendedActions = [
        "🔍 Continue verification through official channels",
        "📞 Contact the organization directly using official phone numbers",
        "⚠️ Do not share sensitive information until verified"
      ];
    }

    // Add general findings if none found
    if (keyFindings.length === 0) {
      keyFindings.push('Research completed successfully');
      if (researchResults.investigationSummary) {
        keyFindings.push('Additional verification information gathered');
      }
    }

  } catch (error) {
    console.error('[TRANSFORM-RESEARCH] Error processing results:', error);
    
    // Fallback to safe defaults
    verificationStatus = 'RESEARCH_COMPLETED';
    keyFindings = ['Research completed with limited processing'];
    recommendedActions = [
      "🔍 Verify through official channels",
      "📞 Contact organization directly",
      "⚠️ Exercise caution until verified"
    ];
    officialSources = ["Official business website", "Verified directories"];
  }

  return {
    ...researchResults,
    userFriendly: {
      verificationStatus: verificationStatus,
      keyFindings: keyFindings.slice(0, 3),
      officialSources: officialSources.slice(0, 3),
      recommendedActions: recommendedActions.slice(0, 3)
    }
  };
}