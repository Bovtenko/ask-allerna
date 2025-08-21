// pages/api/analyze.js
// Investigation-focused analysis API for Ask Allerna.
// Neutral language (no scam/not-scam claims). Returns highlights, consistency signals,
// what to double-check, and a guided verification checklist.
// Uses Anthropic (Claude 3.5 Haiku) and Perplexity if keys are set; otherwise falls back to local heuristics.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PPLX_URL = "https://api.perplexity.ai/chat/completions";

// 23 investigation pattern types (neutral phrasing)
const PATTERN_CATEGORIES = [
  "Account Verification / Password Reset",
  "Business Email Compromise (BEC)",
  "Invoice or Payment Method Update",
  "Job Offer / Recruitment",
  "Technical Support Impersonation",
  "Government or Tax Notice",
  "Bank / Financial Institution",
  "Crypto Investment or Wallet Support",
  "Prize / Lottery / Giveaway",
  "Charity / Donation",
  "Shipping / Delivery",
  "Marketplace Buyer/Seller (e.g., Facebook/Craigslist)",
  "Rental / Real Estate",
  "Vendor Onboarding / Supplier Change",
  "Utility or Telecom Provider",
  "Subscription Renewal / Renewal Reminder",
  "Social Media Account Recovery",
  "MFA Fatigue / Push Bombing",
  "QR (Quishing)",
  "Callback Phishing (TOAD)",
  "Voice/Video Impersonation (AI Deepfake)",
  "Document Share (e.g., DocuSign/SharePoint)",
  "Other / Needs Review",
];

// Light keyword map to suggest a pattern when the LLM is unavailable
const CATEGORY_HINTS = [
  { cat: "Account Verification / Password Reset", rx: /(verify|password|account|locked|suspend)/i },
  { cat: "Business Email Compromise (BEC)", rx: /(urgent|wire|bank|routing|ceo|cfo|approve|immediately)/i },
  { cat: "Invoice or Payment Method Update", rx: /(invoice|payment|update payment|billing|card on file)/i },
  { cat: "Job Offer / Recruitment", rx: /(hiring|job offer|recruit|salary|interview|position)/i },
  { cat: "Technical Support Impersonation", rx: /(microsoft|apple|support|technician|virus|malware|remote)/i },
  { cat: "Government or Tax Notice", rx: /(irs|tax|warrant|subpoena|ssa|customs)/i },
  { cat: "Bank / Financial Institution", rx: /(bank of|chase|boa|wells|credit union|wire)/i },
  { cat: "Crypto Investment or Wallet Support", rx: /(crypto|coinbase|wallet|metamask|seed|private key)/i },
  { cat: "Prize / Lottery / Giveaway", rx: /(winner|lottery|prize|claim)/i },
  { cat: "Charity / Donation", rx: /(donate|charity|foundation|relief)/i },
  { cat: "Shipping / Delivery", rx: /(package|shipment|deliver|fedex|ups|tracking)/i },
  { cat: "Marketplace Buyer/Seller (e.g., Facebook/Craigslist)", rx: /(buyer|seller|marketplace|craigslist|facebook)/i },
  { cat: "Rental / Real Estate", rx: /(lease|rental|landlord|tenant|deposit)/i },
  { cat: "Vendor Onboarding / Supplier Change", rx: /(vendor|supplier|onboarding|net30|net60|w9|ach)/i },
  { cat: "Utility or Telecom Provider", rx: /(utility|electric|water|telecom|spectrum|verizon|att)/i },
  { cat: "Subscription Renewal / Renewal Reminder", rx: /(subscription|renewal|expires|auto-renew)/i },
  { cat: "Social Media Account Recovery", rx: /(facebook|instagram|twitter|x\.com|recovery)/i },
  { cat: "MFA Fatigue / Push Bombing", rx: /(mfa|push|approve|two-factor)/i },
  { cat: "QR (Quishing)", rx: /(qr\s?code|scan)/i },
  { cat: "Callback Phishing (TOAD)", rx: /(call back|toll free|refund|support number)/i },
  { cat: "Voice/Video Impersonation (AI Deepfake)", rx: /(voice|video|impersonation|sounds like)/i },
  { cat: "Document Share (e.g., DocuSign/SharePoint)", rx: /(docusign|sharepoint|document shared|view document)/i },
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ userMessage: "Method not allowed" });
  }

  try {
    const { incident, analysisType, step1Results } = req.body || {};

    // Input validation
    if (typeof incident !== "string" || incident.trim().length < 10) {
      return res.status(400).json({
        userMessage:
          "Please paste a bit more detail so we can analyze the message clearly (a few sentences works best).",
      });
    }

    if (!["context", "deep_research"].includes(analysisType)) {
      return res.status(400).json({
        userMessage: "Invalid analysis type. Use 'context' or 'deep_research'.",
      });
    }

    if (analysisType === "context") {
      const step1 = await runContextAnalysis(incident);
      return res.status(200).json(step1);
    }

    // deep_research
    const baseSummary = step1Results || (await runContextAnalysis(incident));
    const step2 = await runDeepResearch(incident, baseSummary);
    return res.status(200).json(step2);
  } catch (e) {
    const tooMany = /429|rate.?limit/i.test(String(e?.message || ""));
    return res.status(tooMany ? 429 : 500).json({
      userMessage: tooMany
        ? "A lot of people are using the service right now. Please try again shortly."
        : "We couldn't complete the check just now. Please try again.",
    });
  }
}

