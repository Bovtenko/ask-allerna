// pages/api/analyze.js
// Ask Allerna — Facts-first investigation API
// Neutral, educational, and discovery-oriented. No “scam/not-scam” claims.
// If ANTHROPIC/Perplexity keys exist, they’re used for optional enrichment;
// the core “Discoveries” are computed locally for speed and determinism.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const PPLX_URL = "https://api.perplexity.ai/chat/completions";

const PATTERN_CATEGORIES = [
  "Job Offer / Recruitment",
  "Account Verification / Password Reset",
  "Business Email Compromise (BEC)",
  "Invoice or Payment Method Update",
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

const CATEGORY_HINTS = [
  { cat: "Job Offer / Recruitment", rx: /(job|hiring|recruit|recruiter|position|part[- ]?time|opportunit)/i },
  { cat: "Business Email Compromise (BEC)", rx: /\b(urgent|wire|routing|approve|cfo|ceo|immediately)\b/i },
  { cat: "Invoice or Payment Method Update", rx: /(invoice|billing|payment method|update payment|card on file)/i },
  { cat: "Account Verification / Password Reset", rx: /(verify|password|account|locked|suspend|reset)/i },
  { cat: "Document Share (e.g., DocuSign/SharePoint)", rx: /(docusign|sharepoint|document shared|view document)/i },
  { cat: "Callback Phishing (TOAD)", rx: /(call\s?back|toll[- ]?free|refund|support number)/i },
  { cat: "Shipping / Delivery", rx: /(package|shipment|deliver|fedex|ups|tracking)/i },
  { cat: "Bank / Financial Institution", rx: /(bank|chase|boa|wells|credit union|wire)/i },
];

const RISK_TLDS = new Set(["xyz", "top", "shop", "cam", "rest", "zip", "click", "kim", "gq", "cf", "ml", "work", "loan", "men"]);
const WELL_KNOWN_BRANDS = ["TEMU", "Amazon", "Microsoft", "Apple", "Meta", "Facebook", "Instagram", "PayPal", "Chase", "Wells Fargo", "IRS", "UPS", "FedEx"];

// very small US area code map just for useful hints (extend as needed)
const AREA_MAP = {
  "781": "Massachusetts (US)",
  "617": "Massachusetts (US)",
  "212": "New York (US)",
  "213": "California (US)",
  "305": "Florida (US)",
  "702": "Nevada (US)",
  "415": "California (US)",
  "646": "New York (US)",
  "347": "New York (US)",
  "718": "New York (US)",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ userMessage: "Method not allowed" });

  try {
    const { incident, analysisType, step1Results } = req.body || {};
    if (typeof incident !== "string" || incident.trim().length < 10) {
      return res.status(400).json({
        userMessage: "Please paste the full message (a few sentences helps extract details).",
      });
    }
    if (!["context", "deep_research"].includes(analysisType)) {
      return res.status(400).json({ userMessage: "Invalid analysis type." });
    }

    if (analysisType === "context") {
      const step1 = await contextAnalysisFactsFirst(incident);
      return res.status(200).json(step1);
    }

    // deep research
    const baseline = step1Results || (await contextAnalysisFactsFirst(incident));
    const step2 = await deepResearchNeutral(incident, baseline);
    return res.status(200).json(step2);
  } catch (err) {
    const tooMany = /429|rate.?limit/i.test(String(err?.message || ""));
    return res.status(tooMany ? 429 : 500).json({
      userMessage: tooMany
        ? "Heavy traffic right now. Please try again in a moment."
        : "We couldn't finish that check. Please try again.",
    });
  }
}

/* ---------------------------------- STEP 1: Facts-first ---------------------------------- */

