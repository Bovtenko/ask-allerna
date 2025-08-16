import React, { useState } from 'react';
import { AlertTriangle, Send, Shield, CheckSquare, Eye, HelpCircle } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');

  const analyzeIncident = async () => {
    if (!input.trim()) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incident: input
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status: ${response.status}`);
      }

      const data = await response.json();
      setGuidance(data);
      
    } catch (error) {
      console.error("Analysis error:", error);
      setGuidance({
        whatWeObserved: "System error occurred while processing your request",
        redFlagsToConsider: ["System temporarily unavailable"],
        verificationSteps: [
          "Try submitting again",
          "If issues persist, contact support",
          "Continue to exercise caution with the suspicious communication"
        ],
        whyVerificationMatters: "Even when our analysis tools are unavailable, verification through official channels is always the safest approach.",
        organizationSpecificGuidance: "Contact the organization directly using official contact methods to verify any suspicious communications."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setInput('');
    setGuidance(null);
  };

  const generateReport = () => {
    const timestamp = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    const reportId = `ALR-${Date.now().toString().slice(-8)}`;

    const report = `=== ASK ALLERNA VERIFICATION GUIDANCE REPORT ===

COMMUNICATION SUMMARY:
${input.length > 200 ? input.substring(0, 200) + '...' : input}

WHAT WE OBSERVED:
${guidance.whatWeObserved}

RED FLAGS TO CONSIDER:
${guidance.redFlagsToConsider.map(flag => `• ${flag}`).join('\n')}

VERIFICATION STEPS:
${guidance.verificationSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

WHY VERIFICATION MATTERS:
${guidance.whyVerificationMatters}

ORGANIZATION-SPECIFIC GUIDANCE:
${guidance.organizationSpecificGuidance}

REPORT DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Platform: Ask Allerna Verification Guidance

IMPORTANT NOTE:
This guidance is educational and does not constitute a security assessment. 
Always verify suspicious communications through official channels.

--- END OF REPORT ---`;

    setReportText(report);
    setShowReport(true);
  };

  const copyToClipboard = async () => {
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
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes wave {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .animate-wave {
          animation: wave 6s linear infinite;
        }
        `
      }} />
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 via-blue-600 via-purple-600 to-blue-600 animate-wave" style={{backgroundSize: '200% 100%'}}></div>
              <Shield className="w-8 h-8 text-white relative z-10" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Ask Allerna</h1>
          <p className="text-gray-600">Communication Verification Guidance</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share the suspicious communication for verification guidance:
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Copy and paste suspicious emails, describe phone calls, text messages, or any other communications you'd like verification guidance for.

Example: I received an email from 'support@bank-alerts.com' saying my account will be suspended unless I click a link and verify my login within 24 hours. The sender claimed to be from my bank and said I need to update my information immediately or lose access to my account..."
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={analyzeIncident}
            disabled={isAnalyzing || !input.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 font-medium text-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 via-blue-600 via-purple-600 to-blue-600 animate-wave" style={{backgroundSize: '200% 100%'}}></div>
            <div className="relative z-10 flex items-center gap-2">
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Getting Verification Guidance
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5" />
                  Get Verification Guidance
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {guidance && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Verification Guidance</h2>
            <div className="flex gap-2">
              <button
                onClick={generateReport}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                📄 Generate Report
              </button>
              <button
                onClick={clearAnalysis}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                New Analysis
              </button>
            </div>
          </div>

          {/* Main Guidance Content */}
          <div className="space-y-6">
            
            {/* What We Observed */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                What We Observed
              </h3>
              <p className="text-blue-700 leading-relaxed">{guidance.whatWeObserved}</p>
            </div>

            {/* Red Flags to Consider */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Red Flags to Consider
              </h3>
              <ul className="space-y-2">
                {guidance.redFlagsToConsider.map((flag, index) => (
                  <li key={index} className="text-amber-700 flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* If You're Concerned - Main Action Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-3 flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                If You're Concerned, Here's What To Do
              </h3>
              <ol className="space-y-3">
                {guidance.verificationSteps.map((step, index) => (
                  <li key={index} className="text-green-700 flex items-start gap-3">
                    <span className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Organization-Specific Guidance */}
            {guidance.organizationSpecificGuidance && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-purple-800 mb-3">
                  🎯 Organization-Specific Guidance
                </h3>
                <p className="text-purple-700 leading-relaxed">{guidance.organizationSpecificGuidance}</p>
              </div>
            )}

            {/* Why Verification Matters */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-indigo-800 mb-3">
                🛡️ Why Verification Matters
              </h3>
              <p className="text-indigo-700 leading-relaxed">{guidance.whyVerificationMatters}</p>
            </div>

            {/* Trust Your Instincts - Enhanced */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-3">
                🧠 Trust Your Security Instincts
              </h3>
              <p className="text-blue-700 leading-relaxed">
                The fact that you're seeking verification guidance shows excellent security awareness. 
                When something feels off, it often is. Your instinct to verify is exactly the right approach, 
                regardless of how legitimate a communication might appear.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                📄 Verification Guidance Report
              </h3>
              <button
                onClick={() => setShowReport(false)}
                className="text-white hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
              
              <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">
                  {reportText}
                </pre>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>💡 <strong>Tip:</strong> Share this verification guidance with your IT team or use it to verify the communication through official channels.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Verification Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-800 mb-2">🔒 About Our Verification Guidance</h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>Our approach:</strong> We provide educational guidance to help you verify communications, 
            but we don't make judgments about whether something is "safe" or "dangerous."
          </p>
          <p>
            <strong>Why verification matters:</strong> Even legitimate-looking communications can be spoofed. 
            Independent verification through official channels is always the most secure approach.
          </p>
          <p>
            <strong>Privacy:</strong> Your communications are processed securely for analysis and are not stored permanently.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-6">
        <h3 className="font-bold text-gray-800 mb-3">⚠️ Important Disclaimer</h3>
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            <strong>This tool provides educational guidance only.</strong> We do not make determinations about 
            the safety or legitimacy of communications. All verification should be done through official channels.
          </p>
          <p>
            <strong>Always verify through official sources.</strong> Contact organizations directly using known 
            official phone numbers, websites, and contact methods rather than relying on information from 
            suspicious communications.
          </p>
          <p>
            <strong>When in doubt, verify.</strong> Your security instincts are valuable. If something feels 
            suspicious, verification is always the right approach.
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Ask Allerna provides verification guidance to help you make informed security decisions.</p>
        <p className="mt-1 text-xs">Powered by Allerna Security Education</p>
      </div>
    </div>
  );
};

export default AskAllerna;