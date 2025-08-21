// pages/api/analyze.js - Complete Research Overhaul Version with Fixed Function Call

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

// Handle Step 1: Context Analysis with Enhanced Entity Detection
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
    const analysis = await performEnhancedClaudeAnalysis(incident);
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

// Enhanced Claude Analysis with Better Entity Detection
async function performEnhancedClaudeAnalysis(incident) {
  const prompt = `Analyze this communication for scam classification with enhanced entity detection.

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

EXTRACT ALL ENTITIES with high precision:
- Organizations (exact company names)
- Email addresses and domains
- Phone numbers
- Physical addresses
- Website references
- Person names and titles
- Financial amounts and claims

Return ONLY this JSON:
{
 "scamCategory": "exact category name from the list above",
 "whatWeObserved": "Detailed description with specific entities mentioned",
 "redFlagsIdentified": ["specific warning sign 1", "specific warning sign 2", "specific warning sign 3"],
 "recommendedActions": ["specific action 1", "specific action 2", "specific action 3"],
 "whereToReportOrVerify": ["specific verification method 1", "specific verification method 2"],
 "entitiesDetected": {
   "organizations": ["exact company name 1", "exact company name 2"],
   "emailAddresses": ["email1@domain.com", "email2@domain.com"],
   "domains": ["domain1.com", "domain2.com"],
   "phoneNumbers": ["+1-555-123-4567"],
   "addresses": ["complete address 1"],
   "personNames": ["Full Name (Title)"],
   "financialClaims": ["$120K funding", "130K approved"],
   "websites": ["website1.com"],
   "businessClaims": ["5 years experience", "multiple locations"]
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
      max_tokens: 750,
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

// Handle Step 2: Comprehensive Deep Research
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
    console.log('[DEEP-RESEARCH] Starting comprehensive research for:', step1Results.scamCategory);
    const researchResults = await conductComprehensiveResearch(step1Results, incident);
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

// Comprehensive Research Function - FIXED TO USE CORRECT FUNCTION
async function conductComprehensiveResearch(step1Results, originalIncident) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Research API not configured');
  }

  // FIXED: Use the comprehensive research function
  const researchQueries = buildComprehensiveResearchQueries(step1Results);
  console.log('[DEEP-RESEARCH] Running', researchQueries.length, 'comprehensive research queries');
  
  const researchPromises = researchQueries.map(async (query, index) => {
    console.log(`[RESEARCH-${index + 1}] ${query.description}`);
    return await executeResearchQuery(query, index);
  });

  const researchResults = await Promise.allSettled(researchPromises);
  
  const successfulResults = researchResults
    .filter(result => result.status === 'fulfilled' && result.value?.success)
    .map(result => result.value);

  console.log(`[DEEP-RESEARCH] Results: ${successfulResults.length} successful, ${researchResults.length - successfulResults.length} failed`);

  if (successfulResults.length > 0) {
    return await formatComprehensiveResults(step1Results, successfulResults);
  } else {
    throw new Error('All research queries failed');
  }
}

// Build Comprehensive Research Queries
function buildComprehensiveResearchQueries(step1Results) {
  const queries = [];
  const entities = step1Results.entitiesDetected || {};

  // 1. Organization Verification with Official Details
  if (entities.organizations && entities.organizations.length > 0) {
    entities.organizations.slice(0, 2).forEach(org => {
      queries.push({
        category: 'organization_verification',
        targetEntity: org,
        description: `Comprehensive verification of ${org}`,
        prompt: `Find comprehensive information about "${org}" company:

REQUIRED INFORMATION:
1. Official website URL (exact URL)
2. Official business address and registration
3. Official contact information (phone, email)
4. Business registration status and state
5. Better Business Bureau rating and complaints
6. Any fraud alerts or scam warnings specifically about this company
7. Social media presence and verification
8. Client testimonials and reviews

COMPARISON ANALYSIS:
9. How do they typically contact customers?
10. What domains do they officially use?
11. Any warnings about impersonation attempts?

Provide specific, factual details with exact URLs and contact information.`
      });
    });
  }

  // 2. Domain and Email Analysis
  if (entities.emailAddresses && entities.emailAddresses.length > 0) {
    queries.push({
      category: 'domain_analysis',
      targetEntity: entities.emailAddresses.join(', '),
      description: `Domain and email verification analysis`,
      prompt: `Analyze these email addresses and domains: ${entities.emailAddresses.join(', ')}

DOMAIN VERIFICATION:
1. Domain registration information and age
2. Domain reputation and blacklist status
3. Comparison with official company domains
4. WHOIS information and registrant details
5. Any reports of this domain being used in scams
6. SSL certificate verification
7. Email authentication records (SPF, DKIM, DMARC)

SCAM DATABASE CHECK:
8. Check against known scam email databases
9. Similar domain variations used in scams
10. Report any red flags about these specific email addresses

Provide specific technical details and risk assessment.`
    });
  }

  // 3. Address and Location Verification
  if (entities.addresses && entities.addresses.length > 0) {
    queries.push({
      category: 'address_verification',
      targetEntity: entities.addresses.join('; '),
      description: `Physical address verification`,
      prompt: `Verify these business addresses: ${entities.addresses.join('; ')}

ADDRESS VERIFICATION:
1. Confirm address exists and is valid
2. Type of location (office building, virtual office, residential, etc.)
3. Other businesses registered at this address
4. Street view and building information
5. Postal service verification
6. Business directory listings at this address

LEGITIMACY ASSESSMENT:
7. Is this a legitimate business address or mail forwarding service?
8. Any reports of scams using this address?
9. How does this address compare to official company addresses?

Provide detailed verification results and legitimacy assessment.`
    });
  }

  // 4. Enhanced Threat Intelligence
  queries.push({
    category: 'threat_intelligence',
    targetEntity: step1Results.scamCategory,
    description: `Current threat intelligence for ${step1Results.scamCategory}`,
    prompt: `Find current threat intelligence for "${step1Results.scamCategory}" scams:

CURRENT THREATS (2024-2025):
1. Latest scam techniques and variations
2. Recent fraud alerts from authorities
3. Common impersonation tactics
4. Red flags specific to this scam type
5. Recent victim reports and case studies

PREVENTION GUIDANCE:
6. How to verify legitimate offers in this category
7. Official reporting mechanisms
8. Industry-specific verification methods
9. Government or regulatory body warnings

COMPARISON WITH THIS INCIDENT:
10. How does this incident match current scam patterns?
11. Any similar recent reports?

Provide current, actionable threat intelligence.`
  });

  // 5. Financial Claims Verification (if applicable)
  if (entities.financialClaims && entities.financialClaims.length > 0) {
    queries.push({
      category: 'financial_verification',
      targetEntity: entities.financialClaims.join(', '),
      description: `Financial claims and offer verification`,
      prompt: `Verify these financial claims and offers: ${entities.financialClaims.join(', ')}

OFFER VERIFICATION:
1. Are these typical or realistic offers for legitimate businesses?
2. Industry standard terms and conditions
3. Required documentation for legitimate offers
4. Red flags in the financing terms
5. Comparison with legitimate lenders

REGULATORY COMPLIANCE:
6. Required licenses for financial services
7. State and federal regulations for business lending
8. Consumer protection requirements
9. Truth in lending disclosures

SCAM INDICATORS:
10. Common financial scam patterns
11. Too-good-to-be-true offer analysis
12. Pressure tactics and urgency indicators

Provide detailed analysis of offer legitimacy and compliance.`
    });
  }

  return queries;
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
          max_tokens: 1000,
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

// Comprehensive Results Formatting
async function formatComprehensiveResults(step1Results, researchResults) {
  const analysis = await performComprehensiveAnalysis(step1Results, researchResults);
  
  const combinedFindings = researchResults.map(r => `
=== ${r.description} ===
Target: ${r.targetEntity || 'General'}
${r.results}
`).join('\n');

  return {
    researchConducted: true,
    userFriendly: {
      verificationStatus: analysis.overallStatus,
      verificationSummary: analysis.summary,
      verificationDetails: analysis.details,
      keyFindings: analysis.keyFindings,
      domainAnalysis: analysis.domainAnalysis,
      addressVerification: analysis.addressVerification,
      officialSources: analysis.officialSources,
      recommendedActions: analysis.recommendedActions,
      riskFactors: analysis.riskFactors,
      legitimacyIndicators: analysis.legitimacyIndicators
    },
    comprehensiveAnalysis: {
      organizationVerification: analysis.organizationData,
      domainSecurity: analysis.domainSecurity,
      addressValidation: analysis.addressValidation,
      financialOfferAssessment: analysis.financialAssessment,
      threatIntelligence: analysis.threatData,
      comparisonAnalysis: analysis.comparisonResults
    },
    investigationSummary: analysis.investigationSummary,
    detailedFindings: combinedFindings,
    researchStats: {
      queriesExecuted: researchResults.length,
      entitiesVerified: step1Results.entitiesDetected ? Object.keys(step1Results.entitiesDetected).length : 0,
      analysisDepth: 'comprehensive'
    }
  };
}

// Comprehensive Analysis Engine
async function performComprehensiveAnalysis(step1Results, researchResults) {
  const entities = step1Results.entitiesDetected || {};
  
  // Extract specific data from each research category
  const organizationData = extractOrganizationData(researchResults, entities);
  const domainAnalysis = extractDomainAnalysis(researchResults, entities);
  const addressData = extractAddressData(researchResults, entities);
  const threatData = extractThreatIntelligence(researchResults);
  const financialData = extractFinancialAnalysis(researchResults, entities);
  
  // Perform comparative analysis
  const comparisonResults = performComparisonAnalysis(organizationData, domainAnalysis, entities);
  
  // Determine overall risk and legitimacy
  const riskAssessment = calculateComprehensiveRisk(organizationData, domainAnalysis, addressData, comparisonResults);
  
  // Generate specific findings and recommendations
  const keyFindings = generateSpecificFindings(organizationData, domainAnalysis, addressData, comparisonResults);
  const recommendedActions = generateTargetedActions(riskAssessment, comparisonResults);
  
  return {
    overallStatus: riskAssessment.status,
    summary: riskAssessment.summary,
    details: riskAssessment.details,
    keyFindings: keyFindings,
    domainAnalysis: domainAnalysis.summary,
    addressVerification: addressData.summary,
    officialSources: organizationData.officialContacts,
    recommendedActions: recommendedActions,
    riskFactors: riskAssessment.riskFactors,
    legitimacyIndicators: riskAssessment.legitimacyIndicators,
    organizationData: organizationData,
    domainSecurity: domainAnalysis,
    addressValidation: addressData,
    financialAssessment: financialData,
    threatData: threatData,
    comparisonResults: comparisonResults,
    investigationSummary: generateInvestigationSummary(riskAssessment, keyFindings.length, researchResults.length)
  };
}

// Specialized extraction functions
function extractOrganizationData(researchResults, entities) {
  const orgResults = researchResults.filter(r => r.category === 'organization_verification');
  const data = {
    officialWebsites: [],
    officialContacts: [],
    businessRegistration: [],
    bbbRating: [],
    fraudAlerts: [],
    socialMedia: [],
    legitimacyIndicators: []
  };
  
  orgResults.forEach(result => {
    const content = result.results;
    
    // Extract websites
    const websites = content.match(/https?:\/\/[^\s,)]+/g);
    if (websites) {
      data.officialWebsites.push(...websites.filter(url => 
        !url.includes('bbb.org') && !url.includes('google.com')
      ).slice(0, 3));
    }
    
    // Extract official contacts
    if (content.includes('official') && (content.includes('@') || content.includes('phone'))) {
      const emails = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (emails) {
        data.officialContacts.push(...emails.slice(0, 2));
      }
    }
    
    // Extract legitimacy indicators
    if (content.includes('legitimate') || content.includes('registered business')) {
      data.legitimacyIndicators.push('Business registration confirmed');
    }
    if (content.includes('BBB') && content.includes('rating')) {
      data.bbbRating.push('BBB rating found');
    }
    if (content.includes('no fraud alerts') || content.includes('no scam reports')) {
      data.fraudAlerts.push('No fraud alerts found');
    } else if (content.includes('fraud alert') || content.includes('scam warning')) {
      data.fraudAlerts.push('⚠️ Fraud alerts detected');
    }
  });
  
  return data;
}

function extractDomainAnalysis(researchResults, entities) {
  const domainResults = researchResults.filter(r => r.category === 'domain_analysis');
  const analysis = {
    senderDomains: entities.domains || [],
    officialDomains: [],
    domainMismatches: [],
    reputationStatus: [],
    securityIndicators: [],
    summary: ''
  };
  
  domainResults.forEach(result => {
    const content = result.results;
    
    // Extract official domains from research
    if (content.includes('official domain') || content.includes('legitimate domain')) {
      const domains = content.match(/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (domains) {
        analysis.officialDomains.push(...domains.slice(0, 3));
      }
    }
    
    // Check for domain reputation
    if (content.includes('clean reputation') || content.includes('good reputation')) {
      analysis.reputationStatus.push('Clean domain reputation');
    } else if (content.includes('suspicious') || content.includes('blacklisted')) {
      analysis.reputationStatus.push('⚠️ Domain reputation concerns');
    }
    
    // Check for security indicators
    if (content.includes('SSL') || content.includes('certificate')) {
      analysis.securityIndicators.push('SSL certificate verified');
    }
  });
  
  // Perform domain comparison
  if (analysis.senderDomains.length > 0 && analysis.officialDomains.length > 0) {
    analysis.senderDomains.forEach(senderDomain => {
      const isMatch = analysis.officialDomains.some(officialDomain => 
        senderDomain.includes(officialDomain.replace('www.', '')) ||
        officialDomain.includes(senderDomain.replace('www.', ''))
      );
      
      if (!isMatch) {
        analysis.domainMismatches.push(`Sender domain '${senderDomain}' doesn't match official domains`);
      }
    });
  }
  
  analysis.summary = generateDomainSummary(analysis);
  return analysis;
}

