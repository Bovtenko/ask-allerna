// components/AskAllerna.js - Complete Updated Code with Raw Research Data

import React, { useState, useEffect } from 'react';
import { Shield, Send, Search, Clock, CheckCircle, AlertTriangle, RotateCcw, FileText, Eye, Flag, CheckSquare, Building, Users, TrendingUp, Copy, ExternalLink, Loader } from 'lucide-react';

const AskAllerna = () => {
 const [input, setInput] = useState('');
 const [step1Analysis, setStep1Analysis] = useState(null);
 const [step2Research, setStep2Research] = useState(null);
 const [isAnalyzing, setIsAnalyzing] = useState(false);
 const [isResearching, setIsResearching] = useState(false);
 const [researchStatus, setResearchStatus] = useState('');
 const [error, setError] = useState(null);
 const [isAnalysisMode, setIsAnalysisMode] = useState(false);
 const [highlightedText, setHighlightedText] = useState('');
 const [showReport, setShowReport] = useState(false);
 const [reportText, setReportText] = useState('');

 // Fallback regex-based highlighting
 const highlightSuspiciousText = (text) => {
   if (!text) return '';
   let highlightedText = text;

   // High Risk Patterns (Red)
   const highRiskPatterns = [
     /https?:\/\/[^\s]+/gi,
     /www\.[^\s]+/gi,
     /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/gi,
     /\$[0-9,]+(\.[0-9]{2})?/gi,
     /bitcoin|btc|cryptocurrency|crypto|wallet/gi,
   ];

   // Medium Risk Patterns (Orange)
   const mediumRiskPatterns = [
     /\b(urgent|immediately|asap|expire[sd]?|deadline|limited time|act now)\b/gi,
     /\b(verify|confirm|update|validate|authenticate)\b/gi,
     /\b(click here|download|install|enable|disable)\b/gi,
   ];

   // Suspicious Patterns (Yellow)
   const suspiciousPatterns = [
     /\b(whatsapp|telegram|signal)\b/gi,
     /\b(job offer|employment|work from home|easy money)\b/gi,
     /\b(winner|prize|lottery|congratulations)\b/gi,
   ];

   // Company Patterns (Blue)
   const companyPatterns = [
     /\b(amazon|microsoft|apple|google|facebook|paypal)\b/gi,
     /\b(bank|credit union|visa|mastercard)\b/gi,
   ];

   // Apply highlighting
   highRiskPatterns.forEach(pattern => {
     highlightedText = highlightedText.replace(pattern, (match) => 
       `<span class="bg-red-100 text-red-800 px-2 py-1 rounded font-medium">${match}</span>`
     );
   });

   mediumRiskPatterns.forEach(pattern => {
     highlightedText = highlightedText.replace(pattern, (match) => 
       `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium">${match}</span>`
     );
   });

   suspiciousPatterns.forEach(pattern => {
     highlightedText = highlightedText.replace(pattern, (match) => 
       `<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">${match}</span>`
     );
   });

   companyPatterns.forEach(pattern => {
     highlightedText = highlightedText.replace(pattern, (match) => 
       `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">${match}</span>`
     );
   });

   return highlightedText;
 };

 // Update highlighted text when in analysis mode
 useEffect(() => {
   if (isAnalysisMode && input) {
     const highlighted = highlightSuspiciousText(input);
     setHighlightedText(highlighted);
   }
 }, [input, isAnalysisMode]);

 // Step 1: Initial analysis
 const analyzeIncident = async () => {
   if (!input.trim()) return;
   setIsAnalysisMode(true);
   setHighlightedText(highlightSuspiciousText(input));
   setIsAnalyzing(true);
   setError(null);
   setStep1Analysis(null);
   setStep2Research(null);
   
   try {
     const response = await fetch("/api/analyze", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ incident: input, analysisType: 'context' })
     });
     
     if (response.ok) {
       const data = await response.json();
       setStep1Analysis(data);
       
       // Auto-trigger Step 2 if needed
       if (data.shouldAutoTrigger) {
         setTimeout(() => runDeepResearch(data), 1000);
       }
     } else {
       throw new Error(`Analysis failed: ${response.status}`);
     }
   } catch (error) {
     setError(`Analysis error: ${error.message}`);
   }
   
   setIsAnalyzing(false);
 };

 // Step 2: Deep research
 const runDeepResearch = async (step1Results) => {
   setIsResearching(true);
   setResearchStatus('Initializing research...');
   
   try {
     setResearchStatus('Verifying business information...');
     
     const response = await fetch("/api/analyze", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ 
         incident: input, 
         analysisType: 'deep_research',
         step1Results: step1Results || step1Analysis
       })
     });
     
     if (response.ok) {
       const data = await response.json();
       setStep2Research(data);
       setResearchStatus('Research completed');
     } else {
       throw new Error(`Research failed: ${response.status}`);
     }
   } catch (error) {
     setError(`Research error: ${error.message}`);
     setResearchStatus('Research failed');
   }
   
   setIsResearching(false);
 };

 const newAnalysis = () => {
   setInput('');
   setStep1Analysis(null);
   setStep2Research(null);
   setError(null);
   setHighlightedText('');
   setResearchStatus('');
 };

 const exitAnalysis = () => {
   newAnalysis();
   setIsAnalysisMode(false);
 };

 // UPDATED: Generate report with raw research data
 const generateReport = () => {
   const timestamp = new Date().toLocaleString();
   const reportId = `ALR-${Date.now().toString().slice(-8)}`;

   let step2Section = '';
   if (step2Research && step2Research.researchConducted) {
     step2Section = `
=== DEEP RESEARCH RESULTS ===

INVESTIGATION SUMMARY:
${step2Research.investigationSummary || 'Research completed'}

BUSINESS VERIFICATION:
Organizations Researched: ${step2Research.businessVerification?.organizationsResearched?.join(', ') || 'None'}
Official Contacts: ${step2Research.businessVerification?.officialContacts?.join(', ') || 'None found'}
Legitimacy Status: ${step2Research.businessVerification?.legitimacyStatus || 'Unknown'}
Fraud Alerts: ${step2Research.businessVerification?.fraudAlerts?.join(', ') || 'None found'}

CONTACT ANALYSIS:
Contacts Analyzed: ${step2Research.contactAnalysis?.contactsAnalyzed?.join(', ') || 'None'}
Risk Assessment: ${step2Research.contactAnalysis?.riskAssessment?.join(', ') || 'None provided'}
Comparison Findings: ${step2Research.contactAnalysis?.comparisonFindings?.join(', ') || 'None available'}

THREAT INTELLIGENCE:
Current Trends: ${step2Research.threatIntelligence?.currentTrends?.join(', ') || 'None available'}
Official Warnings: ${step2Research.threatIntelligence?.officialWarnings?.join(', ') || 'None found'}
Recent Incidents: ${step2Research.threatIntelligence?.recentIncidents?.join(', ') || 'None found'}

VERIFICATION GUIDANCE:
How to Verify: ${step2Research.verificationGuidance?.howToVerify?.join(', ') || 'Standard verification recommended'}
Official Channels: ${step2Research.verificationGuidance?.officialChannels?.join(', ') || 'Contact through known methods'}

=== DETAILED RESEARCH FINDINGS ===
${step2Research.detailedFindings || step2Research.rawResults || 'Detailed research data not available'}`;
   }

   const report = `=== ASK ALLERNA SECURITY ANALYSIS REPORT ===

INCIDENT SUMMARY:
${input}

ANALYSIS RESULTS:
Generated: ${timestamp}
Report ID: ${reportId}

=== STEP 1: INITIAL ANALYSIS ===

SCAM CATEGORY: ${step1Analysis?.scamCategory || 'Not classified'}

WHAT WE OBSERVED:
${step1Analysis?.whatWeObserved || 'No observations recorded'}

RED FLAGS IDENTIFIED:
${step1Analysis?.redFlagsIdentified?.map(flag => `• ${flag}`).join('\n') || 'No red flags identified'}

RECOMMENDED ACTIONS:
${step1Analysis?.recommendedActions?.map(action => `• ${action}`).join('\n') || 'No specific actions recommended'}

WHERE TO REPORT OR VERIFY:
${step1Analysis?.whereToReportOrVerify?.map(item => `• ${item}`).join('\n') || 'No reporting information available'}

${step2Section}

--- END OF REPORT ---`;

   setReportText(report);
   setShowReport(true);
 };

 const copyReport = async () => {
   try {
     await navigator.clipboard.writeText(reportText);
     alert('Report copied to clipboard!');
   } catch (err) {
     const textArea = document.createElement('textarea');
     textArea.value = reportText;
     document.body.appendChild(textArea);
     textArea.select();
     document.execCommand('copy');
     document.body.removeChild(textArea);
     alert('Report copied to clipboard!');
   }
 };

 return (
   <div className="min-h-screen bg-white font-sans">
     <style dangerouslySetInnerHTML={{
       __html: `
       .highlight-overlay {
         white-space: pre-wrap;
         word-wrap: break-word;
         line-height: 1.5;
         pointer-events: none;
         position: absolute;
         top: 0; left: 0; right: 0; bottom: 0;
         padding: 1rem;
         font-family: inherit;
         font-size: inherit;
         z-index: 1;
         overflow: auto;
       }
       .input-overlay-container { position: relative; }
       .input-base {
         background: transparent;
         position: relative;
         z-index: 2;
         color: transparent;
         caret-color: #374151;
       }
       .input-visible { color: #374151; z-index: 3; }
       `
     }} />

     {/* Landing Page */}
     {!isAnalysisMode && (
       <div className="max-w-2xl mx-auto px-6 py-12">
         <div className="text-center mb-10">
           <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
             <Shield className="w-8 h-8 text-blue-600" />
           </div>
           
           <h1 className="text-5xl font-semibold text-gray-900 mb-4">Ask Allerna</h1>
           <p className="text-xl text-gray-600 mb-8">AI-Powered Scam Detection</p>
           <p className="text-lg text-gray-600 max-w-lg mx-auto">
             Detect scams and social engineering attempts across all formats: email, SMS, voice, QR codes, job offers, and more
           </p>
         </div>

         <div className="mb-8">
           <label className="block text-lg font-medium text-gray-900 mb-4">
             Describe the suspicious communication:
           </label>
           <textarea
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Paste the suspicious email, text message, phone call transcript, job offer, or describe any communication that seems suspicious..."
             className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
           />
           
           {error && (
             <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
               <div className="flex items-center gap-2 text-red-800">
                 <AlertTriangle className="w-5 h-5" />
                 <span className="font-medium">Analysis Error</span>
               </div>
               <p className="text-red-700 text-sm mt-1">{error}</p>
             </div>
           )}

           <button
             onClick={analyzeIncident}
             disabled={isAnalyzing || !input.trim()}
             className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
           >
             <Search className="w-5 h-5" />
             <span>Analyze for Scams</span>
           </button>
         </div>

         <div className="space-y-6">
           <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
             <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2">
               <span>🧠</span>
               Trust Your Instincts
             </h3>
             <p className="text-blue-800">
               The fact that something felt "off" enough for you to check here shows your security awareness is working. 
               <strong> That human intuition is your first line of defense.</strong>
             </p>
           </div>

           <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
               <span>🔒</span>
               Privacy & Data Protection
             </h3>
             <p className="text-gray-700">
               Neutral analysis with transparent processing. No data stored permanently.
             </p>
           </div>
         </div>
       </div>
     )}

     {/* Analysis Dashboard */}
     {isAnalysisMode && (
       <div className="h-screen flex">
         
         {/* Left Column - Input */}
         <div className="w-1/2 border-r border-gray-100 p-6 overflow-y-auto">
           
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <Shield className="w-5 h-5 text-white" />
               </div>
               <span className="text-xl font-semibold text-gray-900">Ask Allerna</span>
             </div>
             <div className="flex gap-2">
               <button 
                 onClick={newAnalysis}
                 className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-2"
               >
                 <RotateCcw className="w-4 h-4" />
                 New
               </button>
               <button 
                 onClick={exitAnalysis}
                 className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
               >
                 Exit
               </button>
             </div>
           </div>

           <div className="space-y-6">
             <div>
               <h2 className="text-lg font-medium text-gray-900 mb-4">Communication Analysis</h2>
               
               <div className="input-overlay-container h-96 mb-4">
                 {highlightedText ? (
                   <>
                     <div 
                       className="highlight-overlay border border-gray-200 rounded-lg bg-white" 
                       dangerouslySetInnerHTML={{ __html: highlightedText }} 
                     />
                     <textarea
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       className="input-base w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                       style={{ backgroundColor: 'transparent' }}
                     />
                   </>
                 ) : (
                   <textarea
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder="Describe the suspicious email, phone call, text message, or other communication in detail..."
                     className="input-visible w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                   />
                 )}
               </div>

               <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                 <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                   Analysis Status:
                   {step1Analysis && (
                     <span className="text-green-600 font-medium">✓ Step 1 Complete</span>
                   )}
                   {step2Research && (
                     <span className="text-blue-600 font-medium">✓ Research Complete</span>
                   )}
                 </div>
                 <div className="grid grid-cols-2 gap-3 text-sm">
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
                     <span className="text-gray-600">High Risk</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></span>
                     <span className="text-gray-600">Medium Risk</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span>
                     <span className="text-gray-600">Suspicious</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                     <span className="text-gray-600">Organization</span>
                   </div>
                 </div>
               </div>
             </div>

             {error && (
               <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                 <div className="flex items-center gap-2 text-red-800">
                   <AlertTriangle className="w-5 h-5" />
                   <span className="font-medium">Analysis Error</span>
                 </div>
                 <p className="text-red-700 text-sm mt-1">{error}</p>
               </div>
             )}
           </div>
         </div>

         {/* Right Column - Results */}
         <div className="w-1/2 p-6 overflow-y-auto">
           
           {/* Step 1 Loading State */}
           {isAnalyzing && (
             <div className="text-center py-12">
               <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 Analyzing Communication
               </h3>
               <p className="text-gray-600">
                 Detecting scam patterns and social engineering tactics...
               </p>
             </div>
           )}

           {/* Step 2 Loading State */}
           {isResearching && (
             <div className="mb-6 border border-blue-100 bg-blue-50 rounded-lg p-4">
               <div className="flex items-center gap-3 mb-2">
                 <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                 <h3 className="font-medium text-blue-900">Running Deep Research</h3>
               </div>
               <p className="text-blue-800 text-sm">{researchStatus}</p>
               <div className="mt-3 text-xs text-blue-700">
                 • Verifying business information
                 • Checking contact legitimacy  
                 • Searching scam databases
                 • Gathering threat intelligence
               </div>
             </div>
           )}

           {/* Step 1 Results */}
           {step1Analysis && (
             <div className="space-y-6">
               
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                     <CheckCircle className="w-6 h-6 text-green-600" />
                     Step 1: Analysis Complete
                   </h2>
                   <p className="text-sm text-gray-600">Initial scam detection completed</p>
                 </div>
                 <div className="flex gap-2">
                   {!step1Analysis.shouldAutoTrigger && !step2Research && !isResearching && (
                     <button 
                       onClick={() => runDeepResearch(step1Analysis)}
                       className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                     >
                       <Search className="w-4 h-4" />
                       Deep Research
                     </button>
                   )}
                   <button 
                     onClick={generateReport}
                     className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                   >
                     <FileText className="w-4 h-4" />
                     Report
                   </button>
                 </div>
               </div>

               {/* Scam Category */}
               <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                 <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                   <Flag className="w-4 h-4" />
                   Scam Category
                 </h3>
                 <p className="text-purple-800 font-medium">{step1Analysis.scamCategory}</p>
               </div>

               {/* What We Observed */}
               <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                 <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                   <Eye className="w-4 h-4" />
                   What We Observed
                 </h3>
                 <p className="text-blue-800 text-sm">{step1Analysis.whatWeObserved}</p>
               </div>

               {/* Red Flags */}
               {step1Analysis.redFlagsIdentified && step1Analysis.redFlagsIdentified.length > 0 && (
                 <div className="border border-red-100 bg-red-50 rounded-lg p-4">
                   <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4" />
                     Red Flags Identified
                   </h3>
                   <ul className="space-y-1 text-sm">
                     {step1Analysis.redFlagsIdentified.map((flag, index) => (
                       <li key={index} className="text-red-800 flex items-start gap-2">
                         <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                         {flag}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

               {/* Recommended Actions */}
               {step1Analysis.recommendedActions && step1Analysis.recommendedActions.length > 0 && (
                 <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                   <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                     <CheckSquare className="w-4 h-4" />
                     Recommended Actions
                   </h3>
                   <ol className="space-y-1 text-sm">
                     {step1Analysis.recommendedActions.map((action, index) => (
                       <li key={index} className="text-green-800 flex items-start gap-2">
                         <span className="w-5 h-5 bg-green-600 text-white rounded text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                           {index + 1}
                         </span>
                         {action}
                       </li>
                     ))}
                   </ol>
                 </div>
               )}

               {/* Where to Report */}
               {step1Analysis.whereToReportOrVerify && step1Analysis.whereToReportOrVerify.length > 0 && (
                 <div className="border border-orange-100 bg-orange-50 rounded-lg p-4">
                   <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                     <ExternalLink className="w-4 h-4" />
                     Where to Report or Verify
                   </h3>
                   <ul className="space-y-1 text-sm">
                     {step1Analysis.whereToReportOrVerify.map((item, index) => (
                       <li key={index} className="text-orange-800 flex items-start gap-2">
                         <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                         {item}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>
           )}

           {/* Step 2 Results */}
           {step2Research && step2Research.researchConducted && (
             <div className="mt-8 space-y-6">
               
               <div className="border-t border-gray-200 pt-6">
                 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
                   <Search className="w-6 h-6 text-blue-600" />
                   Step 2: Deep Research Results
                 </h2>
                 <p className="text-sm text-gray-600">Comprehensive investigation completed</p>
               </div>

               {/* Investigation Summary */}
               {step2Research.investigationSummary && (
                 <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-4">
                   <h3 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                     <TrendingUp className="w-4 h-4" />
                     Investigation Summary
                   </h3>
                   <p className="text-indigo-800 text-sm">{step2Research.investigationSummary}</p>
                 </div>
               )}

               {/* Business Verification */}
               {step2Research.businessVerification && (
                 <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                   <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                     <Building className="w-4 h-4" />
                     Business Verification
                   </h3>
                   <div className="space-y-2 text-sm">
                     {step2Research.businessVerification.organizationsResearched && step2Research.businessVerification.organizationsResearched.length > 0 && (
                       <div>
                         <span className="font-medium text-blue-800">Organizations Researched:</span>
                         <div className="ml-2 text-blue-700">{step2Research.businessVerification.organizationsResearched.join(', ')}</div>
                       </div>
                     )}
                     
                     {step2Research.businessVerification.legitimacyStatus && (
                       <div>
                         <span className="font-medium text-blue-800">Legitimacy Status:</span>
                         <span className={`ml-2 px-2 py-1 rounded text-xs ${
                           step2Research.businessVerification.legitimacyStatus === 'verified' ? 'bg-green-100 text-green-800' :
                           step2Research.businessVerification.legitimacyStatus === 'suspicious' ? 'bg-red-100 text-red-800' :
                           'bg-gray-100 text-gray-800'
                         }`}>
                           {step2Research.businessVerification.legitimacyStatus}
                         </span>
                       </div>
                     )}
                     
                     {step2Research.businessVerification.officialContacts && step2Research.businessVerification.officialContacts.length > 0 && (
                       <div>
                         <span className="font-medium text-blue-800">Official Contacts:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.businessVerification.officialContacts.map((contact, index) => (
                             <li key={index} className="text-blue-700 text-xs">• {contact}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                     
                     {step2Research.businessVerification.fraudAlerts && step2Research.businessVerification.fraudAlerts.length > 0 && (
                       <div>
                         <span className="font-medium text-blue-800">Fraud Alerts:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.businessVerification.fraudAlerts.map((alert, index) => (
                             <li key={index} className="text-blue-700 text-xs">• {alert}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Contact Analysis */}
               {step2Research.contactAnalysis && (
                 <div className="border border-red-100 bg-red-50 rounded-lg p-4">
                   <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4" />
                     Contact Analysis
                   </h3>
                   <div className="space-y-2 text-sm">
                     {step2Research.contactAnalysis.contactsAnalyzed && step2Research.contactAnalysis.contactsAnalyzed.length > 0 && (
                       <div>
                         <span className="font-medium text-red-800">Contacts Analyzed:</span>
                         <div className="ml-2 text-red-700">{step2Research.contactAnalysis.contactsAnalyzed.join(', ')}</div>
                       </div>
                     )}
                     
                     {step2Research.contactAnalysis.riskAssessment && step2Research.contactAnalysis.riskAssessment.length > 0 && (
                       <div>
                         <span className="font-medium text-red-800">Risk Assessment:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.contactAnalysis.riskAssessment.map((risk, index) => (
                             <li key={index} className="text-red-700 text-xs">• {risk}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                     
                     {step2Research.contactAnalysis.comparisonFindings && step2Research.contactAnalysis.comparisonFindings.length > 0 && (
                       <div>
                         <span className="font-medium text-red-800">Comparison Findings:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.contactAnalysis.comparisonFindings.map((finding, index) => (
                             <li key={index} className="text-red-700 text-xs">• {finding}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Threat Intelligence */}
               {step2Research.threatIntelligence && (
                 <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                   <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                     <Flag className="w-4 h-4" />
                     Threat Intelligence
                   </h3>
                   <div className="space-y-2 text-sm">
                     {step2Research.threatIntelligence.currentTrends && step2Research.threatIntelligence.currentTrends.length > 0 && (
                       <div>
                         <span className="font-medium text-purple-800">Current Trends:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.threatIntelligence.currentTrends.map((trend, index) => (
                             <li key={index} className="text-purple-700 text-xs">• {trend}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                     
                     {step2Research.threatIntelligence.officialWarnings && step2Research.threatIntelligence.officialWarnings.length > 0 && (
                       <div>
                         <span className="font-medium text-purple-800">Official Warnings:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.threatIntelligence.officialWarnings.map((warning, index) => (
                             <li key={index} className="text-purple-700 text-xs">• {warning}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                     
                     {step2Research.threatIntelligence.recentIncidents && step2Research.threatIntelligence.recentIncidents.length > 0 && (
                       <div>
                         <span className="font-medium text-purple-800">Recent Incidents:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.threatIntelligence.recentIncidents.map((incident, index) => (
                             <li key={index} className="text-purple-700 text-xs">• {incident}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Verification Guidance */}
               {step2Research.verificationGuidance && (
                 <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                   <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                     <CheckSquare className="w-4 h-4" />
                     Enhanced Verification Guidance
                   </h3>
                   <div className="space-y-2 text-sm">
                     {step2Research.verificationGuidance.howToVerify && step2Research.verificationGuidance.howToVerify.length > 0 && (
                       <div>
                         <span className="font-medium text-green-800">How to Verify:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.verificationGuidance.howToVerify.map((step, index) => (
                             <li key={index} className="text-green-700 text-xs">• {step}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                     
                     {step2Research.verificationGuidance.officialChannels && step2Research.verificationGuidance.officialChannels.length > 0 && (
                       <div>
                         <span className="font-medium text-green-800">Official Channels:</span>
                         <ul className="ml-4 mt-1">
                           {step2Research.verificationGuidance.officialChannels.map((channel, index) => (
                             <li key={index} className="text-green-700 text-xs">• {channel}</li>
                           ))}
                         </ul>
                       </div>
                     )}
                   </div>
                 </div>
               )}

               {/* Raw Research Data Display */}
               {(step2Research.detailedFindings || step2Research.rawResults) && (
                 <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                   <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                     <FileText className="w-4 h-4" />
                     Detailed Research Findings
                   </h3>
                   <div className="bg-white border border-gray-200 rounded p-3 max-h-96 overflow-y-auto">
                     <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                       {step2Research.detailedFindings || step2Research.rawResults}
                     </pre>
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Footer Info Cards */}
           {step1Analysis && (
             <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                 <h3 className="font-medium text-blue-900 mb-2">🧠 Trust Your Instincts</h3>
                 <p className="text-sm text-blue-800">
                   The fact that something felt "off" enough for you to check here shows your security awareness is working. 
                   <strong> That human intuition is your first line of defense.</strong>
                 </p>
               </div>
               <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                 <h3 className="font-medium text-gray-900 mb-2">🔒 Privacy & Data Protection</h3>
                 <p className="text-sm text-gray-700">
                   Neutral analysis with transparent processing. No data stored permanently.
                 </p>
               </div>
             </div>
           )}
         </div>
       </div>
     )}

     {/* Report Modal */}
     {showReport && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
           <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
             <h3 className="text-lg font-medium">Ask Allerna Comprehensive Analysis Report</h3>
             <button 
               onClick={() => setShowReport(false)} 
               className="text-white hover:text-gray-200 text-xl font-medium"
             >
               ×
             </button>
           </div>
           <div className="p-6">
             <div className="mb-4 flex gap-2">
               <button 
                 onClick={copyReport}
                 className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 transition-all duration-200"
               >
                 <Copy className="w-4 h-4" />
                 Copy to Clipboard
               </button>
               <button 
                 onClick={() => setShowReport(false)}
                 className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-all duration-200"
               >
                 Close
               </button>
             </div>
             <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
               <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{reportText}</pre>
             </div>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default AskAllerna;