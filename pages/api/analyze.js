// pages/api/analyze.js - Simple Working Version

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

// Handle Step 1: Context Analysis
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
    const analysis = await performClaudeAnalysis(incident);
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

// Handle Step 2: Deep Research
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
    console.log('[DEEP-RESEARCH] Starting research for:', step1Results.scamCategory);
    const researchResults = await conductDeepResearch(step1Results, incident);
    return res.status(200).json(researchResults);
  } catch (error) {
    console.error('[DEEP-RESEARCH] Error:', error);
    return res.status(200).json({
      researchConducted: false,
      userMessage: 'Basic analysis complete. Unable to verify additional details right now.',
      investigationSummary: 'Research system temporarily unavailable'
    });
  }
}

// Claude Analysis Function
async function performClaudeAnalysis(incident) {
  const prompt = `Analyze this communication for scam classification.

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
 "whatWeObserved": "Simple description in plain English",
 "redFlagsIdentified": ["warning sign 1", "warning sign 2"],
 "recommendedActions": ["action 1", "action 2"],
 "whereToReportOrVerify": ["how to check", "where to report"],
 "entitiesDetected": {
   "organizations": ["company1"],
   "contacts": ["email1"],
   "claims": ["claim1"]
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
      max_tokens: 500,
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

// Transform to user-friendly format
function transformToUserFriendly(analysis) {
  const friendlyCategories = {
    'Funding offers & grants': 'Funding or Grant Scam',
    'Email/Web phishing & lookalike sites': 'Fake Website or Email Scam',
    'BEC & payment diversion': 'Business Email Scam',
    'Recruitment/job-offer scams': 'Fake Job Offer',
    'Investment/crypto scams': 'Investment Scam',
    'Government/authority/utility impersonation': 'Fake Government Contact',
  };

  const riskLevel = determineRiskLevel(analysis);
  
  return {
    ...analysis,
    userFriendly: {
      scamType: friendlyCategories[analysis.scamCategory] || analysis.scamCategory,
      riskLevel: riskLevel,
      summary: generateSimpleSummary(riskLevel),
      mainConcerns: analysis.redFlagsIdentified?.slice(0, 3) || [],
      nextSteps: analysis.recommendedActions?.slice(0, 3) || [],
      howToCheck: analysis.whereToReportOrVerify || []
    }
  };
}

function determineRiskLevel(analysis) {
  const highRiskCategories = [
    'Investment/crypto scams',
    'BEC & payment diversion',
    'Government/authority/utility impersonation'
  ];
  
  const mediumRiskCategories = [
    'Funding offers & grants',
    'Recruitment/job-offer scams'
  ];

  if (highRiskCategories.includes(analysis.scamCategory)) {
    return 'HIGH';
  } else if (mediumRiskCategories.includes(analysis.scamCategory)) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

function generateSimpleSummary(riskLevel) {
  if (riskLevel === 'HIGH') {
    return "⚠️ This looks very suspicious and is likely a scam. Do not respond or provide any information.";
  } else if (riskLevel === 'MEDIUM') {
    return "🔍 This has several warning signs. Be very careful and verify before taking any action.";
  } else {
    return "ℹ️ This shows some concerning signs. Always verify through official channels before responding.";
  }
}

function shouldAutoTriggerResearch(analysis) {
  const highImpactCategories = [
    'Funding offers & grants',
    'Recruitment/job-offer scams',
    'BEC & payment diversion',
    'Government/authority/utility impersonation',
    'Investment/crypto scams',
    'Supply-chain/partner impersonation & fake integrations/API keys'
  ];

  return highImpactCategories.includes(analysis.scamCategory) ||
         (analysis.entitiesDetected?.organizations?.length > 0) ||
         (analysis.entitiesDetected?.contacts?.length > 0);
}

// Deep Research Function
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

  console.log(`[DEEP-RESEARCH] Results: ${successfulResults.length} successful`);

  if (successfulResults.length > 0) {
    return await formatResearchResults(step1Results, successfulResults);
  } else {
    throw new Error('All research queries failed');
  }
}

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
          max_tokens: 800,
          temperature: 0.1,
          return_citations: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[RESEARCH-${index + 1}] Success with model: ${model}`);
        return {
          category: query.category,
          description: query.description,
          results: data.choices[0].message.content,
          success: true
        };
      } else {
        console.log(`[RESEARCH-${index + 1}] HTTP ${response.status} with model: ${model}`);
        if (model === models[models.length - 1]) {
          return {
            category: query.category,
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
          description: query.description,
          results: `Research failed: ${error.message}`,
          success: false
        };
      }
    }
  }
}

function buildResearchQueries(step1Results) {
  const queries = [];
  const entities = step1Results.entitiesDetected || {};

  if (entities.organizations && entities.organizations.length > 0) {
    const orgs = entities.organizations.slice(0, 2);
    queries.push({
      category: 'business_verification',
      description: `Checking ${orgs.join(', ')}`,
      prompt: `Find official information for: ${orgs.join(', ')}

Look for:
1. Official websites and contact information
2. Any fraud alerts or warnings
3. Business legitimacy indicators
4. Customer reviews or testimonials

Provide specific, factual information about what you find.`
    });
  }

  if (entities.contacts && entities.contacts.length > 0) {
    queries.push({
      category: 'contact_verification',
      description: 'Verifying contact information',
      prompt: `Check these contacts for legitimacy: ${entities.contacts.slice(0, 3).join(', ')}

Look for:
1. Domain reputation
2. Scam database listings
3. Official contact verification

Provide clear assessment of contact legitimacy.`
    });
  }

  queries.push({
    category: 'threat_intelligence',
    description: `Current ${step1Results.scamCategory} patterns`,
    prompt: `Find current information about: "${step1Results.scamCategory}"

Look for:
1. Recent scam reports for 2024-2025
2. Common tactics being used
3. Official warnings

Provide current trends and warnings.`
  });

  return queries;
}

