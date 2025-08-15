import React, { useState } from 'react';
import { AlertTriangle, Send, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
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
      setAnalysis(data);
      
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis({
        threatLevel: "ERROR",
        incidentType: "Analysis Failed",
        riskScore: 0,
        immediateAction: "Try again or contact support",
        redFlags: ["System temporarily unavailable"],
        researchFindings: ["System error occurred"],
        explanation: `Error: ${error.message}. Please try again or contact support if the problem persists.`,
        nextSteps: [
          "Report this incident to your IT security team or designated security personnel immediately",
          "Check your internet connection",
          "Try submitting again", 
          "Contact support if issues continue"
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatColor = (level) => {
    const colors = {
      'CRITICAL': 'text-red-600 bg-red-100',
      'HIGH': 'text-orange-600 bg-orange-100', 
      'MEDIUM': 'text-yellow-600 bg-yellow-100',
      'LOW': 'text-blue-600 bg-blue-100',
      'SAFE': 'text-green-600 bg-green-100',
      'ERROR': 'text-gray-600 bg-gray-100',
      'NEEDS_MORE_INFO': 'text-blue-600 bg-blue-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  const getThreatIcon = (level) => {
    if (level === 'CRITICAL' || level === 'HIGH') return <XCircle className="w-5 h-5" />;
    if (level === 'MEDIUM') return <AlertTriangle className="w-5 h-5" />;
    if (level === 'LOW') return <Clock className="w-5 h-5" />;
    if (level === 'SAFE') return <CheckCircle className="w-5 h-5" />;
    if (level === 'NEEDS_MORE_INFO') return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const clearAnalysis = () => {
    setInput('');
    setAnalysis(null);
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

    const report = `=== ASK ALLERNA SECURITY ANALYSIS REPORT ===

INCIDENT SUMMARY:
${input.length > 200 ? input.substring(0, 200) + '...' : input}

THREAT ASSESSMENT:
- Threat Level: ${analysis.threatLevel}
- Risk Score: ${analysis.riskScore}/100
- Classification: ${analysis.incidentType}

IMMEDIATE ACTION REQUIRED:
${analysis.immediateAction}

KEY FINDINGS:
${analysis.redFlags.map(flag => `• ${flag}`).join('\n')}

RESEARCH FINDINGS:
${analysis.researchFindings ? analysis.researchFindings.map(finding => `• ${finding}`).join('\n') : '• No specific research findings available'}

DETAILED ANALYSIS:
${analysis.explanation}

RECOMMENDED NEXT STEPS:
${analysis.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

REPORT DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Platform: Ask Allerna Security Analysis Platform

IMPORTANT DISCLAIMER:
This analysis is for informational purposes only. Always verify through 
official channels and follow your organization's security protocols.

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
          <p className="text-gray-600">Social Engineering Detection Platform</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste suspicious content or describe the incident:
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Copy and paste suspicious emails, describe phone calls, text messages, or any other potential social engineering attempts. Remember to redact sensitive information as noted below.

Example: I received an email from 'support@[BANK-REDACTED].com' saying my account will be suspended unless I click a link and verify my login within 24 hours. The sender claimed to be from [BANK-REDACTED] security team and said I need to update my information immediately or lose access to my account..."
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
                  Ask Allerna to Analyze
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Ask Allerna to Analyze
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Security Analysis Results</h2>
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

          {/* Special UI for insufficient information */}
          {analysis.threatLevel === 'NEEDS_MORE_INFO' ? (
            <div className="space-y-6">
              {/* Friendly header */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-blue-800 mb-2">We need more details to help you</h3>
                <p className="text-blue-700 text-lg">
                  To provide an accurate security analysis, please share more information about the suspicious communication.
                </p>
              </div>

              {/* What to include section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                  <span>💡</span> Please include these details:
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">📧</span>
                      <div>
                        <div className="font-medium text-blue-800">Sender Information</div>
                        <div className="text-blue-600 text-sm">Email address, phone number, or claimed organization</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">💬</span>
                      <div>
                        <div className="font-medium text-blue-800">Complete Message</div>
                        <div className="text-blue-600 text-sm">Full email text, call transcript, or message content</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">🔗</span>
                      <div>
                        <div className="font-medium text-blue-800">Links & Attachments</div>
                        <div className="text-blue-600 text-sm">Any URLs, files, or downloads mentioned</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">🚨</span>
                      <div>
                        <div className="font-medium text-blue-800">What Seemed Suspicious</div>
                        <div className="text-blue-600 text-sm">What specifically raised your concern</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">⏰</span>
                      <div>
                        <div className="font-medium text-blue-800">Context & Timing</div>
                        <div className="text-blue-600 text-sm">When/how you received it, was it unsolicited</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600 font-bold">🎯</span>
                      <div>
                        <div className="font-medium text-blue-800">Requests Made</div>
                        <div className="text-blue-600 text-sm">Any requests for passwords, info, or actions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example section */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span>✅</span> Good example:
                </h4>
                <div className="bg-white border border-green-300 rounded-lg p-4 text-sm text-gray-700">
                  <span className="font-mono">
                    "I received an email from 'security@chase-verify.net' claiming to be Chase Bank. 
                    The subject was 'URGENT: Account Suspended' and it said I need to click a link 
                    to verify my account within 24 hours or it will be closed. The link was 
                    https://chase-security-update.com/verify. I found it suspicious because 
                    I didn't recognize the domain and the email felt very urgent and threatening."
                  </span>
                </div>
              </div>

              {/* Action button */}
              <div className="text-center">
                <button
                  onClick={clearAnalysis}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                >
                  <span>🔄</span>
                  Try Again with More Details
                </button>
              </div>
            </div>
          ) : (
            /* Regular analysis results */
            <div>
              <div className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${getThreatColor(analysis.threatLevel)}`}>
                {getThreatIcon(analysis.threatLevel)}
                <div>
                  <div className="font-bold text-xl">Threat Level: {analysis.threatLevel}</div>
                  <div className="text-sm opacity-90">Risk Score: {analysis.riskScore}/100</div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="font-bold text-yellow-800 mb-2">⚠️ Allerna Security Assessment:</div>
                <div className="text-yellow-700 text-lg">{analysis.immediateAction}</div>
                <div className="text-sm text-yellow-600 mt-2">
                  <strong>Important:</strong> This assessment is for informational purposes only. 
                  Always verify through your organization's official channels and follow company policies.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">Incident Classification</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium">{analysis.incidentType}</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-3">🚩 Warning Signs Detected</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.redFlags.map((flag, index) => (
                        <li key={index} className="text-sm">{flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {analysis.researchFindings && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-bold text-lg mb-3">🔍 Research Findings</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.researchFindings.map((finding, index) => (
                          <li key={index} className="text-sm">{finding}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">📋 Detailed Security Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{analysis.explanation}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-blue-800">🛡️ Allerna Recommendations</h3>
                <div className="text-sm text-blue-700 mb-3">
                  <strong>Note:</strong> These are general recommendations based on common security practices. 
                  Always follow your organization's specific policies and procedures.
                </div>
                <ol className="list-decimal list-inside space-y-2">
                  {analysis.nextSteps.map((step, index) => (
                    <li key={index} className="text-blue-800">{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                📄 Security Analysis Report
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
                <p>💡 <strong>Tip:</strong> Click "Copy to Clipboard" then paste this report into your IT ticketing system, email, or documentation.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Your Instincts Section - Moved to bottom */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">🧠 Trust Your Instincts</h3>
        <p className="text-sm text-blue-700">
          Social engineering is a complex problem that uses sophisticated techniques and psychological manipulation 
          that are not always easy to detect. The fact that you are asking this question suggests that your intuition 
          is telling you something is off. <strong>That human reaction is critical in social engineering defense.</strong> 
          Your instincts are often the first line of defense against these attacks.
        </p>
      </div>

      {/* Privacy & Data Protection Notice - Moved to bottom */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-800 mb-2">🔒 Privacy & Data Protection Notice</h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>Important:</strong> This tool processes your content securely on our servers to provide analysis. 
            No data is stored permanently, and all analysis is performed in real-time.
          </p>
          <p>
            <strong>For maximum privacy:</strong> Remove or replace sensitive information before analysis:
          </p>
          <ul className="list-disc list-inside ml-4 text-xs space-y-1">
            <li>Email addresses → "user@[REDACTED].com"</li>
            <li>Phone numbers → "[PHONE-REDACTED]"</li>
            <li>Names → "[NAME-REDACTED]"</li>
            <li>Passwords/codes → "[CODE-REDACTED]"</li>
            <li>Company names → "[COMPANY-REDACTED]"</li>
            <li>Account numbers → "[ACCOUNT-REDACTED]"</li>
          </ul>
          <p className="text-xs">
            <strong>The analysis will remain effective even with redacted information.</strong> 
            Focus on preserving the suspicious language patterns and structure.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-6">
        <h3 className="font-bold text-gray-800 mb-3">⚠️ Important Legal Disclaimer</h3>
        <div className="text-sm text-gray-700 space-y-3">
          <p>
            <strong>This software is not intended to provide legal advice, professional security counsel, or definitive security assessments.</strong> 
            This tool is designed to provide general information based solely on the factors you have entered and common cybersecurity patterns. 
            It is not intended to prescribe specific actions that you must or should take.
          </p>
          <p>
            <strong>Always refer to your organization's policies, procedures, and qualified personnel when taking any action regarding potential security incidents.</strong> 
            This analysis should supplement, not replace, your company's established security protocols, professional judgment, and expert consultation.
          </p>
          <p>
            The information provided by this tool is for educational and informational purposes only. Users are solely responsible for 
            evaluating the relevance and accuracy of any information provided and for any decisions or actions taken based on such information. 
            We make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, 
            or suitability of the information provided.
          </p>
          <p>
            <strong>For actual security incidents or concerns, always follow your organization's official incident reporting procedures 
            and contact appropriate authorities as required by your company's policies and applicable laws.</strong>
          </p>
          <p className="text-xs text-gray-600 border-t border-gray-300 pt-2 mt-3">
            By using this tool, you acknowledge that you have read, understood, and agree to be bound by this disclaimer. 
            You further acknowledge that any reliance upon the information provided is at your own risk.
          </p>
        </div>
      </div>

      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-bold text-red-800 mb-2">🔐 Privacy & Data Processing Disclosure</h3>
        <div className="text-sm text-red-700 space-y-2">
          <p>
            <strong>Secure Processing:</strong> Content submitted through this tool is processed securely on our servers 
            for analysis purposes only. No data is permanently stored or logged.
          </p>
          <p>
            <strong>Data Retention:</strong> Analysis content is processed in real-time and not retained after your session ends. 
            No personal information or analysis results are stored permanently.
          </p>
          <p>
            <strong>Recommendation:</strong> Still avoid submitting highly confidential or sensitive personal information. 
            When possible, redact specific details while preserving suspicious patterns for analysis.
          </p>
          <p>
            <strong>Session Only:</strong> This application processes data only during your active session and does not 
            create user accounts or permanent records.
          </p>
          <p className="text-xs text-red-600 font-medium">
            By using this tool, you consent to the secure processing of your submitted content for security analysis purposes.
          </p>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Ask Allerna helps identify potential social engineering attacks. Always verify suspicious communications through official channels.</p>
        <p className="mt-1 text-xs">Powered by Allerna Security Intelligence</p>
      </div>
    </div>
  );
};

export default AskAllerna;