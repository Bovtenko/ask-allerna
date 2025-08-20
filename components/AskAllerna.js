import React, { useState, useEffect } from 'react';
import { AlertTriangle, Send, Shield, Clock, CheckCircle, XCircle, Search, Zap, TrendingUp, RotateCcw } from 'lucide-react';

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
  const [totalCost, setTotalCost] = useState(0);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // AI-powered text highlighting function with scanning animation
  const getAIHighlighting = async (text) => {
    if (!text || text.length < 10) return text;
    
    try {
      setIsHighlighting(true);
      setScanProgress(0);
      
      // Animate scanning progress
      const scanInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 90) {
            clearInterval(scanInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          incident: text, 
          analysisType: 'highlight' 
        })
      });
      
      // Complete the scan animation
      clearInterval(scanInterval);
      setScanProgress(100);
      
      if (response.ok) {
        const data = await response.json();
        // Small delay to show completion
        setTimeout(() => {
          const highlighted = applyAIHighlighting(text, data.highlights || []);
          console.log('[UI] Applied highlights:', highlighted.substring(0, 200));
          setHighlightedText(highlighted);
          setIsHighlighting(false);
          setScanProgress(0);
        }, 300);
        return highlighted;
      } else {
        console.warn('AI highlighting failed, using fallback');
        setIsHighlighting(false);
        setScanProgress(0);
        const fallback = highlightSuspiciousText(text);
        setHighlightedText(fallback);
        return fallback;
      }
    } catch (error) {
      console.warn('AI highlighting error:', error);
      setIsHighlighting(false);
      setScanProgress(0);
      const fallback = highlightSuspiciousText(text);
      setHighlightedText(fallback);
      return fallback;
    }
  };

  // Apply AI highlighting based on response
  const applyAIHighlighting = (text, highlights) => {
    let highlightedText = text;
    
    // Sort highlights by start position (descending) to avoid position shifts
    const sortedHighlights = highlights.sort((a, b) => b.start - a.start);
    
    sortedHighlights.forEach(highlight => {
      const { start, end, type, text: highlightText } = highlight;
      
      // Validate highlight bounds
      if (start < 0 || end > highlightedText.length || start >= end) {
        console.warn('Invalid highlight bounds:', highlight);
        return;
      }
      
      let className = '';
      switch (type) {
        case 'high_risk':
          className = 'bg-red-200 text-red-800 px-1 rounded font-medium border border-red-300';
          break;
        case 'medium_risk':
          className = 'bg-orange-200 text-orange-800 px-1 rounded font-medium border border-orange-300';
          break;
        case 'suspicious':
          className = 'bg-yellow-200 text-yellow-800 px-1 rounded font-medium border border-yellow-300';
          break;
        case 'organization':
          className = 'bg-blue-200 text-blue-800 px-1 rounded font-medium border border-blue-300';
          break;
        default:
          className = 'bg-gray-200 text-gray-800 px-1 rounded font-medium border border-gray-300';
      }
      
      const before = highlightedText.substring(0, start);
      const highlightContent = highlightedText.substring(start, end);
      const after = highlightedText.substring(end);
      const highlighted = `<span class="${className}">${highlightContent}</span>`;
      
      highlightedText = before + highlighted + after;
    });
    
    return highlightedText;
  };

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
        `<span class="bg-red-200 text-red-800 px-1 rounded font-medium border border-red-300">${match}</span>`
      );
    });

    mediumRiskPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-orange-200 text-orange-800 px-1 rounded font-medium border border-orange-300">${match}</span>`
      );
    });

    suspiciousPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-yellow-200 text-yellow-800 px-1 rounded font-medium border border-yellow-300">${match}</span>`
      );
    });

    companyPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-blue-200 text-blue-800 px-1 rounded font-medium border border-blue-300">${match}</span>`
      );
    });

    return highlightedText;
  };

  // Update highlighted text when in analysis mode
  useEffect(() => {
    if (isAnalysisMode && input) {
      // Use regex highlighting for now to avoid text corruption
      const regexHighlighted = highlightSuspiciousText(input);
      setHighlightedText(regexHighlighted);
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
        console.log('[DEBUG] Basic analysis response:', data);
        setBasicAnalysis(data);
        setTotalCost(0.05);
        setShowUpgradeOption(true);
        return data;
      } else {
        throw new Error(`Basic analysis failed: ${response.status}`);
      }
    } catch (error) {
      setError(`Basic analysis error: ${error.message}`);
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
        console.log('[DEBUG] Advanced analysis response:', data);
        setAdvancedAnalysis(data);
        setTotalCost(0.27);
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
    setTotalCost(0);
    
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
    setTotalCost(0);
    setAnalysisStage('');
    setHighlightedText('');
  };

  const completeReset = () => {
    newAnalysis();
    setIsAnalysisMode(false);
  };

  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportId = `ALR-${Date.now().toString().slice(-8)}`;
    const analysisLevel = advancedAnalysis ? 'Comprehensive Analysis with Business Verification' : 'Enhanced Security Analysis';

    let investigationTargetsSection = '';
    if (basicAnalysis?.investigationTargets) {
      const targets = basicAnalysis.investigationTargets;
      investigationTargetsSection = `
INVESTIGATION TARGETS IDENTIFIED:
Businesses to Verify: ${targets.businessesToVerify?.join(', ') || 'None'}
Contacts to Check: ${targets.contactsToCheck?.join(', ') || 'None'}
Suspicious Patterns: ${targets.suspiciousPatterns?.join(', ') || 'None'}
Recommended Searches: ${targets.searchQueries?.join(', ') || 'None'}`;
    }

    let advancedSection = '';
    if (advancedAnalysis) {
      advancedSection = `
=== BUSINESS VERIFICATION RESULTS ===

ORGANIZATION VERIFICATION:
Claimed Organization: ${advancedAnalysis.businessVerification?.claimedOrganization || 'Not specified'}
Official Contacts Found: ${advancedAnalysis.businessVerification?.officialContacts?.join(', ') || 'None found'}
Comparison Analysis: ${advancedAnalysis.businessVerification?.comparisonFindings?.join(', ') || 'None available'}
Official Fraud Alerts: ${advancedAnalysis.businessVerification?.officialAlerts?.join(', ') || 'None found'}

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

ANALYSIS LEVEL: ${analysisLevel}

=== ENHANCED SECURITY ANALYSIS ===

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

ANALYSIS DETAILS:
- Generated: ${timestamp}
- Report ID: ${reportId}
- Analysis Type: ${analysisLevel}
- Platform: Ask Allerna Security Education Platform

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
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes wave {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-wave { animation: wave 6s linear infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
        .animate-pulse-slow { animation: pulse 2s infinite; }
        .layout-transition { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
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
          max-height: 100%;
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
        .unified-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .unified-gradient-wave {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 25%, #667eea 50%, #764ba2 75%, #667eea 100%);
          background-size: 200% 100%;
        }
        .card-unified {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .scan-overlay {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%);
          width: 100px;
          z-index: 4;
          transition: transform 0.3s ease;
          pointer-events: none;
        }
        .scan-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
          z-index: 5;
        }
        `
      }} />
      
      {/* Main Layout */}
      <div className={`layout-transition ${isAnalysisMode ? 'md:grid md:grid-cols-2 md:gap-6' : ''}`}>
        
        {/* Left Column */}
        <div className={`layout-transition ${isAnalysisMode ? 'md:max-h-screen md:overflow-y-auto md:sticky md:top-6' : ''}`}>
          
          {/* REDESIGNED STEP 1: Landing Page (Not in Analysis Mode) */}
          {!isAnalysisMode && (
            <div className="space-y-8">
              
              {/* Unified Header + Input Section */}
              <div className="card-unified overflow-hidden">
                
                {/* Header Section */}
                <div className="unified-gradient p-8 text-center text-white relative overflow-hidden">
                  <div className="absolute inset-0 unified-gradient-wave animate-wave opacity-30"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <Shield className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <h1 className="text-5xl font-bold mb-3">Ask Allerna</h1>
                    <p className="text-xl opacity-90 mb-6">AI-Powered Security Education Platform</p>
                    <p className="text-lg opacity-80">Get detailed analysis and verification guidance for suspicious communications</p>
                  </div>
                </div>

                {/* Input Section */}
                <div className="p-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-lg font-semibold text-gray-800 mb-4">
                        Describe the suspicious communication:
                      </label>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe the suspicious email, phone call, text message, or other communication in detail..."
                        className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-gray-700 placeholder-gray-400 transition-all duration-200"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="w-5 h-5" />
                          <span className="font-medium">Analysis Error</span>
                        </div>
                        <p className="text-red-700 text-sm mt-1">{error}</p>
                      </div>
                    )}

                    {/* Main Analysis Button - REDESIGNED */}
                    <button
                      onClick={analyzeIncident}
                      disabled={isAnalyzing || !input.trim()}
                      className="w-full group relative overflow-hidden rounded-xl text-white font-semibold text-xl py-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 unified-gradient-wave animate-wave"></div>
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <Search className="w-6 h-6" />
                        <span>Analyze Communication</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trust Your Instincts Section */}
              <div className="card-unified p-6">
                <h3 className="text-xl font-bold text-blue-800 mb-3 flex items-center gap-2">
                  🧠 Trust Your Instincts
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  The fact that something felt "off" enough for you to check here shows your security awareness is working. 
                  <strong className="text-blue-800"> That human intuition is your first line of defense.</strong>
                </p>
              </div>

              {/* Privacy Section */}
              <div className="card-unified p-6">
                <h3 className="text-xl font-bold text-purple-800 mb-3 flex items-center gap-2">
                  🔒 Privacy & Data Protection
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Educational analysis with transparent processing. No data stored permanently.
                </p>
              </div>

            </div>
          )}

          {/* EXISTING STEP 2: Analysis Mode - Left Column (Input + Controls) */}
          {isAnalysisMode && (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 unified-gradient-wave animate-wave"></div>
                      <Shield className="w-8 h-8 text-white relative z-10" />
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">Ask Allerna</h1>
                  <p className="text-gray-600">AI-Powered Security Education Platform</p>
                </div>
              </div>

              {/* Input Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Communication Analysis
                    </label>
                    <div className="flex gap-2">
                      <button onClick={newAnalysis} className="px-3 py-1 text-sm unified-gradient text-white hover:opacity-90 rounded-lg flex items-center gap-1">
                        <RotateCcw className="w-4 h-4" />
                        New Analysis
                      </button>
                      <button onClick={completeReset} className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                        Exit Analysis
                      </button>
                    </div>
                  </div>

                  {/* Input with Highlighting */}
                  <div className="input-overlay-container h-96 layout-transition">
                    {highlightedText ? (
                      <>
                        <div className="highlight-overlay border border-gray-300 rounded-lg bg-white" dangerouslySetInnerHTML={{ __html: highlightedText }} />
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="input-base w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                          style={{ backgroundColor: 'transparent' }}
                        />
                      </>
                    ) : (
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe the suspicious email, phone call, text message, or other communication in detail..."
                        className="input-visible w-full h-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                      />
                    )}
                  </div>

                  {/* Color Legend */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                      Threat Level Indicators:
                      {basicAnalysis && (
                        <span className="text-green-600 font-medium">✓ Analysis Complete</span>
                      )}
                      {isHighlighting && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                          <span>AI analyzing...</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-200 border border-red-300 rounded"></span>
                        <span>High Risk</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></span>
                        <span>Medium Risk</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></span>
                        <span>Suspicious</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></span>
                        <span>Organization</span>
                      </div>
                    </div>
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
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column - Analysis Results (UNCHANGED - All existing functionality) */}
        {isAnalysisMode && (
          <div className="layout-transition md:max-h-screen md:overflow-y-auto">
            
            {/* Loading for Basic */}
            {isAnalyzing && analysisStage === 'basic' && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 unified-gradient-wave animate-wave"></div>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white relative z-10"></div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Running Security Analysis</h2>
                  <p className="text-gray-600">Analyzing patterns and preparing investigation targets...</p>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">⚡ Comprehensive analysis in progress • ~10 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Basic Results */}
            {basicAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Zap className="w-6 h-6 text-green-600" />
                      Security Analysis Complete
                    </h2>
                    <p className="text-sm text-gray-600">Analysis Time: ~10 seconds</p>
                  </div>
                  <button onClick={generateReport} className="px-4 py-2 unified-gradient text-white hover:opacity-90 rounded-lg flex items-center gap-2">
                    📄 Generate Report
                  </button>
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

                  {/* Investigation Targets Preview */}
                  {basicAnalysis.investigationTargets && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-bold text-gray-800 mb-3">🎯 Investigation Targets Identified</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {basicAnalysis.investigationTargets.businessesToVerify?.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Businesses:</span>
                            <div className="text-gray-600 mt-1">
                              {basicAnalysis.investigationTargets.businessesToVerify.map((business, index) => (
                                <div key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                                  {business}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {basicAnalysis.investigationTargets.contactsToCheck?.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Contacts:</span>
                            <div className="text-gray-600 mt-1">
                              {basicAnalysis.investigationTargets.contactsToCheck.map((contact, index) => (
                                <div key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                                  {contact}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {basicAnalysis.investigationTargets.suspiciousPatterns?.length > 0 && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Patterns to Research:</span>
                            <div className="text-gray-600 mt-1">
                              {basicAnalysis.investigationTargets.suspiciousPatterns.map((pattern, index) => (
                                <div key={index} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs inline-block mr-1 mb-1">
                                  {pattern}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Upgrade Option */}
                {showUpgradeOption && !isAnalyzing && (
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <div className="text-center">
                      <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Need Professional Investigation?</h3>
                      <p className="text-gray-600 mb-4">Get detailed business verification and real-time threat intelligence</p>
                      <div className="flex justify-center gap-4">
                        <button onClick={upgradeToAdvanced} className="px-6 py-3 unified-gradient text-white rounded-lg hover:opacity-90 font-medium flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Run Professional Investigation
                        </button>
                        <button onClick={() => setShowUpgradeOption(false)} className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                          No Thanks
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Research: Official company contacts • Recent scam reports • Business legitimacy
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading for Advanced */}
            {isAnalyzing && analysisStage === 'advanced' && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-lg flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 unified-gradient-wave animate-wave"></div>
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white relative z-10"></div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Running Professional Investigation</h2>
                  <p className="text-gray-600">Conducting business verification and threat intelligence research...</p>
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">🔍 Research in progress • ~15 seconds</p>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Results */}
            {advancedAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Search className="w-6 h-6 text-blue-600" />
                    Professional Investigation Results
                  </h2>
                  <p className="text-sm text-gray-600">Research completed with verification data</p>
                </div>

                {/* Business Verification Section */}
                {advancedAnalysis.businessVerification && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-blue-800 mb-3">🏢 Business Verification</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-blue-700">Organization:</span>
                        <span className="ml-2 text-blue-600">{advancedAnalysis.businessVerification.claimedOrganization}</span>
                      </div>
                      
                      {advancedAnalysis.businessVerification.officialContacts && advancedAnalysis.businessVerification.officialContacts.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-700">Official Contacts:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.businessVerification.officialContacts.map((contact, index) => (
                              <li key={index} className="text-blue-600">{contact}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.businessVerification.comparisonFindings && advancedAnalysis.businessVerification.comparisonFindings.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-700">Comparison Findings:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.businessVerification.comparisonFindings.map((finding, index) => (
                              <li key={index} className="text-blue-600">{finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.businessVerification.officialAlerts && advancedAnalysis.businessVerification.officialAlerts.length > 0 && (
                        <div>
                          <span className="font-medium text-blue-700">Official Alerts:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.businessVerification.officialAlerts.map((alert, index) => (
                              <li key={index} className="text-blue-600">{alert}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Threat Intelligence Section */}
                {advancedAnalysis.threatIntelligence && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-red-800 mb-3">🚨 Threat Intelligence</h3>
                    <div className="space-y-2">
                      {advancedAnalysis.threatIntelligence.knownScamReports && advancedAnalysis.threatIntelligence.knownScamReports.length > 0 && (
                        <div>
                          <span className="font-medium text-red-700">Known Scam Reports:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.threatIntelligence.knownScamReports.map((report, index) => (
                              <li key={index} className="text-red-600">{report}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.threatIntelligence.similarIncidents && advancedAnalysis.threatIntelligence.similarIncidents.length > 0 && (
                        <div>
                          <span className="font-medium text-red-700">Similar Incidents:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.threatIntelligence.similarIncidents.map((incident, index) => (
                              <li key={index} className="text-red-600">{incident}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.threatIntelligence.securityAdvisories && advancedAnalysis.threatIntelligence.securityAdvisories.length > 0 && (
                        <div>
                          <span className="font-medium text-red-700">Security Advisories:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.threatIntelligence.securityAdvisories.map((advisory, index) => (
                              <li key={index} className="text-red-600">{advisory}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Current Threat Landscape Section */}
                {advancedAnalysis.currentThreatLandscape && (
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-lg">
                    <h3 className="font-bold text-purple-800 mb-3">🌍 Current Threat Landscape</h3>
                    <div className="space-y-2">
                      {advancedAnalysis.currentThreatLandscape.industryTrends && advancedAnalysis.currentThreatLandscape.industryTrends.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-700">Industry Trends:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.currentThreatLandscape.industryTrends.map((trend, index) => (
                              <li key={index} className="text-purple-600">{trend}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.currentThreatLandscape.recentCampaigns && advancedAnalysis.currentThreatLandscape.recentCampaigns.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-700">Recent Campaigns:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.currentThreatLandscape.recentCampaigns.map((campaign, index) => (
                              <li key={index} className="text-purple-600">{campaign}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {advancedAnalysis.currentThreatLandscape.officialWarnings && advancedAnalysis.currentThreatLandscape.officialWarnings.length > 0 && (
                        <div>
                          <span className="font-medium text-purple-700">Official Warnings:</span>
                          <ul className="list-disc list-inside ml-4 mt-1">
                            {advancedAnalysis.currentThreatLandscape.officialWarnings.map((warning, index) => (
                              <li key={index} className="text-purple-600">{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Sections - Show in analysis mode at bottom of right column */}
            {isAnalysisMode && (
              <>
                <div className="card-unified p-4 mb-4">
                  <h3 className="font-bold text-blue-800 mb-2">🧠 Trust Your Instincts</h3>
                  <p className="text-sm text-blue-700">
                    The fact that something felt "off" enough for you to check here shows your security awareness is working. 
                    <strong> That human intuition is your first line of defense.</strong>
                  </p>
                </div>
                <div className="card-unified p-4 mb-4">
                  <h3 className="font-bold text-purple-800 mb-2">🔒 Privacy & Data Protection</h3>
                  <p className="text-sm text-purple-700">
                    Educational analysis with transparent processing. No data stored permanently.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="unified-gradient text-white p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">📄 Security Education Report</h3>
              <button onClick={() => setShowReport(false)} className="text-white hover:text-gray-200 text-2xl">×</button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex gap-2">
                <button onClick={copyToClipboard} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg">
                  📋 Copy to Clipboard
                </button>
                <button onClick={() => setShowReport(false)} className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg">
                  Close
                </button>
              </div>
              <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-800">{reportText}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Only when not in analysis mode */}
      {!isAnalysisMode && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Ask Allerna • AI-Powered Security Education Platform</p>
        </div>
      )}
    </div>
  );
};

export default AskAllerna;