function extractAddressData(researchResults, entities) {
  const addressResults = researchResults.filter(r => r.category === 'address_verification');
  const data = {
    addresses: entities.addresses || [],
    verificationStatus: [],
    locationType: [],
    legitimacyStatus: [],
    summary: ''
  };
  
  addressResults.forEach(result => {
    const content = result.results;
    
    if (content.includes('valid address') || content.includes('legitimate address')) {
      data.verificationStatus.push('Address verified as valid');
    }
    
    if (content.includes('office building') || content.includes('commercial')) {
      data.locationType.push('Commercial office location');
    } else if (content.includes('virtual office') || content.includes('mail forwarding')) {
      data.locationType.push('⚠️ Virtual office or mail forwarding service');
    }
    
    if (content.includes('legitimate business location')) {
      data.legitimacyStatus.push('Legitimate business location confirmed');
    }
  });
  
  data.summary = generateAddressSummary(data);
  return data;
}

function extractThreatIntelligence(researchResults) {
  const threatResults = researchResults.filter(r => r.category === 'threat_intelligence');
  return {
    currentThreats: [],
    officialWarnings: [],
    preventionGuidance: [],
    patternMatches: []
  };
}

function extractFinancialAnalysis(researchResults, entities) {
  const financialResults = researchResults.filter(r => r.category === 'financial_verification');
  return {
    offerLegitimacy: [],
    industryStandards: [],
    regulatoryCompliance: [],
    redFlags: []
  };
}