async function contextAnalysisFactsFirst(text) {
  // Deterministic local extraction (fast)
  const entities = extractEntities(text);
  const derived = deriveSignals(text, entities);

  // Optional: Anthropic enrichment for phrasing (kept minimal and neutral)
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  let enrichedSummary = null;
  if (hasAnthropic) {
    try {
      enrichedSummary = await claudeNeutralSummary(text, entities, derived);
    } catch {
      // ignore — keep local summary
    }
  }

  const riskTone = derived.cautionSignals.length
    ? "CAUTION"
    : derived.consistencySignals.length
    ? "CONSISTENT"
    : "REVIEW";

  return {
    shouldAutoTrigger: riskTone !== "CONSISTENT", // suggest deeper checks when anything notable appears
    patternCategory: derived.patternCategory,
    riskTone,
    discoveries: derived.discoveries, // <= concrete facts for the UI grid
    entities,
    signals: {
      caution: derived.cautionSignals,
      consistent: derived.consistencySignals,
    },
    evidence: derived.evidence, // exact quotes from the text
    userFriendly: {
      summary:
        enrichedSummary ||
        (riskTone === "CAUTION"
          ? "Several elements stand out. Review the discoveries and confirm details using official sources."
          : riskTone === "CONSISTENT"
          ? "No obvious pressure or unusual asks detected. A quick independent confirmation is still recommended."
          : "Some details are worth a closer look. See the discoveries and verification steps below."),
      whatToDoubleCheck: [
        "Search for the company’s official website yourself and compare contacts/domains.",
        "If asked to message a number/app, confirm that channel appears on the company’s official site.",
        "For pay or contract terms, compare with typical ranges and official HR/onboarding procedures.",
      ],
      independentVerification: [
        "Use a phone number or email listed on the official website (not the one in the message).",
        "Type the official website URL manually to log in or contact support.",
        "Look for recent advisories describing similar offers or wording.",
      ],
      helpfulTips: [
        "High daily pay + immediate payouts are often used to attract quick responses.",
        "Generic email domains or random-looking addresses deserve extra scrutiny.",
        "If unsure, share the message with a colleague to get a second view.",
      ],
    },
    meta: {
      charCount: text.length,
    },
  };
}

/* -------------------- Local extractors & signal derivation -------------------- */

function extractEntities(text) {
  const emails = unique((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((s) => s.toLowerCase()));
  const urls = unique(text.match(/\bhttps?:\/\/[^\s)]+/gi) || []);
  const domains = unique([
    ...emails.map((e) => e.split("@")[1]),
    ...(text.match(/\b[a-z0-9-]+\.[a-z]{2,}\b/gi) || []),
  ].map((d) => d.toLowerCase()));
  const phones = unique((text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g) || []).map(normalizePhone));
  const whatsappPhones = unique(
    (text.match(/whats ?app[:\s]?(\+?\d[\d\s().-]{7,}\d)/i) || [])[1]
      ? [normalizePhone((text.match(/whats ?app[:\s]?(\+?\d[\d\s().-]{7,}\d)/i) || [])[1])]
      : []
  );

  // amounts and ranges
  const money = unique(text.match(/\$[\d,]+(?:\.\d{2})?|\b\d{2,3}k\b/gi) || []);
  const ages = unique((text.match(/\b(at\s+least\s+)?(\d{2})\s*(?:\+|years?\s*old)\b/gi) || []).map(sanitizeSpaces));

  const companies = unique(
    // crude capture of likely company tokens (e.g., DSL). Also catch ALLCAPS as company-like.
    (text.match(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g) || []).filter((x) => x.length >= 2 && x.length <= 30)
  );

  // brand mentions (case-insensitive)
  const brands = unique(
    WELL_KNOWN_BRANDS.filter((b) => new RegExp(`\\b${escapeRegex(b)}\\b`, "i").test(text))
  );

  return {
    emailAddresses: emails,
    domains,
    urls,
    phoneNumbers: phones,
    whatsappNumbers: whatsappPhones,
    amounts: money,
    ages,
    brands,
    companies,
  };
}

