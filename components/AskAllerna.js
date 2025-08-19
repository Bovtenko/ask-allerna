import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, Shield, Clock, CheckCircle, XCircle, Search } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [error, setError] = useState(null);
  
  // NEW: Streaming analysis states
  const [analysisStage, setAnalysisStage] = useState('');
  const [streamingData, setStreamingData] = useState({
    quick: null,
    business: null,
    threats: null
  });
  const [completedStages, setCompletedStages] = useState([]);

  // NEW: Progressive section reveal effect (now based on data arrival)
  useEffect(() => {
    const newCompleted = [];
    if (streamingData.quick) newCompleted.push('quick');
    if (streamingData.business) newCompleted.push('business');
    if (streamingData.threats) newCompleted.push('threats');
    setCompletedStages(newCompleted);
  }, [streamingData]);

  // NEW: Streaming analysis function
  const runStreamingAnalysis = async (incident) => {
    try {
      // Stage 1: Quick Analysis (5-8 seconds)
      setAnalysisStage('Performing initial security assessment...');
      const quickResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, analysisType: 'quick' })
      });
      
      if (quickResponse.ok) {
        const quickData = await quickResponse.json();
        setStreamingData(prev => ({ ...prev, quick: quickData }));
        console.log('[UI] Quick analysis completed');
      }

      // Stage 2: Business Verification (15-20 seconds)
      setAnalysisStage('Verifying business contacts and official information...');
      const businessResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, analysisType: 'business' })
      });
      
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setStreamingData(prev => ({ ...prev, business: businessData }));
        console.log('[UI] Business verification completed');
      }

      // Stage 3: Threat Intelligence (15-20 seconds)
      setAnalysisStage('Researching threat intelligence and current threats...');
      const threatsResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, analysisType: 'threats' })
      });
      
      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        setStreamingData(prev => ({ ...prev, threats: threatsData }));
        console.log('[UI] Threat intelligence completed');
      }

      // Combine all data for final analysis object
      const combinedAnalysis = {
        whatWeObserved: streamingData.quick?.whatWeObserved || "Analysis completed",
        redFlagsToConsider: streamingData.quick?.redFlagsToConsider || [],
        verificationSteps: streamingData.quick?.verificationSteps || [],
        whyVerificationMatters: streamingData.quick?.whyVerificationMatters || "Verification is important for security",
        organizationSpecificGuidance: streamingData.quick?.organizationSpecificGuidance || "Follow standard security protocols",
        businessVerification: businessData?.businessVerification || null,
        threatIntelligence: threatsData?.threatIntelligence || null,
        currentThreatLandscape: threatsData?.currentThreatLandscape || null
      };

      setAnalysis(combinedAnalysis);

    } catch (error) {
      console.error('[UI] Streaming analysis error:', error);
      setError(error.message);
      
      // Provide fallback analysis
      setAnalysis({
        whatWeObserved: "System error occurred during analysis",
        redFlagsToConsider: ["Automated analysis temporarily unavailable"],
        verificationSteps: ["Contact your IT security team immediately"],
        whyVerificationMatters: "When automated tools are unavailable, manual verification becomes critical.",
        organizationSpecificGuidance: `System error: ${error.message}. Contact technical support if this persists.`
      });
    }
  };

  const analyzeIncident = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setStreamingData({ quick: null, business: null, threats: null });
    setCompletedStages([]);
    setAnalysis(null);
    
    await runStreamingAnalysis(input);
    
    setIsAnalyzing(false);
    setAnalysisStage('');
  };

  const clearAnalysis = () => {
    setInput('');
    setAnalysis(null);
    setError(null);
    setStreamingData({ quick: null, business: null, threats: null });
    setCompletedStages([]);
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

    const report = `=== ASK ALLERNA SECURITY EDUCATION REPORT ===

INCIDENT SUMMARY:
${input.length > 200 ? input.substring(0, 200) + '...' : input}

WHAT WE OBSERVED:
${analysis.whatWeObserved}

RED FLAGS TO CONSIDER:
${analysis.redFlagsToConsider.map(flag => `• ${flag}`).join('\n')}

VERIFICATION STEPS:
${analysis.verificationSteps.map(step => `• ${step}`).join('\n')}

${analysis.businessVerification ? `
BUSINESS VERIFICATION:
Organization Claimed: ${analysis.businessVerification.claimedOrganization}
${analysis.businessVerification.officialContacts ? `
Official Contacts:
${analysis.businessVerification.officialContacts.map(contact => `• ${contact}`).join('\n')}` : ''}
${analysis.businessVerification.comparisonFindings ? `
Comparison Findings:
${analysis.businessVerification.comparisonFindings.map(finding => `• ${finding}`).join('\n')}` : ''}
${analysis.businessVerification.officialAlerts ? `
Official Alerts:
${analysis.businessVerification.officialAlerts.map(alert => `• ${alert}`).join('\n')}` : ''}
` : ''}

${analysis.threatIntelligence ? `
THREAT INTELLIGENCE:
${analysis.threatIntelligence.knownScamReports ? `
Known Scam Reports:
${analysis.threatIntelligence.knownScamReports.map(report => `• ${report}`).join('\n')}` : ''}
${analysis.threatIntelligence.similarIncidents ? `
Similar Incidents:
${analysis.threatIntelligence.similarIncidents.map(incident => `• ${incident}`).join('\n')}` : ''}
${analysis.threatIntelligence.securityAdvisories ? `
Security Advisories:
${analysis.threatIntelligence.securityAdvisories.map(advisory => `• ${advisory}`).join('\n')}` : ''}
` : ''}

${analysis.currentThreatLandscape ? `
CURRENT THREAT LANDSCAPE:
${analysis.currentThreatLandscape.industryTrends ? `
Industry Trends:
${analysis.currentThreatLandscape.industryTrends.map(trend => `• ${trend}`).join('\n')}` : ''}
${analysis.currentThreatLandscape.recentCampaigns ? `
Recent Campaigns:
${analysis.currentThreatLandscape.recentCampaigns.map(campaign => `• ${campaign}`).join('\n')}` : ''}
${analysis.currentThreatLandscape.officialWarnings ? `
Official Warnings:
${analysis.currentThreatLandscape.officialWarnings.map(warning => `• ${warning}`).join('\n')}` : ''}
` : ''}

WHY VERIFICATION MATTERS:
${analysis.whyVerificationMatters}

ORGANIZATION-SPECIFIC GUIDANCE:
${analysis.organizationSpecificGuidance}

REPORT DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Platform: Ask Allerna Security Education Platform
- Analysis Engine: Claude Sonnet 4 with Real-time Streaming Intelligence

IMPORTANT DISCLAIMER:
This analysis is for educational purposes only. Always verify through 
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
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-wave {
          animation: wave 6s linear infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse-slow {
          animation: pulse 2s infinite;
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
          <p className="text-gray-600">Security Education & Red Flag Detection Platform</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-green-600">
            <Search className="w-4 h-4" />
            <span>Powered by Real-time Streaming Intelligence</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the suspicious communication you received:
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the suspicious email, phone call, text message, or other communication in detail. Include:

• Who contacted you (email address, phone number, claimed organization)
• Complete message content or conversation details  
• Any links, attachments, or requests made
• What specifically seemed suspicious to you
• Context (unsolicited, timing, etc.)

Example: 'I received an email from support@amazom-security.com claiming my Prime account was compromised. The email said I need to click a link within 2 hours to verify my payment method or my account will be suspended. The sender address looked suspicious and I never signed up for Prime...'"
              className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Analysis Error</span>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <p className="text-red-600 text-xs mt-2">The system will still provide general security guidance below.</p>
            </div>
          )}

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
                  <div className="flex flex-col items-center">
                    <span>Streaming Real-time Analysis...</span>
                    {analysisStage && (
                      <span className="text-sm opacity-80 mt-1">{analysisStage}</span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze for Red Flags
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* NEW: Streaming Dashboard - Shows sections as data arrives */}
      {(completedStages.length > 0 || isAnalyzing) && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Security Education Analysis</h2>
            <div className="flex gap-2">
              {completedStages.length >= 3 && (
                <button
                  onClick={generateReport}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2"
                >
                  📄 Generate Report
                </button>
              )}
              <button
                onClick={clearAnalysis}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                New Analysis
              </button>
            </div>
          </div>

          {/* Quick Analysis Results - Show immediately when available */}
          {streamingData.quick && (
            <>
              <div className="mb-6 animate-fade-in">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    👁️ What We Observed
                  </h3>
                  <p className="text-blue-700">{streamingData.quick.whatWeObserved}</p>
                </div>
              </div>

              <div className="mb-6 animate-fade-in">
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
                  <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                    🚩 Red Flags to Consider
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    {streamingData.quick.redFlagsToConsider.map((flag, index) => (
                      <li key={index}>{flag}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-6 animate-fade-in">
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    ✅ Verification Steps
                  </h3>
                  <ul className="list-decimal list-inside space-y-1 text-green-700">
                    {streamingData.quick.verificationSteps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Business Verification - Show when available or loading */}
          {(streamingData.business || (isAnalyzing && completedStages.includes('quick'))) && (
            <div className="mb-6 animate-fade-in">
              <div className="bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded-lg">
                <h3 className="font-bold text-cyan-800 mb-3 flex items-center gap-2">
                  🏢 Business Verification
                  {!streamingData.business && isAnalyzing && (
                    <div className="animate-pulse-slow text-sm">⏳ Loading...</div>
                  )}
                </h3>
                {streamingData.business ? (
                  <div className="space-y-3 text-cyan-700">
                    <div>
                      <strong>Claimed Organization:</strong> {streamingData.business.businessVerification.claimedOrganization}
                    </div>
                    
                    {streamingData.business.businessVerification.officialContacts?.length > 0 && (
                      <div>
                        <strong>Official Contacts:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {streamingData.business.businessVerification.officialContacts.map((contact, index) => (
                            <li key={index}>{contact}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {streamingData.business.businessVerification.comparisonFindings?.length > 0 && (
                      <div>
                        <strong>Comparison Findings:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {streamingData.business.businessVerification.comparisonFindings.map((finding, index) => (
                            <li key={index}>{finding}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {streamingData.business.businessVerification.officialAlerts?.length > 0 && (
                      <div>
                        <strong>Official Alerts:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          {streamingData.business.businessVerification.officialAlerts.map((alert, index) => (
                            <li key={index}>{alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-cyan-600 animate-pulse-slow">
                    🔍 Verifying business contacts and searching for official warnings...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Threat Intelligence - Show when available or loading */}
          {(streamingData.threats || (isAnalyzing && completedStages.includes('business'))) && (
            <>
              <div className="mb-6 animate-fade-in">
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                  <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    🚨 Threat Intelligence
                    {!streamingData.threats && isAnalyzing && (
                      <div className="animate-pulse-slow text-sm">⏳ Loading...</div>
                    )}
                  </h3>
                  {streamingData.threats ? (
                    <div className="space-y-3 text-red-700">
                      {streamingData.threats.threatIntelligence?.knownScamReports?.length > 0 && (
                        <div>
                          <strong>Known Scam Reports:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.threatIntelligence.knownScamReports.map((report, index) => (
                              <li key={index}>{report}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {streamingData.threats.threatIntelligence?.similarIncidents?.length > 0 && (
                        <div>
                          <strong>Similar Incidents:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.threatIntelligence.similarIncidents.map((incident, index) => (
                              <li key={index}>{incident}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {streamingData.threats.threatIntelligence?.securityAdvisories?.length > 0 && (
                        <div>
                          <strong>Security Advisories:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.threatIntelligence.securityAdvisories.map((advisory, index) => (
                              <li key={index}>{advisory}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-600 animate-pulse-slow">
                      🔍 Searching threat databases and scam reports...
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6 animate-fade-in">
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
                  <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                    📊 Current Threat Landscape
                    {!streamingData.threats && isAnalyzing && (
                      <div className="animate-pulse-slow text-sm">⏳ Loading...</div>
                    )}
                  </h3>
                  {streamingData.threats ? (
                    <div className="space-y-3 text-orange-700">
                      {streamingData.threats.currentThreatLandscape?.industryTrends?.length > 0 && (
                        <div>
                          <strong>Industry Trends:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.currentThreatLandscape.industryTrends.map((trend, index) => (
                              <li key={index}>{trend}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {streamingData.threats.currentThreatLandscape?.recentCampaigns?.length > 0 && (
                        <div>
                          <strong>Recent Campaigns:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.currentThreatLandscape.recentCampaigns.map((campaign, index) => (
                              <li key={index}>{campaign}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {streamingData.threats.currentThreatLandscape?.officialWarnings?.length > 0 && (
                        <div>
                          <strong>Official Warnings:</strong>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {streamingData.threats.currentThreatLandscape.officialWarnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-orange-600 animate-pulse-slow">
                      🔍 Analyzing current threat trends and recent campaigns...
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Final sections - show only when quick analysis is complete */}
          {streamingData.quick && (
            <>
              <div className="mb-6 animate-fade-in">
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
                  <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    🏢 Organization-Specific Guidance
                  </h3>
                  <p className="text-purple-700">{streamingData.quick.organizationSpecificGuidance}</p>
                </div>
              </div>

              <div className="mb-6 animate-fade-in">
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-lg">
                  <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2">
                    🎓 Why Verification Matters
                  </h3>
                  <p className="text-indigo-700">{streamingData.quick.whyVerificationMatters}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                📄 Security Education Report
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

      {/* Trust Your Instincts Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">🧠 Trust Your Instincts</h3>
        <p className="text-sm text-blue-700">
          Social engineering attacks use sophisticated psychological manipulation that isn't always easy to detect. 
          The fact that something felt "off" enough for you to check here shows your security awareness is working. 
          <strong> That human intuition is your first line of defense.</strong> Always trust your instincts and verify through official channels.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-800 mb-2">🔒 Privacy & Data Protection</h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>Secure Processing:</strong> Your content is analyzed in real-time with current threat intelligence. 
            No data is stored permanently.
          </p>
          <p>
            <strong>For maximum privacy:</strong> Consider redacting sensitive information like actual email addresses, 
            phone numbers, or account details while preserving the suspicious patterns for analysis.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Ask Allerna helps you learn to identify social engineering patterns through real-time threat intelligence.</p>
        <p className="mt-1 text-xs">Enhanced with Claude Sonnet 4 • Real-time Streaming Research • Educational Focus</p>
      </div>
    </div>
  );
};

export default AskAllerna;