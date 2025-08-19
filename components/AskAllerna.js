import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, Shield, Clock, CheckCircle, XCircle, Search, Zap, TrendingUp } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [basicAnalysis, setBasicAnalysis] = useState(null);
  const [advancedAnalysis, setAdvancedAnalysis] = useState(null);
  const [analysisStage, setAnalysisStage] = useState(''); // 'basic', 'advanced', 'complete'
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUpgradeOption, setShowUpgradeOption] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [error, setError] = useState(null);
  const [totalCost, setTotalCost] = useState(0);

  // Run basic analysis
  const runBasicAnalysis = async (incident) => {
    try {
      setAnalysisStage('basic');
      console.log('[UI] Starting basic analysis...');
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          incident, 
          analysisType: 'basic' 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBasicAnalysis(data);
        setTotalCost(0.05);
        setShowUpgradeOption(true);
        console.log('[UI] Basic analysis completed');
        return data;
      } else {
        throw new Error(`Basic analysis failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[UI] Basic analysis error:', error);
      setError(`Basic analysis error: ${error.message}`);
      return null;
    }
  };

  // Run advanced analysis
  const runAdvancedAnalysis = async (incident, basicResults) => {
    try {
      setAnalysisStage('advanced');
      console.log('[UI] Starting advanced analysis...');
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          incident, 
          analysisType: 'advanced',
          basicResults 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdvancedAnalysis(data);
        setTotalCost(0.27);
        console.log('[UI] Advanced analysis completed');
        return data;
      } else {
        throw new Error(`Advanced analysis failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[UI] Advanced analysis error:', error);
      setError(`Advanced analysis error: ${error.message}`);
      return null;
    }
  };

  // Initial analysis (basic only)
  const analyzeIncident = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setBasicAnalysis(null);
    setAdvancedAnalysis(null);
    setShowUpgradeOption(false);
    setTotalCost(0);
    
    await runBasicAnalysis(input);
    
    setIsAnalyzing(false);
    setAnalysisStage('complete');
  };

  // Upgrade to advanced analysis
  const upgradeToAdvanced = async () => {
    if (!basicAnalysis) return;

    setIsAnalyzing(true);
    setShowUpgradeOption(false);
    
    await runAdvancedAnalysis(input, basicAnalysis);
    
    setIsAnalyzing(false);
    setAnalysisStage('complete');
  };

  const clearAnalysis = () => {
    setInput('');
    setBasicAnalysis(null);
    setAdvancedAnalysis(null);
    setError(null);
    setShowUpgradeOption(false);
    setTotalCost(0);
    setAnalysisStage('');
  };

  // Generate comprehensive report
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
    const analysisLevel = advancedAnalysis ? 'Comprehensive' : 'Basic';

    const report = `=== ASK ALLERNA SECURITY EDUCATION REPORT ===

INCIDENT SUMMARY:
${input}

ANALYSIS LEVEL: ${analysisLevel} Analysis ($${totalCost.toFixed(2)})

=== BASIC SECURITY ANALYSIS ===

WHAT WE OBSERVED:
${basicAnalysis?.whatWeObserved || 'Analysis not available'}

RED FLAGS TO CONSIDER:
${basicAnalysis?.redFlagsToConsider?.map(flag => `• ${flag}`).join('\n') || 'No red flags identified'}

VERIFICATION STEPS:
${basicAnalysis?.verificationSteps?.map(step => `• ${step}`).join('\n') || 'Standard verification recommended'}

${advancedAnalysis ? `
=== ADVANCED VERIFICATION & THREAT INTELLIGENCE ===

BUSINESS VERIFICATION:
Organization Claimed: ${advancedAnalysis.businessVerification?.claimedOrganization || 'Not specified'}
${advancedAnalysis.businessVerification?.officialContacts?.length > 0 ? `
Official Contacts Found:
${advancedAnalysis.businessVerification.officialContacts.map(contact => `• ${contact}`).join('\n')}` : ''}
${advancedAnalysis.businessVerification?.comparisonFindings?.length > 0 ? `
Verification Findings:
${advancedAnalysis.businessVerification.comparisonFindings.map(finding => `• ${finding}`).join('\n')}` : ''}
${advancedAnalysis.businessVerification?.officialAlerts?.length > 0 ? `
Official Alerts:
${advancedAnalysis.businessVerification.officialAlerts.map(alert => `• ${alert}`).join('\n')}` : ''}