/* ----------------------------- STEP 1 ---------------------------------- */

async function runContextAnalysis(incident) {
  // Prefer Claude 3.5 Haiku for structure; fallback to local heuristics
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;

  if (hasAnthropic) {
    try {
      const prompt = [
        "You are an investigation assistant. Analyze the pasted communication.",
        "Return STRICT JSON (no prose, no markdown) in this shape:",
        `{
          "shouldAutoTrigger": boolean,
          "patternCategory": string,  // choose from this list: ${PATTERN_CATEGORIES.join("; ") }
          "highlights": string[],     // specific plain-language observations
          "entities": {
            "organizations": string[],
            "emailAddresses": string[],
            "domains": string[],
            "urls": string[],
            "phoneNumbers": string[],
            "amounts": string[],
            "addresses": string[]
          },
          "consistencySignals": string[], // things that look normal/expected
          "cautionSignals": string[],     // things that deserve a closer look
          "riskTone": "CAUTION" | "REVIEW" | "CONSISTENT",
          "userFriendly": {
            "summary": string,                  // neutral, helpful summary in 1-2 sentences
            "whatToDoubleCheck": string[],      // checks a person can do themselves
            "independentVerification": string[],// steps with examples (no brand promises)
            "helpfulTips": string[]             // brief educational notes
          }
        }`,
        "Be neutral. Avoid claims like 'this is a scam'. Focus on education and verification.",
        "Keep lists concise and actionable. Use [] if none.",
        "Text:\n" + incident,
      ].join("\n");

      const r = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1400,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await r.json();
      const raw = data?.content?.[0]?.text?.trim() || "";
      const parsed = tryParseJson(raw);

      if (parsed && typeof parsed === "object") {
        // Ensure category is one of our 23 labels
        parsed.patternCategory = snapToCategory(parsed.patternCategory);
        // Reasonable default for auto-trigger: suggest research when tone is CAUTION or REVIEW
        parsed.shouldAutoTrigger =
          parsed.shouldAutoTrigger ?? ["CAUTION", "REVIEW"].includes(parsed.riskTone);

        return sanitizeStep1(parsed, incident);
      }
    } catch {
      // fall through to local
    }
  }

  // Local heuristics fallback
  return sanitizeStep1(localHeuristics(incident), incident);
}