async function formatResearchResults(step1Results, researchResults) {
  const combinedFindings = researchResults.map(r => `
=== ${r.description} ===
${r.results}
`).join('\n');

  // Extract key findings from research
  const keyFindings = extractKeyFindings(researchResults);
  const verificationStatus = determineVerificationStatus(researchResults, keyFindings);
  
  return {
    researchConducted: true,
    userFriendly: {
      verificationStatus: verificationStatus.status,
      verificationSummary: verificationStatus.summary,
      verificationDetails: verificationStatus.details,
      keyFindings: keyFindings,
      officialSources: extractOfficialSources(researchResults),
      recommendedActions: generateResearchActions(verificationStatus.status)
    },
    businessVerification: {
      organizationsResearched: step1Results.entitiesDetected?.organizations || [],
      legitimacyStatus: verificationStatus.legitimacy,
      officialContacts: extractOfficialContacts(researchResults),
      fraudAlerts: verificationStatus.alerts
    },
    investigationSummary: `Research completed for ${step1Results.scamCategory}. Found ${researchResults.length} sources with current information.`,
    detailedFindings: combinedFindings
  };
}

function extractKeyFindings(researchResults) {
  const findings = [];
  
  researchResults.forEach(result => {
    const content = result.results;
    
    // Extract website information
    const websites = content.match(/https?:\/\/[^\s,)]+/g);
    if (websites && websites.length > 0) {
      findings.push(`Official website found: ${websites[0]}`);
    }
    
    // Extract legitimacy indicators
    if (content.includes('legitimate') || content.includes('official')) {
      findings.push('Business appears to have legitimate online presence');
    }
    
    if (content.includes('no fraud alerts') || content.includes('no warnings')) {
      findings.push('No specific fraud alerts found for this organization');
    }
    
    if (content.includes('professional') || content.includes('established')) {
      findings.push('Professional business presentation indicators found');
    }
  });
  
  return findings.length > 0 ? findings.slice(0, 4) : ['Research completed with limited findings'];
}

function determineVerificationStatus(researchResults, keyFindings) {
  const hasWebsite = keyFindings.some(f => f.includes('website found'));
  const hasLegitimacy = keyFindings.some(f => f.includes('legitimate'));
  const hasNoAlerts = keyFindings.some(f => f.includes('No specific fraud alerts'));
  
  if (hasWebsite && hasLegitimacy && hasNoAlerts) {
    return {
      status: 'VERIFIED_LEGITIMATE',
      summary: 'Business appears legitimate with verifiable online presence',
      details: ['Official website verified', 'No fraud alerts found', 'Professional online presence'],
      legitimacy: 'appears_legitimate',
      alerts: ['No specific fraud alerts found for this organization']
    };
  } else if (hasWebsite || hasLegitimacy) {
    return {
      status: 'PARTIALLY_VERIFIED',
      summary: 'Some verification indicators found, additional caution recommended',
      details: keyFindings.slice(0, 3),
      legitimacy: 'requires_verification',
      alerts: ['No specific fraud alerts found for this organization']
    };
  } else {
    return {
      status: 'RESEARCH_COMPLETED',
      summary: 'Research completed with limited verification data',
      details: ['Research data gathered', 'Manual verification recommended'],
      legitimacy: 'unknown',
      alerts: ['No specific fraud alerts found for this organization']
    };
  }
}

function extractOfficialSources(researchResults) {
  const sources = [];
  
  researchResults.forEach(result => {
    const websites = result.results.match(/https?:\/\/[^\s,)]+/g);
    if (websites) {
      sources.push(...websites.slice(0, 2));
    }
  });
  
  if (sources.length === 0) {
    sources.push('Better Business Bureau directory', 'Official business websites');
  }
  
  return sources.slice(0, 3);
}

function extractOfficialContacts(researchResults) {
  const contacts = [];
  
  researchResults.forEach(result => {
    if (result.results.includes('contact') || result.results.includes('phone')) {
      contacts.push('Official contact information found');
    }
  });
  
  return contacts.length > 0 ? contacts : ['Use official website contact methods'];
}

function generateResearchActions(verificationStatus) {
  if (verificationStatus === 'VERIFIED_LEGITIMATE') {
    return [
      '✅ Business appears legitimate - proceed with normal verification',
      '📞 Contact through official website found in research',
      '🔍 Still verify identity before sharing sensitive information'
    ];
  } else if (verificationStatus === 'PARTIALLY_VERIFIED') {
    return [
      '🔍 Mixed verification results - exercise additional caution',
      '📞 Verify through multiple independent sources',
      '⚠️ Do not share sensitive information until fully verified'
    ];
  } else {
    return [
      '🔍 Limited verification data - proceed with high caution',
      '📞 Contact organization through independently verified channels',
      '⚠️ Consider this high-risk until verified'
    ];
  }
}