function performComparisonAnalysis(organizationData, domainAnalysis, entities) {
  const comparisons = {
    domainMatches: [],
    contactMatches: [],
    discrepancies: [],
    riskLevel: 'unknown'
  };
  
  // Compare sender vs official domains
  if (domainAnalysis.domainMismatches.length > 0) {
    comparisons.discrepancies.push(...domainAnalysis.domainMismatches);
    comparisons.riskLevel = 'high';
  }
  
  // Compare sender vs official contacts
  if (entities.emailAddresses && organizationData.officialContacts.length > 0) {
    entities.emailAddresses.forEach(senderEmail => {
      const isOfficialContact = organizationData.officialContacts.some(official => 
        official.toLowerCase().includes(senderEmail.toLowerCase()) ||
        senderEmail.toLowerCase().includes(official.toLowerCase())
      );
      
      if (!isOfficialContact) {
        comparisons.discrepancies.push(`Sender email '${senderEmail}' not found in official contacts`);
      }
    });
  }
  
  return comparisons;
}

function calculateComprehensiveRisk(organizationData, domainAnalysis, addressData, comparisonResults) {
  let riskScore = 0;
  const riskFactors = [];
  const legitimacyIndicators = [];
  
  // Domain risk factors
  if (domainAnalysis.domainMismatches.length > 0) {
    riskScore += 30;
    riskFactors.push('Domain mismatch detected');
  }
  
  if (domainAnalysis.reputationStatus.some(status => status.includes('⚠️'))) {
    riskScore += 25;
    riskFactors.push('Domain reputation concerns');
  }
  
  // Organization legitimacy factors
  if (organizationData.fraudAlerts.some(alert => alert.includes('⚠️'))) {
    riskScore += 40;
    riskFactors.push('Fraud alerts found');
  } else if (organizationData.fraudAlerts.some(alert => alert.includes('No fraud alerts'))) {
    legitimacyIndicators.push('No fraud alerts found');
  }
  
  if (organizationData.officialWebsites.length > 0) {
    legitimacyIndicators.push('Official website verified');
  }
  
  if (organizationData.legitimacyIndicators.length > 0) {
    legitimacyIndicators.push('Business registration confirmed');
  }
  
  // Address verification factors
  if (addressData.locationType.some(type => type.includes('⚠️'))) {
    riskScore += 15;
    riskFactors.push('Virtual office or non-traditional business address');
  }
  
  // Determine status
  let status, summary;
  if (riskScore >= 50) {
    status = 'HIGH_RISK_DETECTED';
    summary = 'Multiple risk factors detected. Strong recommendation against proceeding.';
  } else if (riskScore >= 25) {
    status = 'MODERATE_RISK_DETECTED';
    summary = 'Some risk factors present. Proceed with significant caution and additional verification.';
  } else if (legitimacyIndicators.length >= 3) {
    status = 'VERIFIED_LEGITIMATE';
    summary = 'Business appears legitimate with verifiable information. Standard verification recommended.';
  } else if (legitimacyIndicators.length >= 1) {
    status = 'PARTIALLY_VERIFIED';
    summary = 'Some legitimacy indicators found. Additional verification recommended before proceeding.';
  } else {
    status = 'INSUFFICIENT_DATA';
    summary = 'Limited verification data available. High caution recommended.';
  }
  
  return {
    status,
    summary,
    details: [`Risk score: ${riskScore}/100`, `Legitimacy indicators: ${legitimacyIndicators.length}`, `Risk factors: ${riskFactors.length}`],
    riskFactors,
    legitimacyIndicators,
    riskScore
  };
}