function localHeuristics(incident) {
  const emails = toUnique((incident.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()));
  const urls = toUnique((incident.match(/\bhttps?:\/\/[^\s)]+/gi) || []).map((s) => s));
  const domains = toUnique([
    ...emails.map((e) => e.split("@")[1]),
    ...(incident.match(/\b[a-z0-9-]+\.[a-z]{2,}\b/gi) || []),
  ].map((d) => d.toLowerCase()));
  const phones = toUnique(incident.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || []);
  const amounts = toUnique(incident.match(/\$[\d,]+(?:\.\d{2})?|\b\d{2,3}k\b/gi) || []);

  const urgent = /\b(urgent|immediately|within 24|asap|last chance|final notice)\b/i.test(incident);
  const credentialAsk = /\b(verify|login|password|reset|update (payment|billing)|confirm account)\b/i.test(incident);
  const linkAsk = /\b(click|follow the link|open the portal|update via link)\b/i.test(incident);
  const payout = /\b(refund|wire|bank|routing|ach|crypto)\b/i.test(incident);

  const highlight = [];
  if (urgent) highlight.push("Uses time pressure (e.g., urgent or immediate deadline).");
  if (credentialAsk) highlight.push("Mentions verifying accounts, passwords, or payment details.");
  if (linkAsk) highlight.push("Invites clicking a link or portal to resolve an issue.");
  if (payout) highlight.push("Discusses funds, banking, or refund processing.");

  // Caution vs review vs consistent
  const cautionSignals = [];
  if (urgent) cautionSignals.push("Urgent/deadline pressure is a common manipulation technique.");
  if (credentialAsk) cautionSignals.push("Requests for credentials or payment updates need independent confirmation.");
  if (domains.length > 1) cautionSignals.push("Multiple domains present—ensure they match official sites.");
  if (urls.length > 0) cautionSignals.push("Links may redirect; navigate to official sites manually.");

  const consistencySignals = [];
  if (phones.length) consistencySignals.push("A call-back number is provided—compare it with the official website.");
  if (amounts.length) consistencySignals.push("Specific amounts are stated—confirm against your records.");

  let riskTone = "REVIEW";
  if (urgent || credentialAsk || linkAsk) riskTone = "CAUTION";
  if (!urgent && !credentialAsk && !linkAsk && consistencySignals.length > 0) riskTone = "CONSISTENT";

  const cat = (CATEGORY_HINTS.find((m) => m.rx.test(incident))?.cat) || "Other / Needs Review";

  return {
    shouldAutoTrigger: riskTone !== "CONSISTENT",
    patternCategory: cat,
    highlights: highlight,
    entities: {
      organizations: [],
      emailAddresses: emails,
      domains,
      urls,
      phoneNumbers: phones,
      amounts,
      addresses: [],
    },
    consistencySignals,
    cautionSignals,
    riskTone,
    userFriendly: {
      summary:
        riskTone === "CAUTION"
          ? "Some elements deserve a closer look. Use the checklist below to verify safely."
          : riskTone === "REVIEW"
          ? "There are a few things worth double-checking before you proceed."
          : "Nothing obviously risky stands out, but a quick independent check is still smart.",
      whatToDoubleCheck: [
        "Search for the company’s official website and compare domains and contact info.",
        "If a payment or password update is requested, confirm through the official portal you normally use.",
        "Avoid clicking links; instead, navigate manually to the known website.",
      ],
      independentVerification: [
        "Call the official phone number listed on the company’s website (not the message).",
        "Log into your account by typing the official URL into your browser.",
        "Look up recent alerts from your bank, the FTC, or BBB for similar wording.",
      ],
      helpfulTips: [
        "Time pressure is a common tactic—take a moment to verify.",
        "Never share MFA codes or passwords via email or text.",
        "If in doubt, ask a teammate or manager to review with you.",
      ],
    },
  };
}

function sanitizeStep1(obj, incident) {
  // Normalize shapes, arrays, and category
  const safe = {
    shouldAutoTrigger: !!obj.shouldAutoTrigger,
    patternCategory: snapToCategory(obj.patternCategory),
    highlights: toArray(obj.highlights),
    entities: {
      organizations: toArray(obj.entities?.organizations),
      emailAddresses: toArray(obj.entities?.emailAddresses),
      domains: toArray(obj.entities?.domains),
      urls: toArray(obj.entities?.urls),
      phoneNumbers: toArray(obj.entities?.phoneNumbers),
      amounts: toArray(obj.entities?.amounts),
      addresses: toArray(obj.entities?.addresses),
    },
    consistencySignals: toArray(obj.consistencySignals),
    cautionSignals: toArray(obj.cautionSignals),
    riskTone: ["CAUTION", "REVIEW", "CONSISTENT"].includes(obj.riskTone) ? obj.riskTone : "REVIEW",
    userFriendly: {
      summary: str(obj.userFriendly?.summary) || "Here’s a neutral summary of what stood out.",
      whatToDoubleCheck: toArray(obj.userFriendly?.whatToDoubleCheck),
      independentVerification: toArray(obj.userFriendly?.independentVerification),
      helpfulTips: toArray(obj.userFriendly?.helpfulTips),
    },
    // We also include the original text length for context (not displayed)
    meta: { charCount: incident.length },
  };
  return safe;
}

/* ----------------------------- STEP 2 ---------------------------------- */

