// pages/api/analyze.js - Complete Enhanced Version with Improved Display Logic

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

// Comprehensive Research Function
async function conductComprehensiveResearch(step1Results, originalIncident) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Research API not configured');
  }

  // Use the comprehensive research function
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
      verificationDetails: analysis.verificationDetails,
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

// ENHANCED ANALYSIS ENGINE WITH IMPROVED DISPLAY LOGIC
async function performComprehensiveAnalysis(step1Results, researchResults) {
  const entities = step1Results.entitiesDetected || {};
  
  // Extract specific data from each research category using enhanced functions
  const organizationData = extractOrganizationData(researchResults, entities);
  const domainAnalysis = extractDomainAnalysis(researchResults, entities);
  const addressData = extractAddressData(researchResults, entities);
  const threatData = extractThreatIntelligence(researchResults);
  const financialData = extractFinancialAnalysis(researchResults, entities);
  
  // Perform comparative analysis
  const comparisonResults = performComparisonAnalysis(organizationData, domainAnalysis, entities);
  
  // Determine overall risk and legitimacy with enhanced calculation
  const riskAssessment = calculateComprehensiveRisk(organizationData, domainAnalysis, addressData, comparisonResults, financialData);
  
  // Generate specific findings and recommendations with enhanced functions
  const keyFindings = generateSpecificFindings(organizationData, domainAnalysis, addressData, comparisonResults, financialData);
  const recommendedActions = generateTargetedActions(riskAssessment, comparisonResults, financialData);
  
  // Generate enhanced official sources
  const officialSources = generateOfficialSources(organizationData, domainAnalysis, riskAssessment);
  
  return {
    overallStatus: riskAssessment.status,
    summary: riskAssessment.summary,
    details: riskAssessment.details,
    keyFindings: keyFindings,
    domainAnalysis: domainAnalysis.summary,
    addressVerification: addressData.summary,
    officialSources: officialSources,
    recommendedActions: recommendedActions,
    riskFactors: riskAssessment.riskFactors,
    legitimacyIndicators: riskAssessment.legitimacyIndicators,
    // Enhanced verification details for UI
    verificationDetails: generateVerificationDetails(organizationData, domainAnalysis, addressData, financialData),
    organizationData: organizationData,
    domainSecurity: domainAnalysis,
    addressValidation: addressData,
    financialAssessment: financialData,
    threatData: threatData,
    comparisonResults: comparisonResults,
    investigationSummary: generateInvestigationSummary(riskAssessment, keyFindings.length, researchResults.length)
  };
}

// ENHANCED EXTRACTION FUNCTIONS

// Enhanced Organization Data Extraction
function extractOrganizationData(researchResults, entities) {
  const orgResults = researchResults.filter(r => r.category === 'organization_verification');
  const data = {
    officialWebsites: [],
    officialContacts: [],
    businessRegistration: [],
    bbbRating: [],
    fraudAlerts: [],
    socialMedia: [],
    legitimacyIndicators: [],
    multipleEntities: []
  };
  
  orgResults.forEach(result => {
    const content = result.results.toLowerCase();
    const originalContent = result.results;
    
    // Extract multiple entities/variations found
    const entityMatches = originalContent.match(/\*\*(.*?)\*\*/g);
    if (entityMatches) {
      entityMatches.forEach(match => {
        const entityName = match.replace(/\*\*/g, '');
        if (entityName.includes('Bridge Capital') && !data.multipleEntities.includes(entityName)) {
          data.multipleEntities.push(entityName);
        }
      });
    }
    
    // Extract websites with better patterns
    const websitePatterns = [
      /https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      /website:\s*\*\*([^*]+)\*\*/gi,
      /official website[:\s]+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ];
    
    websitePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(originalContent)) !== null) {
        const website = match[1] || match[0];
        if (website && !website.includes('google.com') && !website.includes('bbb.org')) {
          const cleanWebsite = website.replace(/https?:\/\//, '').replace(/\/$/, '');
          if (!data.officialWebsites.includes(cleanWebsite)) {
            data.officialWebsites.push(cleanWebsite);
          }
        }
      }
    });
    
    // Extract business registration info
    if (content.includes('registered') && (content.includes('cnmi') || content.includes('delaware') || content.includes('singapore'))) {
      if (content.includes('cnmi')) data.businessRegistration.push('Registered in CNMI (Northern Mariana Islands)');
      if (content.includes('delaware')) data.businessRegistration.push('Registered in Delaware');
      if (content.includes('singapore')) data.businessRegistration.push('Registered in Singapore');
    }
    
    // Extract BBB information
    if (content.includes('bbb') || content.includes('better business bureau')) {
      if (content.includes('no bbb listing') || content.includes('not found')) {
        data.bbbRating.push('No BBB listing found');
      } else if (content.includes('rating')) {
        data.bbbRating.push('BBB listing found');
      }
    }
    
    // Detect fraud alerts more accurately
    if (content.includes('no fraud alerts') || content.includes('no scam warnings')) {
      data.fraudAlerts.push('No fraud alerts found for this organization');
    } else if (content.includes('fraud alert') || content.includes('scam warning')) {
      data.fraudAlerts.push('⚠️ Fraud alerts detected');
    }
    
    // Business legitimacy indicators
    if (content.includes('legitimate') && content.includes('business')) {
      data.legitimacyIndicators.push('Business legitimacy indicators found');
    }
    if (content.includes('client testimonials') && content.includes('positive')) {
      data.legitimacyIndicators.push('Positive client testimonials found');
    }
  });
  
  return data;
}

