// prompts.js
const PROMPTS = {
  analysis: {
    base: `You are an expert cybersecurity analyst. Analyze this potential security incident with careful consideration of both legitimate and malicious patterns.`,
    
    withThreatIntel: `Before making your final assessment, you have been provided with current threat intelligence data. Use this information to make an informed decision about whether this incident matches known threats or appears to be legitimate communication.`,
    
    balanced: `Important: Many communications that seem unusual are actually legitimate. Only flag as suspicious if you find clear evidence of malicious intent or patterns matching known threats.`
  },

  research: {
    instruction: `THREAT INTELLIGENCE RESEARCH REQUIRED: Before analyzing, research the following:`,
    
    domains: `1. Verify any domains mentioned - check if they are legitimate business domains or appear in recent threat reports`,
    
    phoneNumbers: `2. Research any phone numbers - look for scam reports or legitimate business associations`,
    
    patterns: `3. Search for similar phishing/scam campaigns that match the language patterns, urgency tactics, or social engineering techniques used`,
    
    currentThreats: `4. Check for current threat campaigns targeting the mentioned organization or industry`
  },

  evidence: {
    requirement: `Base your assessment on EVIDENCE, not assumptions. For any suspicious rating, cite specific findings from your research.`,
    
    legitimateCheck: `If research shows the sender/domain/pattern is legitimate, rate accordingly even if the message seems unusual.`,
    
    insufficientContext: `If the provided text is too vague, brief, or lacks sufficient detail for meaningful security analysis, respond with a request for more information rather than attempting analysis.`
  },

  insufficientContext: {
    detection: `If the incident description is less than 20 words, contains only generic phrases like "weird email" or "suspicious call", or lacks specific details about the communication method, sender, content, or context, classify as insufficient information.`,
    
    response: `When insufficient information is provided, respond with threatLevel "NEEDS_MORE_INFO" and guide the user to provide more comprehensive details for accurate analysis.`
  },

  format: {
    jsonOnly: `IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON. Your entire response should be parseable JSON.`,
    
    structure: `{
  "threatLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE" | "NEEDS_MORE_INFO",
  "incidentType": "string describing the type of threat or 'Legitimate Communication' or 'Insufficient Information for Analysis'",
  "riskScore": number between 0-100,
  "immediateAction": "string with immediate action needed",
  "redFlags": ["array", "of", "warning", "signs", "detected"],
  "researchFindings": ["array", "of", "key", "research", "discoveries"],
  "explanation": "detailed explanation including research evidence or request for more information",
  "nextSteps": ["Report to IT security if suspicious", "other", "specific", "actions"]
}`,

    safetyNote: `CRITICAL: For ANY suspicious activity, the FIRST recommendation must ALWAYS be to report to IT security/company security team immediately.`,

    insufficientInfoTemplate: `For insufficient information cases, use this structure:
{
  "threatLevel": "NEEDS_MORE_INFO",
  "incidentType": "Insufficient Information for Analysis",
  "riskScore": 0,
  "immediateAction": "Please provide more detailed information about the suspicious communication for accurate analysis",
  "redFlags": ["Not enough context provided for meaningful security assessment"],
  "researchFindings": ["Analysis requires more specific details about the communication"],
  "explanation": "To provide an accurate security assessment, we need more details about the suspicious communication. Please include: sender information (email/phone/name), complete message content, how you received it, any links or attachments mentioned, what specifically seemed suspicious, and the context of the communication.",
  "nextSteps": [
    "Provide sender details (email address, phone number, claimed organization)",
    "Include the complete message content or detailed description of the conversation", 
    "Explain what specifically made this communication seem suspicious to you",
    "Mention any links, attachments, or requests for personal information",
    "Include timing and context (unsolicited, response to something, etc.)",
    "Resubmit with this additional information for a comprehensive security analysis"
  ]
}`
  }
};

export default PROMPTS;