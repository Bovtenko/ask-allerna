// pages/api/analyze.js - Updated with Step 2 Auto-Trigger Logic

export default async function handler(req, res) {
 if (req.method !== 'POST') {
   return res.status(405).json({ error: 'Method not allowed' });
 }

 try {
   const { incident, analysisType = 'context' } = req.body;
   
   if (!incident) {
     return res.status(400).json({ error: 'No incident data provided' });
   }

   if (!process.env.ANTHROPIC_API_KEY) {
     return res.status(500).json({ error: 'Anthropic API key not configured' });
   }

   // STEP 1: Context Analysis
   if (analysisType === 'context') {
     
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
 "whatWeObserved": "Detailed factual description of the communication - who, what, when, how delivered, key claims made",
 "redFlagsIdentified": ["specific red flag 1", "specific red flag 2", "specific red flag 3"],
 "recommendedActions": ["specific action 1", "specific action 2", "specific action 3"],
 "whereToReportOrVerify": ["reporting method 1", "reporting method 2"],
 "entitiesDetected": {
   "organizations": ["company1", "company2"],
   "contacts": ["phone1", "email1", "domain1"],
   "claims": ["claim1", "claim2"]
 },
 "needsDeepResearch": true/false
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

     const data = await response.json();
     let responseText = data.content[0].text;
     
     if (responseText.startsWith('```json')) {
       responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
     }
     
     const analysis = JSON.parse(responseText);
     
     // Auto-trigger logic
     analysis.shouldAutoTrigger = shouldAutoTriggerResearch(analysis);
     
     return res.status(200).json(analysis);
   }

   // STEP 2: Deep Research
   if (analysisType === 'deep_research') {
     const { step1Results } = req.body;
     
     if (!step1Results) {
       return res.status(400).json({ error: 'Step 1 results required for deep research' });
     }

     console.log('[DEEP-RESEARCH] Starting research for:', step1Results.scamCategory);
     
     const researchResults = await conductDeepResearch(step1Results, incident);
     
     return res.status(200).json(researchResults);
   }

   return res.status(400).json({ error: 'Invalid analysis type' });

 } catch (error) {
   console.error('[API] Error:', error);
   return res.status(500).json({
     error: true,
     message: error.message
   });
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
   'Account/Service alerts & reverification/billing'
 ];

 // Auto-trigger if high-impact scam category
 if (highImpactCategories.includes(analysis.scamCategory)) {
   return true;
 }

 // Auto-trigger if business entities detected
 if (analysis.entitiesDetected?.organizations?.length > 0) {
   return true;
 }

 // Auto-trigger if suspicious contacts detected
 if (analysis.entitiesDetected?.contacts?.length > 0) {
   return true;
 }

 // Auto-trigger if verifiable claims made
 if (analysis.entitiesDetected?.claims?.length > 0) {
   return true;
 }

 return false;
}

// Deep research function using Perplexity
async function conductDeepResearch(step1Results, originalIncident) {
 try {
   if (!process.env.PERPLEXITY_API_KEY) {
     return {
       error: 'Perplexity API not configured',
       researchConducted: false
     };
   }

   // Build research queries based on scam category
   const researchQueries = buildResearchQueries(step1Results);
   
   console.log('[DEEP-RESEARCH] Running', researchQueries.length, 'research queries');
   
   // Execute research queries
   const researchPromises = researchQueries.map(async (query, index) => {
     console.log(`[RESEARCH-${index + 1}] ${query.description}`);
     
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
         success: true
       };
     } else {
       return {
         category: query.category,
         description: query.description,
         results: `Research failed: ${response.status}`,
         success: false
       };
     }
   });

   const researchResults = await Promise.all(researchPromises);
   
   // Format research results
   const formattedResults = await formatResearchResults(step1Results, researchResults);
   
   console.log('[DEEP-RESEARCH] Research completed successfully');
   
   return formattedResults;

 } catch (error) {
   console.error('[DEEP-RESEARCH] Error:', error);
   return {
     error: error.message,
     researchConducted: false
   };
 }
}

// Build research queries based on scam category
function buildResearchQueries(step1Results) {
 const queries = [];
 const scamCategory = step1Results.scamCategory;
 const entities = step1Results.entitiesDetected || {};

 // Business verification (if organizations detected)
 if (entities.organizations && entities.organizations.length > 0) {
   entities.organizations.forEach(org => {
     queries.push({
       category: 'business_verification',
       description: `Official verification for ${org}`,
       prompt: `Find official information for organization: "${org}"

Research tasks:
1. Official website and verified contact information
2. Legitimate business registration and licensing details
3. Official social media accounts and verification status
4. Any fraud alerts or scam warnings posted by the organization
5. Official customer service and communication procedures
6. Recent news or advisories about impersonation attempts

Focus on: Official websites, government business registries, verified social media, company fraud alert pages.
Provide: Exact URLs, phone numbers, email domains, and any official warnings with dates.`
     });
   });
 }

 // Contact verification (if contacts detected)
 if (entities.contacts && entities.contacts.length > 0) {
   queries.push({
     category: 'contact_verification',
     description: 'Suspicious contact analysis',
     prompt: `Analyze these suspicious contacts for fraud indicators:

CONTACTS: ${entities.contacts.join(', ')}

Research tasks:
1. Domain analysis and reputation checks
2. Phone number verification and legitimacy
3. Email domain verification and security status
4. Scam database searches (BBB Scam Tracker, FTC database)
5. Technical analysis (SSL certificates, domain age, registration)

Focus on: Scam reporting sites, domain analysis tools, official contact verification.
Provide: Risk assessment for each contact with specific evidence.`
   });
 }

 // Category-specific research
 queries.push(...getCategorySpecificQueries(scamCategory, entities));

 // Current threat landscape
 queries.push({
   category: 'threat_landscape',
   description: `Current ${scamCategory} threat intelligence`,
   prompt: `Find current threat intelligence for: "${scamCategory}"

Research tasks:
1. Recent scam reports and statistics for 2024-2025
2. Government and security agency warnings
3. Common tactics and red flags being used
4. Official reporting mechanisms and resources
5. Recent cases and victim experiences
6. Security recommendations from authorities

Focus on: Government websites (.gov), security advisories, recent fraud reports.
Provide: Current trends, official warnings, specific reporting contacts.`
 });

 return queries;
}