function deriveSignals(text, entities) {
  const discoveries = [];
  const evidence = [];

  // Sender email
  if (entities.emailAddresses.length) {
    const sender = entities.emailAddresses[0];
    const [local, dom] = sender.split("@");
    const { tld, sld } = splitDomain(dom);
    const localDigitsFrac = (local.replace(/\D/g, "").length || 0) / Math.max(local.length, 1);
    const localLooksRandom = localDigitsFrac >= 0.3 || /[a-z]{2,}\d{3,}/i.test(local);
    const entropy = shannonEntropy(sld);

    discoveries.push(
      { label: "Sender email", value: sender },
      { label: "Email domain", value: dom, badge: tld ? `.${tld}` : undefined },
      { label: "Domain entropy", value: entropy.toFixed(2), note: entropyNote(entropy) },
    );
    if (RISK_TLDS.has(tld)) {
      discoveries.push({ label: "TLD trait", value: `.${tld}`, note: "Low-cost/generic TLD — verify ownership" });
    }
    if (localLooksRandom) {
      discoveries.push({ label: "Local-part pattern", value: local, note: "Random-looking address (many digits)" });
    }
    evidence.push({ type: "contact", quote: sender });
  }

  // WhatsApp / phone
  if (entities.whatsappNumbers.length) {
    entities.whatsappNumbers.forEach((n) => {
      const area = areaHint(n);
      discoveries.push({ label: "WhatsApp contact", value: n, note: area ? `Appears from ${area}` : undefined });
      evidence.push({ type: "contact", quote: `WhatsApp:${n}` });
    });
  } else if (entities.phoneNumbers.length) {
    entities.phoneNumbers.forEach((n) => {
      const area = areaHint(n);
      discoveries.push({ label: "Phone number", value: n, note: area ? `Appears from ${area}` : undefined });
      evidence.push({ type: "contact", quote: n });
    });
  }

  // Payout timing & amounts
  const payoutImmediate = /\b(same[- ]?day|immediate(?:ly)?|instan(t|tly)|on the same day)\b/i.test(text);
  if (payoutImmediate) {
    discoveries.push({ label: "Payout timing", value: "Same-day / immediate", note: "Unusual for most employers" });
    evidence.push({ type: "claim", quote: pullQuote(text, /(same[- ]?day|immediate(?:ly)?|instan(?:t|t)ly)/i) });
  }

  // Daily pay range detection
  const dailyPayMatch = text.match(/\$?(\d{2,5})(?:\s?–\s?|\s?to\s?|\s?-\s?)\$?(\d{2,5})\s*(?:per\s*day|daily|\/day)?/i);
  if (dailyPayMatch) {
    const min = Number(dailyPayMatch[1].replace(/,/g, ""));
    const max = Number(dailyPayMatch[2].replace(/,/g, ""));
    discoveries.push({ label: "Daily pay (claimed)", value: `$${min.toLocaleString()} – $${max.toLocaleString()}` });
    evidence.push({ type: "claim", quote: pullQuote(text, dailyPayMatch[0]) });
  } else {
    // If separate amounts present, still note first two unique values
    if (entities.amounts.length) {
      discoveries.push({ label: "Amounts mentioned", value: entities.amounts.slice(0, 3).join(", ") });
      entities.amounts.slice(0, 2).forEach((m) => evidence.push({ type: "claim", quote: m }));
    }
  }

  // Age requirement
  const ageMatch = text.match(/\b(?:at\s*least\s*)?(\d{2})\s*(?:\+|years?\s*old)\b/i);
  if (ageMatch) {
    discoveries.push({ label: "Age requirement", value: `${ageMatch[1]}+` });
    evidence.push({ type: "policy", quote: pullQuote(text, ageMatch[0]) });
  }

  // Brand & company mentions
  if (entities.brands.length) {
    discoveries.push({ label: "Brands mentioned", value: entities.brands.join(", ") });
    entities.brands.forEach((b) => evidence.push({ type: "brand", quote: pullQuote(text, new RegExp(`\\b${escapeRegex(b)}\\b`, "i")) }));
  }
  if (entities.companies.length) {
    // highlight short, company-like tokens (e.g., “DSL”)
    const likelyCos = entities.companies.filter((c) => c.length <= 6);
    if (likelyCos.length) {
      discoveries.push({ label: "Company tokens", value: unique(likelyCos).join(", ") });
      likelyCos.forEach((c) => evidence.push({ type: "company", quote: c }));
    }
  }

  // Domain ↔ brand mismatch
  const mentions = [...entities.brands.map((b) => b.toLowerCase()), ...entities.companies.map((c) => c.toLowerCase())];
  const brandToken = mentions.find((m) => m.length >= 3);
  const mismatchDomains = entities.domains.filter((d) => brandToken && !d.includes(brandToken.replace(/\s+/g, "")));
  if (brandToken && mismatchDomains.length) {
    discoveries.push({
      label: "Domain ↔ brand",
      value: "Appears unrelated",
      note: `Brand/company token “${brandToken}” not present in domain(s)`,
    });
  }

  // Caution & consistency signals
  const cautionSignals = [];
  const consistencySignals = [];
  if (entities.emailAddresses.length && entities.domains.length) {
    const dom = entities.domains[0];
    const { tld, sld } = splitDomain(dom);
    if (RISK_TLDS.has(tld)) cautionSignals.push(`Domain uses .${tld} (generic/low-cost TLD). Confirm ownership on the official site.`);
    if (shannonEntropy(sld) >= 3.1) cautionSignals.push("Domain label looks random/high-entropy. Verify it belongs to the claimed organization.");
  }
  if (payoutImmediate) cautionSignals.push("Same-day or instant payouts are uncommon for new contractors.");
  if (entities.whatsappNumbers.length) cautionSignals.push("Recruitment via WhatsApp is uncommon for established employers. Check the official careers page.");
  if (mentions.includes("temu".toLowerCase())) cautionSignals.push("Well-known brand mentioned — check if this relationship appears on the brand’s official channels.");
  if (/training/i.test(text)) consistencySignals.push("Training is mentioned (legitimate roles often provide training).");
  if (/part[- ]?time|flexible/i.test(text)) consistencySignals.push("Part-time/flexible schedule described (not inherently unusual).");

  // Category guess
  const patternCategory = (CATEGORY_HINTS.find((h) => h.rx.test(text))?.cat) || "Other / Needs Review";

  return { discoveries, evidence, cautionSignals, consistencySignals, patternCategory };
}