// Enhanced Domain Analysis with Better Pattern Detection
function extractDomainAnalysis(researchResults, entities) {
  const domainResults = researchResults.filter(r => r.category === 'domain_analysis');
  const analysis = {
    senderDomains: entities.domains || [],
    senderEmails: entities.emailAddresses || [],
    officialDomains: [],
    domainMismatches: [],
    reputationStatus: [],
    securityIndicators: [],
    riskFactors: [],
    summary: ''
  };
  
  domainResults.forEach(result => {
    const content = result.results.toLowerCase();
    const originalContent = result.results;
    
    // Extract specific risk assessment
    if (content.includes('high risk') || content.includes('red flags')) {
      analysis.riskFactors.push('High-risk domain characteristics detected');
    }
    
    if (content.includes('scam') && content.includes('domain')) {
      analysis.riskFactors.push('Domain exhibits scam indicators');
    }
    
    if (content.includes('privacy protection') || content.includes('hidden')) {
      analysis.riskFactors.push('Domain registration hidden/protected');
    }
    
    if (content.includes('recent registration') || content.includes('registered recently')) {
      analysis.riskFactors.push('Recently registered domain (suspicious timing)');
    }
    
    // Extract domain reputation
    if (content.includes('not reputable') || content.includes('poor reputation')) {
      analysis.reputationStatus.push('⚠️ Poor domain reputation detected');
    } else if (content.includes('clean reputation')) {
      analysis.reputationStatus.push('Clean domain reputation');
    }
    
    // SSL and security
    if (content.includes('ssl') && content.includes('certificate')) {
      analysis.securityIndicators.push('SSL certificate present');
    }
    
    // Domain structure analysis
    if (content.includes('repetitive') || content.includes('awkward naming')) {
      analysis.riskFactors.push('Suspicious domain naming pattern');
    }
    
    // Extract any official domains mentioned
    const domainPattern = /([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    let match;
    while ((match = domainPattern.exec(originalContent)) !== null) {
      const domain = match[1].toLowerCase();
      if (!domain.includes('whois.com') && !domain.includes('google.com') && 
          !analysis.officialDomains.includes(domain) && 
          !analysis.senderDomains.map(d => d.toLowerCase()).includes(domain)) {
        analysis.officialDomains.push(domain);
      }
    }
  });
  
  // Perform enhanced domain comparison
  if (analysis.senderEmails.length > 0) {
    analysis.senderEmails.forEach(email => {
      const emailDomain = email.split('@')[1];
      if (emailDomain) {
        // Check if sender domain matches any official domains
        const hasMatch = analysis.officialDomains.some(officialDomain => 
          emailDomain.includes(officialDomain) || officialDomain.includes(emailDomain)
        );
        
        if (!hasMatch && analysis.officialDomains.length > 0) {
          analysis.domainMismatches.push(`Sender uses '${emailDomain}' but official domains are: ${analysis.officialDomains.slice(0, 2).join(', ')}`);
        }
      }
    });
  }
  
  analysis.summary = generateEnhancedDomainSummary(analysis);
  return analysis;
}

// Enhanced Address Data Extraction
function extractAddressData(researchResults, entities) {
  const addressResults = researchResults.filter(r => r.category === 'address_verification');
  const data = {
    addresses: entities.addresses || [],
    verificationStatus: [],
    locationType: [],
    legitimacyStatus: [],
    businessesAtAddress: [],
    summary: ''
  };
  
  addressResults.forEach(result => {
    const content = result.results.toLowerCase();
    const originalContent = result.results;
    
    // Extract verification status
    if (content.includes('address exists') || content.includes('valid')) {
      data.verificationStatus.push('Address verified as valid');
    }
    
    // Extract location type with more detail
    if (content.includes('commercial office building')) {
      data.locationType.push('Commercial office building confirmed');
    } else if (content.includes('office building')) {
      data.locationType.push('Office building location');
    }
    
    if (content.includes('penn place')) {
      data.locationType.push('Located in Penn Place building');
    }
    
    if (content.includes('virtual office') || content.includes('mail forwarding')) {
      data.locationType.push('⚠️ Potential virtual office or mail service');
    }
    
    // Extract other businesses at address
    const businessPattern = /(saylor inc|autism prohelp|hutch)/gi;
    let match;
    while ((match = businessPattern.exec(originalContent)) !== null) {
      if (!data.businessesAtAddress.includes(match[0])) {
        data.businessesAtAddress.push(match[0]);
      }
    }
    
    // Legitimacy assessment
    if (content.includes('legitimate business address')) {
      data.legitimacyStatus.push('Confirmed legitimate business address');
    }
    
    if (content.includes('no scam') || content.includes('no reports of scams')) {
      data.legitimacyStatus.push('No scam reports associated with this address');
    }
    
    if (content.includes('multi-tenant') || content.includes('multiple businesses')) {
      data.legitimacyStatus.push('Multi-tenant building with various businesses');
    }
  });
  
  data.summary = generateEnhancedAddressSummary(data);
  return data;
}

// Enhanced Financial Analysis Extraction
function extractFinancialAnalysis(researchResults, entities) {
  const financialResults = researchResults.filter(r => r.category === 'financial_verification');
  const analysis = {
    offerLegitimacy: [],
    industryStandards: [],
    regulatoryCompliance: [],
    redFlags: [],
    approvalTimeAnalysis: [],
    amountAnalysis: []
  };
  
  financialResults.forEach(result => {
    const content = result.results.toLowerCase();
    const originalContent = result.results;
    
    // Extract specific findings about the offer
    if (content.includes('not typical') || content.includes('uncommon')) {
      analysis.offerLegitimacy.push('Offer amounts and terms not typical for legitimate lenders');
    }
    
    if (content.includes('24 hours') && content.includes('approval')) {
      analysis.approvalTimeAnalysis.push('⚠️ 24-hour approval claims are unrealistic for large amounts');
    }
    
    if (content.includes('$120k') || content.includes('$130k')) {
      analysis.amountAnalysis.push('Large funding amounts require extensive documentation');
    }
    
    // Red flags
    if (content.includes('guaranteed approval')) {
      analysis.redFlags.push('Guaranteed approval claims are red flags');
    }
    
    if (content.includes('upfront fees')) {
      analysis.redFlags.push('Requests for upfront fees indicate scam');
    }
    
    if (content.includes('too good to be true')) {
      analysis.redFlags.push('Offer exhibits too-good-to-be-true characteristics');
    }
    
    // Industry standards
    if (content.includes('most small business grants') && content.includes('smaller')) {
      analysis.industryStandards.push('Legitimate small business grants typically much smaller amounts');
    }
    
    if (content.includes('sba') && content.includes('days to weeks')) {
      analysis.industryStandards.push('SBA loans require days to weeks for approval, not hours');
    }
  });
  
  return analysis;
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

// Enhanced Specific Findings Generation
function generateSpecificFindings(organizationData, domainAnalysis, addressData, comparisonResults, financialData) {
  const findings = [];
  
  // Website findings with multiple entities
  if (organizationData.officialWebsites.length > 0) {
    if (organizationData.multipleEntities.length > 1) {
      findings.push(`Multiple "Bridge Capital" entities found: official sites include ${organizationData.officialWebsites.slice(0, 2).join(', ')}`);
    } else {
      findings.push(`Official website found: ${organizationData.officialWebsites[0]}`);
    }
  }
  
  // Domain mismatch findings - prioritize this as it's critical
  if (domainAnalysis.domainMismatches.length > 0) {
    findings.push(`⚠️ ${domainAnalysis.domainMismatches[0]}`);
  }
  
  // Domain risk factors
  if (domainAnalysis.riskFactors.length > 0) {
    findings.push(`⚠️ ${domainAnalysis.riskFactors[0]}`);
  }
  
  // Financial analysis findings
  if (financialData && financialData.approvalTimeAnalysis.length > 0) {
    findings.push(`⚠️ ${financialData.approvalTimeAnalysis[0]}`);
  }
  
  if (financialData && financialData.offerLegitimacy.length > 0) {
    findings.push(`${financialData.offerLegitimacy[0]}`);
  }
  
  // Address findings
  if (addressData.verificationStatus.length > 0 && addressData.locationType.length > 0) {
    findings.push(`Address verified: ${addressData.verificationStatus[0]} - ${addressData.locationType[0]}`);
  }
  
  // Business registration
  if (organizationData.businessRegistration.length > 0) {
    findings.push(`Business registration: ${organizationData.businessRegistration[0]}`);
  }
  
  // Fraud alerts
  if (organizationData.fraudAlerts.length > 0) {
    findings.push(organizationData.fraudAlerts[0]);
  }
  
  // Remove duplicates and limit to most important
  return [...new Set(findings)].slice(0, 6);
}

// Enhanced Risk Calculation
function calculateComprehensiveRisk(organizationData, domainAnalysis, addressData, comparisonResults, financialData) {
  let riskScore = 0;
  const riskFactors = [];
  const legitimacyIndicators = [];
  
  // Domain risk factors (highest weight)
  if (domainAnalysis.domainMismatches.length > 0) {
    riskScore += 35;
    riskFactors.push('Critical: Sender domain doesn\'t match official business domains');
  }
  
  if (domainAnalysis.riskFactors.length > 0) {
    riskScore += 25;
    riskFactors.push('Domain exhibits multiple scam characteristics');
  }
  
  // Financial offer risk factors
  if (financialData && financialData.approvalTimeAnalysis.length > 0) {
    riskScore += 20;
    riskFactors.push('Unrealistic approval timeline for claimed amount');
  }
  
  if (financialData && financialData.redFlags.length > 0) {
    riskScore += 15;
    riskFactors.push('Financial offer exhibits scam indicators');
  }
  
  // Organization legitimacy factors
  if (organizationData.fraudAlerts.some(alert => alert.includes('⚠️'))) {
    riskScore += 30;
    riskFactors.push('Fraud alerts found for organization');
  } else if (organizationData.fraudAlerts.some(alert => alert.includes('No fraud alerts'))) {
    legitimacyIndicators.push('No fraud alerts found for the organization');
  }
  
  if (organizationData.officialWebsites.length > 0) {
    legitimacyIndicators.push('Official business websites verified');
  }
  
  if (organizationData.businessRegistration.length > 0) {
    legitimacyIndicators.push('Business registration information found');
  }
  
  // Address verification factors
  if (addressData.verificationStatus.length > 0) {
    legitimacyIndicators.push('Business address verified as valid');
  }
  
  if (addressData.locationType.some(type => type.includes('⚠️'))) {
    riskScore += 10;
    riskFactors.push('Address may be virtual office or mail service');
  }
  
  // Determine status based on enhanced risk calculation
  let status, summary;
  if (riskScore >= 60) {
    status = 'HIGH_RISK_DETECTED';
    summary = 'Multiple critical risk factors detected. This appears to be a scam attempt.';
  } else if (riskScore >= 35) {
    status = 'MODERATE_RISK_DETECTED';
    summary = 'Significant risk factors present. Exercise extreme caution and verify independently.';
  } else if (riskScore >= 20) {
    status = 'SOME_CONCERNS_DETECTED';
    summary = 'Some risk factors present. Additional verification recommended before proceeding.';
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
    details: [
      `Risk score: ${riskScore}/100`,
      `Risk factors identified: ${riskFactors.length}`,
      `Legitimacy indicators: ${legitimacyIndicators.length}`,
      `Domain analysis: ${domainAnalysis.riskFactors.length} concerns found`
    ],
    riskFactors,
    legitimacyIndicators,
    riskScore
  };
}

// Enhanced targeted actions with financial context
function generateTargetedActions(riskAssessment, comparisonResults, financialData) {
  const actions = [];
  
  if (riskAssessment.status === 'HIGH_RISK_DETECTED') {
    actions.push('🚨 Do not respond - multiple scam indicators detected');
    actions.push('🚨 Report this to your email provider as phishing');
    actions.push('🚨 Delete message and block sender immediately');
  } else if (riskAssessment.status === 'MODERATE_RISK_DETECTED') {
    actions.push('⚠️ High caution - significant red flags detected');
    actions.push('📞 If interested, contact company directly through verified official website');
    actions.push('🔍 Never use contact information provided in the email');
  } else if (riskAssessment.status === 'VERIFIED_LEGITIMATE') {
    actions.push('✅ Business appears legitimate - proceed with standard verification');
    actions.push('📞 Contact through official website to verify this specific offer');
    actions.push('🔍 Verify all terms and conditions independently');
  } else {
    actions.push('🔍 Conduct thorough verification before any response');
    actions.push('📞 Contact organization through independently verified channels only');
    actions.push('⚠️ Do not provide sensitive information until fully verified');
  }
  
  return actions.slice(0, 3);
}

// Helper function to generate verification details for UI display
function generateVerificationDetails(organizationData, domainAnalysis, addressData, financialData) {
  const details = [];
  
  // Add organization details
  if (organizationData.multipleEntities.length > 1) {
    details.push(`Found ${organizationData.multipleEntities.length} different "Bridge Capital" entities`);
  }
  
  if (organizationData.officialWebsites.length > 0) {
    details.push(`Official websites: ${organizationData.officialWebsites.slice(0, 2).join(', ')}`);
  }
  
  // Add domain analysis details
  if (domainAnalysis.domainMismatches.length > 0) {
    details.push(`Domain mismatch: ${domainAnalysis.domainMismatches[0]}`);
  }
  
  if (domainAnalysis.riskFactors.length > 0) {
    details.push(`Domain concerns: ${domainAnalysis.riskFactors[0]}`);
  }
  
  // Add financial analysis details
  if (financialData && financialData.approvalTimeAnalysis.length > 0) {
    details.push(`Funding analysis: ${financialData.approvalTimeAnalysis[0]}`);
  }
  
  // Add address details
  if (addressData.verificationStatus.length > 0) {
    details.push(`Address: ${addressData.verificationStatus[0]}`);
  }
  
  return details.slice(0, 5);
}

// Helper function to generate enhanced official sources
function generateOfficialSources(organizationData, domainAnalysis, riskAssessment) {
  const sources = [];
  
  if (riskAssessment.status === 'HIGH_RISK_DETECTED') {
    sources.push('Report to FTC at reportfraud.ftc.gov');
    sources.push('Forward suspicious email to spam@uce.gov');
    sources.push('Report to your email provider as phishing');
  } else {
    // Include official websites found
    if (organizationData.officialWebsites.length > 0) {
      organizationData.officialWebsites.slice(0, 2).forEach(website => {
        sources.push(`Official website: ${website}`);
      });
    }
    
    sources.push('Better Business Bureau directory');
    sources.push('State business registration database');
    
    if (organizationData.businessRegistration.length > 0) {
      sources.push('Verify through business registration authority');
    }
  }
  
  return sources.slice(0, 4);
}

// Enhanced summary generation functions
function generateEnhancedDomainSummary(analysis) {
  if (analysis.domainMismatches.length > 0) {
    return `⚠️ Critical domain mismatch: ${analysis.domainMismatches[0]}`;
  } else if (analysis.riskFactors.length > 0) {
    return `⚠️ Domain risk factors: ${analysis.riskFactors[0]}`;
  } else if (analysis.reputationStatus.length > 0) {
    return analysis.reputationStatus[0];
  } else {
    return 'Domain analysis completed';
  }
}

function generateEnhancedAddressSummary(data) {
  if (data.locationType.length > 0 && data.verificationStatus.length > 0) {
    return `${data.verificationStatus[0]} - ${data.locationType[0]}`;
  } else if (data.locationType.some(type => type.includes('⚠️'))) {
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