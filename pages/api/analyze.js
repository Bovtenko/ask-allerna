// pages/api/analyze.js - Ask Allerna Style Implementation

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

   if (analysisType === 'context') {
     
     const prompt = `You are Ask Allerna, an AI assistant trained to detect scams and social engineering attempts across all formats: email, SMS, voice, QR codes, job offers, documents, invoices, websites, and more.

You operate in three stages:

---
🧠 STAGE 1: INTERPRET
- Carefully analyze the content provided.
- Identify the most likely SCAM CATEGORY from the following list:
 [Business Email Compromise, Employment Scam, Vendor/Invoice Fraud, Phishing & Credential Theft, Tech Support Scam, Romance Scam, Investment Scam, Government Impersonation, Refund Scam, Lottery Scam, Charity Scam, Marketplace Scam, Identity Theft, Social Media Scam, QR Code Scam, Malware Delivery, Deepfake Impersonation, SIM Swap, Legal Threat Scam, Sextortion, Fake Update Scam, SaaS Imitation, Task Scam, Tailgating/Physical Access Scam, Rogue Wi-Fi Attack, Package Delivery Scam, Other]

---
🔍 STAGE 2: ANALYZE
- Detect and list clear indicators and red flags. Examples: impersonation, urgency, payment request, personal info request, fake domain, inconsistency, unrealistic offer, etc.
- Reference tactics commonly used in social engineering.

---
🛡️ STAGE 3: RESPOND
Return a structured, plain-language response with the following:

COMMUNICATION TO ANALYZE:
"${incident}"

Return ONLY this JSON format:
{
 "scamCategory": "Most Likely Scam Category from the list above",
 "whatWeObserved": "Short summary of the situation in factual terms",
 "redFlagsIdentified": [
   "Specific signal 1 found in the message",
   "Specific signal 2 found in the message", 
   "Specific signal 3 found in the message"
 ],
 "recommendedActions": [
   "Specific action 1 user should take",
   "Specific action 2 user should take",
   "Specific action 3 user should take"
 ],
 "whereToReportOrVerify": [
   "Specific URL or contact method 1",
   "Specific URL or contact method 2"
 ]
}

Do not label the message as "safe" or "unsafe." Do not use risk levels. Let the facts and flags speak for themselves.
Be concise, neutral, and clear.`;

     const response = await fetch("https://api.anthropic.com/v1/messages", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "x-api-key": process.env.ANTHROPIC_API_KEY,
         "anthropic-version": "2023-06-01"
       },
       body: JSON.stringify({
         model: "claude-3-5-haiku-20241022",
         max_tokens: 400,
         temperature: 0.1,
         messages: [{ role: "user", content: prompt }]
       })
     });

     const data = await response.json();
     let responseText = data.content[0].text;
     
     // Clean JSON
     if (responseText.startsWith('```json')) {
       responseText = responseText.replace(/```json\n?/, '').replace(/\n?```$/, '');
     }
     
     const analysis = JSON.parse(responseText);
     return res.status(200).json(analysis);
   }

   return res.status(400).json({ error: 'Invalid analysis type' });

 } catch (error) {
   return res.status(500).json({
     error: true,
     message: error.message
   });
 }
}