/* ---------------------------------- STEP 2: Neutral research ---------------------------------- */

async function deepResearchNeutral(text, step1) {
  const hasPplx = !!process.env.PERPLEXITY_API_KEY;
  let detailedFindings = "";
  let sources = [];
  let keyTakeaways = [];

  if (hasPplx) {
    try {
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
                "You are a neutral research assistant. Provide concise, sourced facts. Avoid verdicts. Use bullets.",
            },
            {
              role: "user",
              content:
                "Given the following message, look up: 1) official site/corporate registry/BBB references for any company tokens, 2) whether the domains/emails appear on warning lists, 3) whether the phone numbers are published as official contacts, 4) advisories that match the wording. Keep it short, with links.\n\nMessage:\n" +
                text,
            },
          ],
        }),
      });
      const data = await r.json();
      detailedFindings = data?.choices?.[0]?.message?.content || "";

      // Parse bullets & links
      keyTakeaways = (detailedFindings.match(/^[-*•]\s.+$/gmi) || []).map((s) => s.replace(/^[-*•]\s/, "").trim());
      sources = (detailedFindings.match(/\bhttps?:\/\/\S+/gi) || []).slice(0, 12);
    } catch {
      // ignore—fallback below
    }
  }

  if (!detailedFindings) {
    // Offline fallback: report what we can prove from the text itself
    const emails = step1?.entities?.emailAddresses?.slice(0, 1) || [];
    const doms = step1?.entities?.domains?.slice(0, 2) || [];
    const phones = (step1?.entities?.whatsappNumbers?.length ? step1.entities.whatsappNumbers : step1?.entities?.phoneNumbers || []).slice(0, 2);
    keyTakeaways = [
      emails.length ? `Sender email captured: ${emails[0]}` : "No sender email captured.",
      doms.length ? `Domain(s) captured: ${doms.join(", ")}` : "No domains captured.",
      phones.length ? `Contact number(s) captured: ${phones.join(", ")}` : "No phone numbers captured.",
      "For independent confirmation, compare the contacts above with those listed on the company’s official website.",
    ];
    sources = ["https://www.bbb.org/", "https://reportfraud.ftc.gov/"];
    detailedFindings =
      "No live web lookups performed. The following items were extracted directly from the message:\n" +
      keyTakeaways.map((k) => `- ${k}`).join("\n");
  }

  const status = keyTakeaways.some((k) => /warning|mismatch|unrelated|flag/i.test(k))
    ? "NEEDS_CONFIRMATION"
    : keyTakeaways.some((k) => /official|registry|bbb/i.test(k))
    ? "MIXED_SIGNALS"
    : "RESEARCH_COMPLETED";

  return {
    researchConducted: true,
    verificationStatus: status,
    userFriendly: {
      overview: "We looked for official references, contact alignment, and recent advisories matching the wording.",
      keyTakeaways: keyTakeaways.slice(0, 10),
      whatToDoNext: [
        "Find the company’s official site and confirm whether this contact method (email/WhatsApp/number) appears there.",
        "If pay or credentials are requested, confirm with the HR or support contact listed on the official site.",
      ],
      officialSources: sources.slice(0, 10),
    },
    detailedFindings,
  };
}