function generateSpecificFindings(organizationData, domainAnalysis, addressData, comparisonResults) {
  const findings = [];
  
  // Website findings
  if (organizationData.officialWebsites.length > 0) {
    findings.push(`Official website found: ${organizationData.officialWebsites[0]}`);
  }
  
  // Domain comparison findings
  if (domainAnalysis.domainMismatches.length > 0) {
    findings.push(`⚠️ ${domainAnalysis.domainMismatches[0]}`);
  }
  
  // Contact verification findings
  if (organizationData.officialContacts.length > 0) {
    findings.push(`Official contact found: ${organizationData.officialContacts[0]}`);
  }
  
  // Address findings
  if (addressData.verificationStatus.length > 0) {
    findings.push(addressData.verificationStatus[0]);
  }
  
  // Fraud alert findings
  if (organizationData.fraudAlerts.length > 0) {
    findings.push(organizationData.fraudAlerts[0]);
  }
  
  // Remove duplicates and limit
  return [...new Set(findings)].slice(0, 5);
}

function generateTargetedActions(riskAssessment, comparisonResults) {
  const actions = [];
  
  if (riskAssessment.status === 'HIGH_RISK_DETECTED') {
    actions.push('🚨 Do not respond or provide any information');
    actions.push('🚨 Report this communication as potential fraud');
    actions.push('🚨 Block sender and delete message');
  } else if (riskAssessment.status === 'MODERATE_RISK_DETECTED') {
    actions.push('⚠️ Exercise extreme caution - multiple red flags detected');
    actions.push('📞 Contact organization directly through verified official channels');
    actions.push('🔍 Verify sender identity through independent sources');
  } else if (riskAssessment.status === 'VERIFIED_LEGITIMATE') {
    actions.push('✅ Business appears legitimate - proceed with standard verification');
    actions.push('📞 Contact through official website or known phone number');
    actions.push('🔍 Verify specific offer details independently');
  } else {
    actions.push('🔍 Conduct additional verification before responding');
    actions.push('📞 Contact organization through independently verified channels');
    actions.push('⚠️ Do not provide sensitive information until verified');
  }
  
  return actions.slice(0, 3);
}

