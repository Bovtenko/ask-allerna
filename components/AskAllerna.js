import React, { useState, useEffect } from 'react';
import { Shield, Send, Search, Clock, CheckCircle, AlertTriangle, RotateCcw, FileText, Eye, Flag, CheckSquare, Building, Users, TrendingUp, Copy } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [basicAnalysis, setBasicAnalysis] = useState(null);
  const [advancedAnalysis, setAdvancedAnalysis] = useState(null);
  const [analysisStage, setAnalysisStage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showUpgradeOption, setShowUpgradeOption] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [error, setError] = useState(null);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');

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

  // API Functions
  const runBasicAnalysis = async (incident) => {
    try {
      setAnalysisStage('basic');
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, analysisType: 'basic' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setBasicAnalysis(data);
        setShowUpgradeOption(true);
        return data;
      } else {
        throw new Error(`Basic analysis failed: ${response.status}`);
      }
    } catch (error) {
      setError(`Analysis error: ${error.message}`);
      return null;
    }
  };

  const runAdvancedAnalysis = async (incident, basicResults) => {
    try {
      setAnalysisStage('advanced');
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, analysisType: 'advanced', basicResults })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdvancedAnalysis(data);
        return data;
      } else {
        throw new Error(`Advanced analysis failed: ${response.status}`);
      }
    } catch (error) {
      setError(`Advanced analysis error: ${error.message}`);
      return null;
    }
  };

  // Main Functions
  const analyzeIncident = async () => {
    if (!input.trim()) return;
    setIsAnalysisMode(true);
    setHighlightedText(highlightSuspiciousText(input));
    setIsAnalyzing(true);
    setError(null);
    setBasicAnalysis(null);
    setAdvancedAnalysis(null);
    setShowUpgradeOption(false);
    
    await runBasicAnalysis(input);
    setIsAnalyzing(false);
    setAnalysisStage('complete');
  };

  const upgradeToAdvanced = async () => {
    if (!basicAnalysis) return;
    setIsAnalyzing(true);
    setShowUpgradeOption(false);
    setAnalysisStage('advanced');
    
    await runAdvancedAnalysis(input, basicAnalysis);
    setIsAnalyzing(false);
    setAnalysisStage('complete');
  };

  const newAnalysis = () => {
    setInput('');
    setBasicAnalysis(null);
    setAdvancedAnalysis(null);
    setError(null);
    setShowUpgradeOption(false);
    setAnalysisStage('');
    setHighlightedText('');
  };

  const exitAnalysis = () => {
    newAnalysis();
    setIsAnalysisMode(false);
  };

  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportId = `ALR-${Date.now().toString().slice(-8)}`;
    const analysisLevel = advancedAnalysis ? 'Professional Investigation Report' : 'Security Education Analysis';

    let investigationTargetsSection = '';
    if (basicAnalysis?.investigationTargets) {
      const targets = basicAnalysis.investigationTargets;
      investigationTargetsSection = `
=== INVESTIGATION TARGETS ===
Businesses to Verify: ${targets.businessesToVerify?.join(', ') || 'None'}
Contacts to Check: ${targets.contactsToCheck?.join(', ') || 'None'}
Suspicious Patterns: ${targets.suspiciousPatterns?.join(', ') || 'None'}
Recommended Searches: ${targets.searchQueries?.join(', ') || 'None'}`;
    }

    let advancedSection = '';
    if (advancedAnalysis) {
      advancedSection = `
=== PROFESSIONAL INVESTIGATION RESULTS ===

BUSINESS VERIFICATION:
Organization: ${advancedAnalysis.businessVerification?.claimedOrganization || 'Not specified'}
Official Contacts: ${advancedAnalysis.businessVerification?.officialContacts?.join(', ') || 'None found'}
Comparison Analysis: ${advancedAnalysis.businessVerification?.comparisonFindings?.join(', ') || 'None available'}
Official Alerts: ${advancedAnalysis.businessVerification?.officialAlerts?.join(', ') || 'None found'}

THREAT INTELLIGENCE:
Known Scam Reports: ${advancedAnalysis.threatIntelligence?.knownScamReports?.join(', ') || 'None found'}
Similar Incidents: ${advancedAnalysis.threatIntelligence?.similarIncidents?.join(', ') || 'None found'}
Security Advisories: ${advancedAnalysis.threatIntelligence?.securityAdvisories?.join(', ') || 'None found'}

CURRENT THREAT LANDSCAPE:
Industry Trends: ${advancedAnalysis.currentThreatLandscape?.industryTrends?.join(', ') || 'None available'}
Recent Campaigns: ${advancedAnalysis.currentThreatLandscape?.recentCampaigns?.join(', ') || 'None found'}
Official Warnings: ${advancedAnalysis.currentThreatLandscape?.officialWarnings?.join(', ') || 'None found'}`;
    }

    const report = `=== ASK ALLERNA SECURITY EDUCATION REPORT ===

INCIDENT SUMMARY:
${input}

ANALYSIS TYPE: ${analysisLevel}

=== SECURITY ANALYSIS ===

WHAT WE OBSERVED:
${basicAnalysis?.whatWeObserved || 'Analysis not available'}

RED FLAGS TO CONSIDER:
${basicAnalysis?.redFlagsToConsider?.map(flag => `• ${flag}`).join('\n') || 'No red flags identified'}

VERIFICATION STEPS:
${basicAnalysis?.verificationSteps?.map(step => `• ${step}`).join('\n') || 'Standard verification recommended'}

WHY VERIFICATION MATTERS:
${basicAnalysis?.whyVerificationMatters || 'Verification is essential for security'}

ORGANIZATION-SPECIFIC GUIDANCE:
${basicAnalysis?.organizationSpecificGuidance || 'Follow standard security protocols'}

${investigationTargetsSection}
${advancedSection}

REPORT DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Analysis Type: ${analysisLevel}
- Platform: Ask Allerna Security Education Platform

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

      {/* STEP 1: Landing Page */}
      {!isAnalysisMode && (
        <div className="max-w-2xl mx-auto px-6 py-16">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Ask Allerna</span>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">Ask Allerna</h1>
            <p className="text-xl text-gray-600 mb-12">Security Education Platform</p>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Get detailed analysis and verification guidance for suspicious communications
            </p>
          </div>

          {/* Input Section */}
          <div className="mb-12">
            <label className="block text-lg font-medium text-gray-900 mb-6">
              Describe the suspicious communication:
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the suspicious email, phone call, text message, or other communication in detail..."
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
              <span>Analyze Communication</span>
            </button>
          </div>

          {/* Info Cards */}
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
                Educational analysis with transparent processing. No data stored permanently.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Analysis Dashboard */}
      {isAnalysisMode && (
        <div className="h-screen flex">
          
          {/* Left Column - Input */}
          <div className="w-1/2 border-r border-gray-100 p-6 overflow-y-auto">
            
            {/* Header */}
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

            {/* Communication Analysis */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Communication Analysis</h2>
                
                {/* Input with Highlighting */}
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

                {/* Threat Indicators Legend */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    Threat Indicators:
                    {basicAnalysis && (
                      <span className="text-green-600 font-medium">✓ Analysis Complete</span>
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
            
            {/* Loading State */}
            {isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {analysisStage === 'basic' ? 'Running Security Analysis' : 'Running Professional Investigation'}
                </h3>
                <p className="text-gray-600">
                  {analysisStage === 'basic' 
                    ? 'Analyzing patterns and preparing investigation targets...'
                    : 'Conducting business verification and threat intelligence research...'
                  }
                </p>
              </div>
            )}

            {/* Basic Analysis Results */}
            {basicAnalysis && (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Security Analysis Complete
                    </h2>
                    <p className="text-sm text-gray-600">Analysis completed successfully</p>
                  </div>
                  <button 
                    onClick={generateReport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                  >
                    <FileText className="w-4 h-4" />
                    Report
                  </button>
                </div>

                {/* Analysis Cards */}
                <div className="space-y-4">
                  <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      What We Observed
                    </h3>
                    <p className="text-blue-800 text-sm">{basicAnalysis.whatWeObserved}</p>
                  </div>

                  <div className="border border-orange-100 bg-orange-50 rounded-lg p-4">
                    <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      Red Flags to Consider
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {basicAnalysis.redFlagsToConsider?.map((flag, index) => (
                        <li key={index} className="text-orange-800 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      Verification Steps
                    </h3>
                    <ol className="space-y-1 text-sm">
                      {basicAnalysis.verificationSteps?.map((step, index) => (
                        <li key={index} className="text-green-800 flex items-start gap-2">
                          <span className="w-5 h-5 bg-green-600 text-white rounded text-xs flex items-center justify-center mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Why Verification Matters
                    </h3>
                    <p className="text-purple-800 text-sm">{basicAnalysis.whyVerificationMatters}</p>
                  </div>

                  <div className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Organization Guidance
                    </h3>
                    <p className="text-gray-700 text-sm">{basicAnalysis.organizationSpecificGuidance}</p>
                  </div>

                  {/* Investigation Targets */}
                  {basicAnalysis.investigationTargets && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Search className="w-4 h-4" />
                        Investigation Targets Identified
                      </h3>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {basicAnalysis.investigationTargets.businessesToVerify?.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Businesses:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {basicAnalysis.investigationTargets.businessesToVerify.map((business, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  {business}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {basicAnalysis.investigationTargets.contactsToCheck?.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Contacts:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {basicAnalysis.investigationTargets.contactsToCheck.map((contact, index) => (
                                <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  {contact}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {basicAnalysis.investigationTargets.suspiciousPatterns?.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Patterns:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {basicAnalysis.investigationTargets.suspiciousPatterns.map((pattern, index) => (
                                <span key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                                  {pattern}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upgrade Option */}
                {showUpgradeOption && !isAnalyzing && (
                  <div className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 text-center">
                    <Search className="w-10 h-10 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Need Professional Investigation?</h3>
                    <p className="text-gray-600 mb-4">Get detailed business verification and real-time threat intelligence</p>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={upgradeToAdvanced}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
                      >
                        <Search className="w-4 h-4" />
                        Run Investigation
                      </button>
                      <button 
                        onClick={() => setShowUpgradeOption(false)}
                        className="px-6 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      >
                        Skip
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Research: Official company contacts • Recent scam reports • Business legitimacy
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Advanced Analysis Results */}
            {advancedAnalysis && (
              <div className="mt-6 space-y-6">
                
                {/* Header */}
                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    Professional Investigation Results
                  </h2>
                  <p className="text-sm text-gray-600">Research completed with verification data</p>
                </div>

                {/* Business Verification */}
                {advancedAnalysis.businessVerification && (
                  <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Business Verification
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Organization:</span>
                        <span className="ml-2 text-blue-700">{advancedAnalysis.businessVerification.claimedOrganization}</span>
                      </div>
                      
                      {advancedAnalysis.businessVerification.officialContacts && advancedAnalysis.businessVerification.officialContacts.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800">Official Contacts:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.businessVerification.officialContacts.map((contact, index) => (
                              <li key={index} className="text-blue-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {contact}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.businessVerification.comparisonFindings && advancedAnalysis.businessVerification.comparisonFindings.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800">Comparison Findings:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.businessVerification.comparisonFindings.map((finding, index) => (
                              <li key={index} className="text-blue-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.businessVerification.officialAlerts && advancedAnalysis.businessVerification.officialAlerts.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-800">Official Alerts:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.businessVerification.officialAlerts.map((alert, index) => (
                              <li key={index} className="text-blue-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {alert}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Threat Intelligence */}
                {advancedAnalysis.threatIntelligence && (
                  <div className="border border-red-100 bg-red-50 rounded-lg p-4">
                    <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Threat Intelligence
                    </h3>
                    <div className="space-y-2 text-sm">
                      {advancedAnalysis.threatIntelligence.knownScamReports && advancedAnalysis.threatIntelligence.knownScamReports.length > 0 && (
                        <div>
                          <span className="font-medium text-red-800">Known Scam Reports:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.threatIntelligence.knownScamReports.map((report, index) => (
                              <li key={index} className="text-red-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                {report}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.threatIntelligence.similarIncidents && advancedAnalysis.threatIntelligence.similarIncidents.length > 0 && (
                        <div>
                          <span className="font-medium text-red-800">Similar Incidents:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.threatIntelligence.similarIncidents.map((incident, index) => (
                              <li key={index} className="text-red-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                {incident}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.threatIntelligence.securityAdvisories && advancedAnalysis.threatIntelligence.securityAdvisories.length > 0 && (
                        <div>
                          <span className="font-medium text-red-800">Security Advisories:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.threatIntelligence.securityAdvisories.map((advisory, index) => (
                              <li key={index} className="text-red-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                {advisory}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Threat Landscape */}
                {advancedAnalysis.currentThreatLandscape && (
                  <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Current Threat Landscape
                    </h3>
                    <div className="space-y-2 text-sm">
                      {advancedAnalysis.currentThreatLandscape.industryTrends && advancedAnalysis.currentThreatLandscape.industryTrends.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-800">Industry Trends:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.currentThreatLandscape.industryTrends.map((trend, index) => (
                              <li key={index} className="text-purple-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                                {trend}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.currentThreatLandscape.recentCampaigns && advancedAnalysis.currentThreatLandscape.recentCampaigns.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-800">Recent Campaigns:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.currentThreatLandscape.recentCampaigns.map((campaign, index) => (
                              <li key={index} className="text-purple-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                                {campaign}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.currentThreatLandscape.officialWarnings && advancedAnalysis.currentThreatLandscape.officialWarnings.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-800">Official Warnings:</span>
                          <ul className="ml-4 mt-1 space-y-1">
                            {advancedAnalysis.currentThreatLandscape.officialWarnings.map((warning, index) => (
                              <li key={index} className="text-purple-700 flex items-start gap-1">
                                <span className="w-1 h-1 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Info Cards */}
            {(basicAnalysis || advancedAnalysis) && (
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
                    Educational analysis with transparent processing. No data stored permanently.
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
              <h3 className="text-lg font-medium">Security Education Report</h3>
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