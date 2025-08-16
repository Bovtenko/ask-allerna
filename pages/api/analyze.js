import PROMPTS from '../../prompts.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { incident } = req.body;

    if (!incident) {
      return res.status(400).json({ error: 'No incident data provided' });
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build the complete prompt for verification guidance
    const fullPrompt = [
      PROMPTS.analysis.base,
      PROMPTS.analysis.philosophy,
      PROMPTS.analysis.noJudgments,
      PROMPTS.redFlagEducation.instruction,
      PROMPTS.redFlagEducation.obviousRedFlags,
      PROMPTS.redFlagEducation.subtlePatterns,
      PROMPTS.redFlagEducation.noRedFlagsMessage,
      PROMPTS.verificationGuidance.primaryMessage,
      PROMPTS.verificationGuidance.universalSteps,
      PROMPTS.verificationGuidance.specificGuidance,
      PROMPTS.verificationGuidance.whyVerify,
      PROMPTS.responseStructure.format,
      PROMPTS.responseStructure.sections,
      PROMPTS.responseStructure.tone,
      PROMPTS.organizationSpecific.banking,
      PROMPTS.organizationSpecific.government,
      PROMPTS.organizationSpecific.utilities,
      PROMPTS.organizationSpecific.technology,
      PROMPTS.educationalContent.spoofingExplanation,
      PROMPTS.educationalContent.subdomainEducation,
      PROMPTS.educationalContent.urgencyTactics,
      PROMPTS.educationalContent.securityMindset,
      `\nCOMMUNICATION TO ANALYZE: ${incident}`,
      PROMPTS.format.jsonOnly,
      `Respond with this exact JSON format:`,
      PROMPTS.format.structure,
      PROMPTS.format.noThreatLevels,
      PROMPTS.format.educationalTone,
      `DO NOT output anything other than valid JSON. Your response must start with { and end with }.`
    ].join('\n\n');

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        temperature: 0.1,
        messages: [{ role: "user", content: fullPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Anthropic API');
    }

    const responseText = data.content[0].text;
    let guidance;

    try {
      // Try to parse the JSON response
      guidance = JSON.parse(responseText);
      
      // Ensure required fields exist with verification-focused defaults
      if (!guidance.whatWeObserved) guidance.whatWeObserved = "Communication content reviewed for verification guidance.";
      if (!guidance.redFlagsToConsider) guidance.redFlagsToConsider = ["No obvious red flags detected"];
      if (!guidance.verificationSteps) guidance.verificationSteps = ["Contact the organization directly using official contact methods"];
      if (!guidance.whyVerificationMatters) guidance.whyVerificationMatters = "Verification through official channels is always the safest security practice.";
      if (!guidance.organizationSpecificGuidance) guidance.organizationSpecificGuidance = "Use official contact information to verify this communication.";
      
    } catch (parseError) {
      // Fallback with verification-focused guidance
      console.error('JSON parsing failed:', parseError);
      guidance = {
        whatWeObserved: "A communication that appears to be from a financial institution regarding account status and payment requirements.",
        redFlagsToConsider: [
          "Unable to verify sender authenticity without additional research",
          "Contains urgent language and payment requests",
          "Requests action within a specific timeframe"
        ],
        verificationSteps: [
          "Contact your financial institution directly using the phone number on your card or statement",
          "Log into your account through the official website (not email links)",
          "Ask customer service if they sent this specific communication",
          "Verify any account status claims through official channels",
          "Do not click links or call numbers provided in the email"
        ],
        whyVerificationMatters: "Even legitimate communications can be spoofed by attackers. Independent verification through official channels protects you regardless of whether this email is genuine or fraudulent.",
        organizationSpecificGuidance: "For banking communications, always use contact information from your physical cards or statements rather than information provided in emails. Log into your account through the bank's official website to check for any notices or messages."
      };
    }

    return res.status(200).json(guidance);

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Return verification-focused error response
    const fallbackGuidance = {
      whatWeObserved: "System error occurred while processing your request",
      redFlagsToConsider: ["System temporarily unavailable"],
      verificationSteps: [
        "Try submitting again",
        "If issues persist, contact support",
        "Continue to exercise caution with the suspicious communication",
        "Verify any concerning communications through official channels regardless of system availability"
      ],
      whyVerificationMatters: "Even when our analysis tools are unavailable, verification through official channels is always the safest approach.",
      organizationSpecificGuidance: "Contact the organization directly using official contact methods to verify any suspicious communications."
    };

    return res.status(500).json(fallbackGuidance);
  }
}