// Category-specific research queries
function getCategorySpecificQueries(scamCategory, entities) {
 const queries = [];

 switch (scamCategory) {
   case 'Recruitment/job-offer scams':
     queries.push({
       category: 'employment_verification',
       description: 'Employment and recruitment verification',
       prompt: `Research employment and job offer legitimacy:

1. Legitimate hiring processes and red flags in job offers
2. Official company recruitment channels and procedures
3. Work-from-home job scam patterns and warnings
4. Department of Labor and FTC employment fraud alerts
5. Better Business Bureau employment scam reports
6. Official guidance on verifying job opportunities

Focus on: Official company careers pages, government employment resources, scam prevention guides.`
     });
     break;

   case 'BEC & payment diversion':
     queries.push({
       category: 'bec_analysis',
       description: 'Business Email Compromise analysis',
       prompt: `Research Business Email Compromise and payment fraud:

1. Current BEC attack trends and financial losses
2. Vendor payment redirection scam techniques
3. Official business payment change procedures
4. FBI IC3 BEC alerts and warnings
5. Financial industry fraud prevention guidelines
6. Business email security best practices

Focus on: FBI IC3 reports, financial security advisories, business fraud prevention.`
     });
     break;

   case 'Government/authority/utility impersonation':
     queries.push({
       category: 'government_verification',
       description: 'Government agency verification',
       prompt: `Research government and authority impersonation:

1. Official government agency contact procedures
2. Legitimate government communication methods
3. Current government impersonation scam alerts
4. Official reporting mechanisms for fraud
5. Government agency fraud prevention resources
6. How to verify genuine government communications

Focus on: Official .gov websites, agency fraud alerts, government scam prevention.`
     });
     break;

   default:
     // Generic scam research for other categories
     queries.push({
       category: 'general_scam_research',
       description: `${scamCategory} pattern analysis`,
       prompt: `Research current patterns for: "${scamCategory}"

1. Common tactics and social engineering methods
2. Recent scam reports and victim experiences  
3. Official warnings and advisories
4. Prevention recommendations from authorities
5. Reporting mechanisms and resources
6. Current trends and emerging threats

Focus on: Security advisories, scam prevention resources, official warnings.`
     });
 }

 return queries;
}

// Format research results into structured output
async function formatResearchResults(step1Results, researchResults) {
 try {
   const combinedFindings = researchResults.map(r => `
=== ${r.category.toUpperCase()}: ${r.description} ===
${r.results || 'Research failed'}
`).join('\n');

   const formatPrompt = `You are formatting research results for a security analysis report.

ORIGINAL ANALYSIS:
Scam Category: ${step1Results.scamCategory}
What We Observed: ${step1Results.whatWeObserved}

RESEARCH FINDINGS:
${combinedFindings}

Format this into a structured deep research report. Extract specific, actionable information.

Return ONLY this JSON:
{
 "researchConducted": true,
 "businessVerification": {
   "organizationsResearched": ["list of organizations investigated"],
   "officialContacts": ["verified official contact methods"],
   "legitimacyStatus": "verified|suspicious|unknown",
   "fraudAlerts": ["any official warnings found with dates"]
 },
 "contactAnalysis": {
   "contactsAnalyzed": ["contacts that were investigated"],
   "riskAssessment": ["risk level and reasoning for each contact"],
   "comparisonFindings": ["how suspicious contacts compare to official ones"]
 },
 "threatIntelligence": {
   "currentTrends": ["recent trends in this scam category"],
   "officialWarnings": ["government/security warnings with sources"],
   "recentIncidents": ["similar cases with details"],
   "reportingMechanisms": ["where to report with contact details"]
 },
 "verificationGuidance": {
   "howToVerify": ["specific steps to verify legitimacy"],
   "officialChannels": ["correct ways to contact organizations"],
   "redFlagsToWatch": ["additional warning signs from research"]
 },
 "investigationSummary": "2-3 sentence summary of key research findings"
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
       messages: [{ role: "user", content: formatPrompt }]
     })
   });

   const data = await response.json();
   let responseText = data.content[0].text;
   
   if (responseText.startsWith('```json')) {
     responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
   }
   
   return JSON.parse(responseText);

 } catch (error) {
   console.error('[FORMAT-RESEARCH] Error:', error);
   return {
     researchConducted: false,
     error: 'Failed to format research results',
     investigationSummary: 'Research formatting failed'
   };
 }
}