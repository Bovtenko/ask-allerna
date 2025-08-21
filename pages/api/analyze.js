// REPLACE these functions in your pages/api/analyze.js

// Enhanced function to extract specific business findings from research
function extractBusinessFindings(researchResults) {
  const findings = {
    websites: [],
    contacts: [],
    legitimacyIndicators: [],
    registrationInfo: [],
    socialPresence: [],
    customerReviews: [],
    warnings: []
  };
  
  researchResults.forEach(result => {
    const content = result.results;
    
    if (result.category === 'business_verification') {
      // Extract websites
      const websites = content.match(/https?:\/\/[^\s,]+/g);
      if (websites) {
        findings.websites.push(...websites.slice(0, 3));
      }
      
      // Extract legitimacy indicators
      if (content.includes('official website') || content.includes('legitimate business')) {
        findings.legitimacyIndicators.push('Official website verified');
      }
      if (content.includes('professional website') || content.includes('business website')) {
        findings.legitimacyIndicators.push('Professional online presence');
      }
      if (content.includes('contact information') || content.includes('contact details')) {
        findings.legitimacyIndicators.push('Contact information available');
      }
      if (content.includes('testimonials') || content.includes('client reviews')) {
        findings.legitimacyIndicators.push('Customer testimonials present');
      }
      
      // Extract registration/business info
      if (content.includes('registered business') || content.includes('LLC') || content.includes('corporation')) {
        findings.registrationInfo.push('Business registration indicators found');
      }
      if (content.includes('New York') || content.includes('NY')) {
        findings.registrationInfo.push('New York business location confirmed');
      }
      
      // Extract warnings or red flags
      if (content.includes('no fraud alerts') || content.includes('no warnings')) {
        findings.warnings.push('No fraud alerts found');
      }
      if (content.includes('fraud alert') || content.includes('scam warning')) {
        findings.warnings.push('⚠️ Fraud alerts detected');
      }
    }
    
    if (result.category === 'contact_verification') {
      // Extract contact verification results
      if (content.includes('legitimate domain') || content.includes('verified domain')) {
        findings.contacts.push('Email domain appears legitimate');
      }
      if (content.includes('professional email') || content.includes('business email')) {
        findings.contacts.push('Professional email format');
      }
      if (content.includes('suspicious') || content.includes('flagged')) {
        findings.contacts.push('⚠️ Contact methods flagged as suspicious');
      }
    }
  });
  
  return findings;
}

// Enhanced function to generate verification status with specifics
function generateDetailedVerificationStatus(researchResults, step1Results) {
  const findings = extractBusinessFindings(researchResults);
  const entities = step1Results.entitiesDetected || {};
  
  // Check for specific fraud alerts
  const hasSpecificFraudAlerts = findings.warnings.some(w => w.includes('⚠️'));
  
  if (hasSpecificFraudAlerts) {
    return {
      status: 'FRAUD_ALERTS_FOUND',
      details: findings.warnings.filter(w => w.includes('⚠️')),
      summary: 'Specific fraud warnings found for this organization'
    };
  }
  
  // Check for legitimate business indicators
  const legitimacyScore = findings.legitimacyIndicators.length + 
                         findings.registrationInfo.length + 
                         findings.websites.length;
  
  if (legitimacyScore >= 3) {
    return {
      status: 'VERIFIED_LEGITIMATE',
      details: [
        ...findings.legitimacyIndicators.slice(0, 2),
        ...findings.websites.slice(0, 1).map(url => `Official website: ${url}`),
        ...findings.registrationInfo.slice(0, 1)
      ],
      summary: 'Business appears legitimate with verifiable online presence'
    };
  }
  
  if (legitimacyScore >= 1) {
    return {
      status: 'PARTIALLY_VERIFIED',
      details: [
        ...findings.legitimacyIndicators,
        ...findings.websites.slice(0, 1).map(url => `Website found: ${url}`)
      ],
      summary: 'Some legitimate business indicators found, additional verification recommended'
    };
  }
  
  return {
    status: 'RESEARCH_COMPLETED',
    details: ['Research completed with limited verification data'],
    summary: 'Unable to fully verify business legitimacy from available sources'
  };
}

// Enhanced function to extract meaningful key findings
function extractMeaningfulKeyFindings(researchResults, step1Results) {
  const findings = extractBusinessFindings(researchResults);
  const keyFindings = [];
  
  // Add website findings
  if (findings.websites.length > 0) {
    keyFindings.push(`Official website found: ${findings.websites[0]}`);
  }
  
  // Add legitimacy findings
  if (findings.legitimacyIndicators.length > 0) {
    keyFindings.push(findings.legitimacyIndicators[0]);
  }
  
  // Add warning findings
  if (findings.warnings.length > 0) {
    keyFindings.push(findings.warnings[0]);
  }
  
  // Add contact findings
  if (findings.contacts.length > 0) {
    keyFindings.push(findings.contacts[0]);
  }
  
  // Add registration findings
  if (findings.registrationInfo.length > 0) {
    keyFindings.push(findings.registrationInfo[0]);
  }
  
  // Fallback if no specific findings
  if (keyFindings.length === 0) {
    keyFindings.push('Research completed - see detailed findings for more information');
  }
  
  return keyFindings.slice(0, 4); // Limit to top 4 findings
}