async function runDeepResearch(incident, step1) {
  const hasPplx = !!process.env.PERPLEXITY_API_KEY;
  let detailedFindings = "";
  let bullets = [];
  let sources = [];
  let consistencySignals = [];
  let cautionSignals = [];

  if (hasPplx) {
    try {
      const queries = [
        `Identify official website(s), corporate registry or BBB entry related to names/domains in: """${incident}"""`,
        `Check if any domains/emails from the text appear on warning lists or have reputation issues: """${incident}"""`,
        `Verify addresses (virtual office vs. physical) and phone numbers; note mismatches: """${incident}"""`,
        `Find recent advisories describing similar wording/tactics (banks, FTC, IRS, vendor/BEC): """${incident}"""`,
        `Assess plausibility of any amounts/timelines claimed; note typical legitimate timelines: """${incident}"""`,
      ];

      const r = await fetch(PPLX_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "You are a neutral research assistant. Provide concise, sourced facts. Avoid judgments. Use bullet points.",
            },
            {
              role: "user",
              content:
                "Run the following checks and respond with short bullet points grouped by check. Include source links inline when possible.\n" +
                queries.map((q, i) => `${i + 1}. ${q}`).join("\n"),
            },
          ],
        }),
      });

      const data = await r.json();
      detailedFindings = data?.choices?.[0]?.message?.content || "";

      // Parse simple bullet lines and links
      bullets = (detailedFindings.match(/^[-*•]\s.+$/gmi) || []).map((s) => s.replace(/^[-*•]\s/, "").trim());
      sources = (detailedFindings.match(/\bhttps?:\/\/\S+/gi) || []).slice(0, 12);

      // Derive neutral signals
      if (/\b(official site|state registry|incorporated|bbb (?:rating|profile))\b/i.test(detailedFindings)) {
        consistencySignals.push("Found official references (e.g., corporate registry / BBB). Review carefully.");
      }
      if (/\b(virtual office|whois privacy|mismatch|unrelated domain|reputation issue|warning)\b/i.test(detailedFindings)) {
        cautionSignals.push("Some details may not align (e.g., domain/address mismatch or prior warnings).");
      }
      if (/\b(typical timeline|usual|normally takes)\b/i.test(detailedFindings)) {
        consistencySignals.push("Typical timelines referenced for similar requests.");
      }
    } catch {
      // fall through to offline
    }
  }

  // Offline fallback
  if (!detailedFindings) {
    const emails = toArray(step1?.entities?.emailAddresses).slice(0, 5);
    const domains = toArray(step1?.entities?.domains).slice(0, 5);
    const phones = toArray(step1?.entities?.phoneNumbers).slice(0, 5);

    bullets = [
      "Performed offline checks (no live web research available).",
      emails.length ? `Emails mentioned: ${emails.join(", ")}` : "No emails detected in the text.",
      domains.length ? `Domains mentioned: ${domains.join(", ")}` : "No domains detected in the text.",
      phones.length ? `Phone numbers mentioned: ${phones.join(", ")}` : "No phone numbers detected in the text.",
      "Next step: compare the contact details above with those shown on the official company website you find yourself.",
    ];
    sources = [
      "https://www.bbb.org/",
      "https://reportfraud.ftc.gov/",
      "https://haveibeenpwned.com/",
    ];
    detailedFindings =
      "Offline-only fallback executed. No live web results available in this environment.\n" +
      bullets.map((b) => `- ${b}`).join("\n");
    cautionSignals.push("Independent confirmation is recommended before proceeding.");
  }

  // Build user-friendly section
  const userFriendly = {
    overview:
      "We looked for official references, mismatches, and recent advisories that match the wording or claims.",
    keyTakeaways: [
      ...cautionSignals.slice(0, 3),
      ...consistencySignals.slice(0, 3),
    ],
    whatToDoNext: [
      "Use the company’s official website (found via your own search) to confirm contacts and requests.",
      "If money or passwords are involved, confirm by calling a phone number listed on the official site.",
      "Proceed only after you can independently confirm key details.",
    ],
    officialSources: sources.slice(0, 10),
  };

  return {
    researchConducted: true,
    userFriendly,
    detailedFindings,
    // Keep a neutral status for UI styling, not a verdict
    verificationStatus: deriveNeutralStatus({ cautionSignals, consistencySignals }),
  };
}

function deriveNeutralStatus({ cautionSignals, consistencySignals }) {
  if (cautionSignals.length && !consistencySignals.length) return "NEEDS_CONFIRMATION";
  if (cautionSignals.length && consistencySignals.length) return "MIXED_SIGNALS";
  if (!cautionSignals.length && consistencySignals.length) return "APPEARS_CONSISTENT";
  return "RESEARCH_COMPLETED";
}

/* ----------------------------- Utilities -------------------------------- */

function tryParseJson(s) {
  try {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

function toArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [v].filter(Boolean);
}

function toUnique(arr) {
  return [...new Set(arr)];
}

function str(v) {
  return typeof v === "string" ? v : "";
}

function snapToCategory(c) {
  if (!c || typeof c !== "string") return "Other / Needs Review";
  const exact = PATTERN_CATEGORIES.find((x) => x.toLowerCase() === c.toLowerCase());
  if (exact) return exact;
  // fuzzy
  const hint = CATEGORY_HINTS.find((h) => h.cat.toLowerCase() === c.toLowerCase());
  return hint ? hint.cat : "Other / Needs Review";
}