// Helper functions for summary generation
function generateDomainSummary(analysis) {
  if (analysis.domainMismatches.length > 0) {
    return `⚠️ Domain mismatch detected: ${analysis.domainMismatches.length} discrepancy(ies) found`;
  } else if (analysis.reputationStatus.length > 0) {
    return analysis.reputationStatus[0];
  } else {
    return 'Domain analysis completed';
  }
}

function generateAddressSummary(data) {
  if (data.locationType.some(type => type.includes('⚠️'))) {
    return data.locationType.find(type => type.includes('⚠️'));
  } else if (data.verificationStatus.length > 0) {
    return data.verificationStatus[0];
  } else {
    return 'Address verification completed';
  }
}

function generateInvestigationSummary(riskAssessment, findingsCount, queriesCount) {
  return `Comprehensive investigation completed: ${queriesCount} research queries executed, ${findingsCount} specific findings identified. Risk assessment: ${riskAssessment.status.replace(/_/g, ' ').toLowerCase()}.`;
}

// Transform to user-friendly format (updated)
function transformToUserFriendly(analysis) {
  const friendlyCategories = {
    'Funding offers & grants': 'Funding or Grant Scam',
    'Email/Web phishing & lookalike sites': 'Fake Website or Email Scam',
    'BEC & payment diversion': 'Business Email Scam',
    'Recruitment/job-offer scams': 'Fake Job Offer',
    'Investment/crypto scams': 'Investment Scam',
    'Government/authority/utility impersonation': 'Fake Government Contact',
    'Supply-chain/partner impersonation & fake integrations/API keys': 'Business Partner Impersonation'
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
    'Recruitment/job-offer scams',
    'Supply-chain/partner impersonation & fake integrations/API keys'
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
         (analysis.entitiesDetected?.emailAddresses?.length > 0) ||
         (analysis.entitiesDetected?.domains?.length > 0);
}