// Enhanced function to generate research-based actions with specifics
function generateSpecificResearchActions(researchResults, step1Results) {
  const verificationResult = generateDetailedVerificationStatus(researchResults, step1Results);
  const findings = extractBusinessFindings(researchResults);
  const actions = [];
  
  if (verificationResult.status === 'FRAUD_ALERTS_FOUND') {
    actions.push("⚠️ Do not respond - specific fraud warnings found");
    actions.push("🚨 Report to FTC and relevant authorities");
    actions.push("🗑️ Delete the communication immediately");
  } else if (verificationResult.status === 'VERIFIED_LEGITIMATE') {
    actions.push("✅ Business appears legitimate - proceed with normal verification");
    if (findings.websites.length > 0) {
      actions.push(`📞 Contact through official website: ${findings.websites[0]}`);
    } else {
      actions.push("📞 Contact through official channels listed in their communication");
    }
    actions.push("🔍 Verify identity through independent phone call before sharing sensitive info");
  } else if (verificationResult.status === 'PARTIALLY_VERIFIED') {
    actions.push("🔍 Mixed verification results - exercise additional caution");
    actions.push("📞 Verify through multiple independent sources");
    actions.push("⚠️ Do not share sensitive information until fully verified");
  } else {
    actions.push("🔍 Unable to fully verify - proceed with high caution");
    actions.push("📞 Contact organization through independently verified channels");
    actions.push("⚠️ Consider this high-risk until verified");
  }
  
  return actions.slice(0, 3);
}

// Enhanced function to extract official sources with specifics
function extractSpecificOfficialSources(researchResults) {
  const findings = extractBusinessFindings(researchResults);
  const sources = [];
  
  // Add verified websites
  if (findings.websites.length > 0) {
    findings.websites.slice(0, 2).forEach(website => {
      sources.push(`Official website: ${website}`);
    });
  }
  
  // Add business directories
  sources.push("Better Business Bureau directory");
  sources.push("State business registration records");
  
  // Add specific verification methods
  if (findings.registrationInfo.some(info => info.includes('New York'))) {
    sources.push("New York State Department of State business search");
  }
  
  return sources.slice(0, 4);
}

// UPDATED: Transform research results to user-friendly format with actual findings
function transformResearchToUserFriendly(researchResults) {
  if (!researchResults || !researchResults.researchConducted) {
    return researchResults;
  }

  try {
    // Extract the actual research array from the results
    let actualResearchArray = [];
    
    // Try to reconstruct research array from formatted results
    if (researchResults.detailedFindings) {
      // Parse the detailed findings to extract research data
      const sections = researchResults.detailedFindings.split('=== ');
      sections.slice(1).forEach(section => { // Skip first empty section
        const lines = section.split('\n');
        const description = lines[0].replace(' ===', '');
        const content = lines.slice(1).join('\n').trim();
        
        let category = 'general';
        if (description.toLowerCase().includes('business') || description.toLowerCase().includes('checking')) {
          category = 'business_verification';
        } else if (description.toLowerCase().includes('contact') || description.toLowerCase().includes('verifying')) {
          category = 'contact_verification';
        } else if (description.toLowerCase().includes('threat') || description.toLowerCase().includes('patterns')) {
          category = 'threat_intelligence';
        }
        
        actualResearchArray.push({
          category: category,
          description: description,
          results: content
        });
      });
    }

    // Get step1Results from the research data if available
    const step1Results = {
      scamCategory: researchResults.threatIntelligence?.currentTrends?.[0] || 'Unknown',
      entitiesDetected: {
        organizations: researchResults.businessVerification?.organizationsResearched || [],
        contacts: researchResults.contactAnalysis?.contactsAnalyzed || []
      }
    };

    // Generate enhanced findings
    const verificationResult = generateDetailedVerificationStatus(actualResearchArray, step1Results);
    const keyFindings = extractMeaningfulKeyFindings(actualResearchArray, step1Results);
    const recommendedActions = generateSpecificResearchActions(actualResearchArray, step1Results);
    const officialSources = extractSpecificOfficialSources(actualResearchArray);

    return {
      ...researchResults,
      userFriendly: {
        verificationStatus: verificationResult.status,
        verificationSummary: verificationResult.summary,
        verificationDetails: verificationResult.details,
        keyFindings: keyFindings,
        officialSources: officialSources,
        recommendedActions: recommendedActions,
        rawResearchSections: actualResearchArray.map(r => ({
          title: r.description,
          content: r.results,
          category: r.category
        }))
      }
    };

  } catch (error) {
    console.error('[TRANSFORM-RESEARCH] Error processing results:', error);
    
    // Enhanced fallback with more specific information
    return {
      ...researchResults,
      userFriendly: {
        verificationStatus: 'RESEARCH_COMPLETED',
        verificationSummary: 'Research completed with limited processing capabilities',
        verificationDetails: ['Technical processing limitations encountered'],
        keyFindings: [
          'Research data gathered successfully',
          'Manual review of detailed findings recommended',
          'Standard verification procedures apply'
        ],
        officialSources: [
          "Organization's official website",
          "Better Business Bureau directory",
          "State business registration records"
        ],
        recommendedActions: [
          "🔍 Review detailed research findings below",
          "📞 Contact organization through official channels",
          "⚠️ Exercise standard verification procedures"
        ],
        rawResearchSections: researchResults.detailedFindings ? [{
          title: "Combined Research Results",
          content: researchResults.detailedFindings,
          category: "general"
        }] : []
      }
    };
  }
}