THREAT INTELLIGENCE:
${advancedAnalysis.threatIntelligence?.knownScamReports?.length > 0 ? `
Known Scam Reports:
${advancedAnalysis.threatIntelligence.knownScamReports.map(report => `• ${report}`).join('\n')}` : ''}
${advancedAnalysis.threatIntelligence?.similarIncidents?.length > 0 ? `
Similar Incidents:
${advancedAnalysis.threatIntelligence.similarIncidents.map(incident => `• ${incident}`).join('\n')}` : ''}
${advancedAnalysis.threatIntelligence?.securityAdvisories?.length > 0 ? `
Security Advisories:
${advancedAnalysis.threatIntelligence.securityAdvisories.map(advisory => `• ${advisory}`).join('\n')}` : ''}

CURRENT THREAT LANDSCAPE:
${advancedAnalysis.currentThreatLandscape?.industryTrends?.length > 0 ? `
Industry Trends:
${advancedAnalysis.currentThreatLandscape.industryTrends.map(trend => `• ${trend}`).join('\n')}` : ''}
${advancedAnalysis.currentThreatLandscape?.recentCampaigns?.length > 0 ? `
Recent Campaigns:
${advancedAnalysis.currentThreatLandscape.recentCampaigns.map(campaign => `• ${campaign}`).join('\n')}` : ''}
${advancedAnalysis.currentThreatLandscape?.officialWarnings?.length > 0 ? `
Official Warnings:
${advancedAnalysis.currentThreatLandscape.officialWarnings.map(warning => `• ${warning}`).join('\n')}` : ''}
` : ''}

WHY VERIFICATION MATTERS:
${basicAnalysis?.whyVerificationMatters || 'Verification is essential for security'}

ORGANIZATION-SPECIFIC GUIDANCE:
${basicAnalysis?.organizationSpecificGuidance || 'Follow standard security protocols'}

ANALYSIS DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Analysis Type: ${analysisLevel}
- Total Cost: $${totalCost.toFixed(2)}
- Platform: Ask Allerna Security Education Platform
- Basic Engine: Claude 3.5 Haiku (Fast Pattern Recognition)
${advancedAnalysis ? '- Advanced Engine: Claude Sonnet 4 (Comprehensive Intelligence)' : ''}

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
          <p className="text-gray-600">Two-Tier Security Education Platform</p>
          <div className="mt-2 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <Zap className="w-4 h-4" />
              <span>Quick Check ($0.05)</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <TrendingUp className="w-4 h-4" />
              <span>Detailed Analysis (+$0.22)</span>
            </div>
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
              placeholder="Describe the suspicious email, phone call, text message, or other communication in detail..."
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
            </div>
          )}

          <button
            onClick={analyzeIncident}
            disabled={isAnalyzing || !input.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-lg hover:opacity-90 disabled:bg-gray-400 font-medium text-lg transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 via-green-600 via-emerald-600 to-green-600 animate-wave" style={{backgroundSize: '200% 100%'}}></div>
            <div className="relative z-10 flex items-center gap-2">
              {isAnalyzing && analysisStage === 'basic' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Quick Security Check ($0.05)...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Start Quick Security Check ($0.05)
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Basic Analysis Results */}
      {basicAnalysis && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Zap className="w-6 h-6 text-green-600" />
                Quick Security Analysis
              </h2>
              <p className="text-sm text-gray-600">Cost: $0.05 • Analysis Time: ~8 seconds</p>
            </div>
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

          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2">👁️ What We Observed</h3>
              <p className="text-blue-700">{basicAnalysis.whatWeObserved}</p>
            </div>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg">
              <h3 className="font-bold text-amber-800 mb-3">🚩 Red Flags to Consider</h3>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                {basicAnalysis.redFlagsToConsider?.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 mb-3">✅ Verification Steps</h3>
              <ul className="list-decimal list-inside space-y-1 text-green-700">
                {basicAnalysis.verificationSteps?.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-2">🎓 Why Verification Matters</h3>
              <p className="text-purple-700">{basicAnalysis.whyVerificationMatters}</p>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-lg">
              <h3 className="font-bold text-indigo-800 mb-2">🏢 Organization Guidance</h3>
              <p className="text-indigo-700">{basicAnalysis.organizationSpecificGuidance}</p>
            </div>
          </div>

          {/* Upgrade Option */}
          {showUpgradeOption && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Need Deeper Investigation?</h3>
                <p className="text-gray-600 mb-4">
                  Run detailed business verification and threat intelligence analysis
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={upgradeToAdvanced}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium flex items-center gap-2"
                  >
                    {isAnalyzing && analysisStage === 'advanced' ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Running Detailed Analysis...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Run Detailed Analysis (+$0.22)
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowUpgradeOption(false)}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                  >
                    No Thanks
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Includes: Business verification • Threat intelligence • Current scam reports
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Analysis Results */}
      {advancedAnalysis && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Search className="w-6 h-6 text-blue-600" />
              Detailed Verification & Threat Intelligence
            </h2>
            <p className="text-sm text-gray-600">Additional Cost: $0.22 • Total: $0.27 • Analysis Time: ~25 seconds</p>
          </div>

          <div className="space-y-4">
            {/* Business Verification */}
            <div className="bg-cyan-50 border-l-4 border-cyan-400 p-4 rounded-lg">
              <h3 className="font-bold text-cyan-800 mb-3">🏢 Business Verification</h3>
              <div className="space-y-3 text-cyan-700">
                <div>
                  <strong>Claimed Organization:</strong> {advancedAnalysis.businessVerification?.claimedOrganization}
                </div>
                
                {advancedAnalysis.businessVerification?.officialContacts?.length > 0 && (
                  <div>
                    <strong>Official Contacts:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.businessVerification.officialContacts.map((contact, index) => (
                        <li key={index}>{contact}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.businessVerification?.comparisonFindings?.length > 0 && (
                  <div>
                    <strong>Verification Findings:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.businessVerification.comparisonFindings.map((finding, index) => (
                        <li key={index}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.businessVerification?.officialAlerts?.length > 0 && (
                  <div>
                    <strong>Official Alerts:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.businessVerification.officialAlerts.map((alert, index) => (
                        <li key={index}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Threat Intelligence */}
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <h3 className="font-bold text-red-800 mb-3">🚨 Threat Intelligence</h3>
              <div className="space-y-3 text-red-700">
                {advancedAnalysis.threatIntelligence?.knownScamReports?.length > 0 && (
                  <div>
                    <strong>Known Scam Reports:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.threatIntelligence.knownScamReports.map((report, index) => (
                        <li key={index}>{report}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.threatIntelligence?.similarIncidents?.length > 0 && (
                  <div>
                    <strong>Similar Incidents:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.threatIntelligence.similarIncidents.map((incident, index) => (
                        <li key={index}>{incident}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.threatIntelligence?.securityAdvisories?.length > 0 && (
                  <div>
                    <strong>Security Advisories:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.threatIntelligence.securityAdvisories.map((advisory, index) => (
                        <li key={index}>{advisory}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Current Threat Landscape */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg">
              <h3 className="font-bold text-orange-800 mb-3">📊 Current Threat Landscape</h3>
              <div className="space-y-3 text-orange-700">
                {advancedAnalysis.currentThreatLandscape?.industryTrends?.length > 0 && (
                  <div>
                    <strong>Industry Trends:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.currentThreatLandscape.industryTrends.map((trend, index) => (
                        <li key={index}>{trend}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.currentThreatLandscape?.recentCampaigns?.length > 0 && (
                  <div>
                    <strong>Recent Campaigns:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.currentThreatLandscape.recentCampaigns.map((campaign, index) => (
                        <li key={index}>{campaign}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {advancedAnalysis.currentThreatLandscape?.officialWarnings?.length > 0 && (
                  <div>
                    <strong>Official Warnings:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {advancedAnalysis.currentThreatLandscape.officialWarnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
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

      {/* Cost Summary */}
      {(basicAnalysis || advancedAnalysis) && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Analysis Cost:</span>
                <span className="ml-2 text-green-600 font-bold">${totalCost.toFixed(2)}</span>
              </div>
              {advancedAnalysis && (
                <div className="text-xs text-gray-500">
                  Basic ($0.05) + Advanced (+$0.22) = $0.27
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {advancedAnalysis ? 'Comprehensive Analysis' : 'Quick Check'}
            </div>
          </div>
        </div>
      )}

      {/* Trust Your Instincts Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-2">🧠 Trust Your Instincts</h3>
        <p className="text-sm text-blue-700">
          The fact that something felt "off" enough for you to check here shows your security awareness is working. 
          <strong> That human intuition is your first line of defense.</strong> Always trust your instincts and verify through official channels.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-bold text-amber-800 mb-2">🔒 Privacy & Data Protection</h3>
        <div className="text-sm text-amber-700 space-y-2">
          <p>
            <strong>Two-Tier Processing:</strong> Basic analysis uses fast pattern recognition. 
            Advanced analysis includes real-time threat intelligence. No data stored permanently.
          </p>
          <p>
            <strong>Cost Transparency:</strong> You see exactly what you pay for at each level. 
            Quick check ($0.05) or comprehensive investigation ($0.27).
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>🔒 Ask Allerna • Two-Tier Security Education Platform</p>
        <p className="mt-1 text-xs">Basic: Claude 3.5 Haiku • Advanced: Claude Sonnet 4 • Cost-Optimized Intelligence</p>
      </div>
    </div>
  );
};

export default AskAllerna;