/* ---------------------------------- Optional Anthropic phrasing ---------------------------------- */

async function claudeNeutralSummary(text, entities, derived) {
  const prompt = [
    "You are an investigation assistant.",
    "Write ONE neutral sentence summarizing what the person received.",
    "Do not say 'scam' or 'legit'. Focus on what is offered/asked and the channels involved.",
    "Example: “You received a part-time job pitch that offers same-day payouts and asks you to respond via WhatsApp.”",
    "Text:\n" + text,
  ].join("\n");

  const r = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await r.json();
  return (data?.content?.[0]?.text || "").trim();
}

/* ---------------------------------- Utils ---------------------------------- */

function unique(arr) { return [...new Set(arr)]; }

function splitDomain(domain) {
  const parts = domain.split(".");
  if (parts.length < 2) return { sld: domain, tld: "" };
  const tld = parts.pop().toLowerCase();
  const sld = parts.pop().toLowerCase();
  return { sld, tld };
}

function shannonEntropy(s) {
  if (!s) return 0;
  const freq = {};
  for (const ch of s.toLowerCase()) freq[ch] = (freq[ch] || 0) + 1;
  const len = s.length;
  let H = 0;
  for (const k in freq) {
    const p = freq[k] / len;
    H += -p * Math.log2(p);
  }
  return H;
}

function entropyNote(H) {
  if (H >= 3.5) return "Very high randomness";
  if (H >= 3.1) return "High randomness";
  if (H >= 2.6) return "Moderate randomness";
  return "Low randomness";
}

function normalizePhone(s) {
  return s.replace(/[^\d+]/g, "").replace(/^00/, "+").replace(/^1(\d{10})$/, "+1$1");
}

function areaHint(e164) {
  // Only attempt for +1 numbers with 10 digits
  const m = e164.match(/^\+?1(\d{10})$/);
  if (!m) return null;
  const n = m[1];
  const area = n.substring(0, 3);
  return AREA_MAP[area] || null;
}

function sanitizeSpaces(s) { return s.replace(/\s+/g, " ").trim(); }

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function pullQuote(text, patternOrStr) {
  let m, str;
  if (patternOrStr instanceof RegExp) {
    m = text.match(patternOrStr);
    str = m ? m[0] : null;
  } else {
    str = patternOrStr;
  }
  if (!str) return null;
  // return a tight quote (trim ~5 chars padding on each side)
  const idx = text.indexOf(str);
  if (idx === -1) return str;
  const start = Math.max(0, idx - 5);
  const end = Math.min(text.length, idx + str.length + 5);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}
