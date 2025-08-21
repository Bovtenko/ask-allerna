// components/AskAllerna.js - Complete Enhanced Version with Detailed Research Display

import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { Shield, Send, Search, Clock, CheckCircle, AlertTriangle, RotateCcw, FileText, Eye, Flag, CheckSquare, Building, Users, TrendingUp, Copy, ExternalLink, Loader, X, AlertCircle, Info } from 'lucide-react';

// Debounced highlighting function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// State management with useReducer
const initialState = {
  analysis: {
    step1: null,
    step2: null,
  },
  ui: {
    isAnalyzing: false,
    isResearching: false,
    isAnalysisMode: false,
    showReport: false,
    showTechnicalDetails: false,
  },
  input: '',
  error: null,
  researchStatus: '',
  highlightedText: '',
  reportText: '',
  analysisProgress: 0,
  researchProgress: 0,
};

function analysisReducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    
    case 'START_ANALYSIS':
      return {
        ...state,
        ui: { ...state.ui, isAnalyzing: true, isAnalysisMode: true },
        error: null,
        analysisProgress: 0,
        analysis: { step1: null, step2: null }
      };
    
    case 'ANALYSIS_PROGRESS':
      return { ...state, analysisProgress: action.payload };
    
    case 'ANALYSIS_SUCCESS':
      return {
        ...state,
        analysis: { ...state.analysis, step1: action.payload },
        ui: { ...state.ui, isAnalyzing: false },
        analysisProgress: 100
      };
    
    case 'START_RESEARCH':
      return {
        ...state,
        ui: { ...state.ui, isResearching: true },
        researchStatus: action.payload || 'Starting verification...',
        researchProgress: 0
      };
    
    case 'RESEARCH_PROGRESS':
      return { 
        ...state, 
        researchProgress: action.payload.progress,
        researchStatus: action.payload.status 
      };
    
    case 'RESEARCH_SUCCESS':
      return {
        ...state,
        analysis: { ...state.analysis, step2: action.payload },
        ui: { ...state.ui, isResearching: false },
        researchProgress: 100,
        researchStatus: 'Verification complete'
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        ui: { 
          ...state.ui, 
          isAnalyzing: false, 
          isResearching: false 
        }
      };
    
    case 'SET_HIGHLIGHTED_TEXT':
      return { ...state, highlightedText: action.payload };
    
    case 'TOGGLE_TECHNICAL_DETAILS':
      return {
        ...state,
        ui: { ...state.ui, showTechnicalDetails: !state.ui.showTechnicalDetails }
      };
    
    case 'SET_REPORT':
      return {
        ...state,
        reportText: action.payload.text,
        ui: { ...state.ui, showReport: action.payload.show }
      };
    
    case 'RESET':
      return {
        ...initialState,
        ui: { ...initialState.ui, isAnalysisMode: action.payload?.keepAnalysisMode || false }
      };
    
    case 'EXIT_ANALYSIS':
      return initialState;
    
    default:
      return state;
  }
}

const AskAllerna = () => {
  const [state, dispatch] = useReducer(analysisReducer, initialState);

  // Debounced highlighting function
  const debouncedHighlight = useCallback(
    debounce((text) => {
      if (state.ui.isAnalysisMode && text) {
        const highlighted = highlightSuspiciousText(text);
        dispatch({ type: 'SET_HIGHLIGHTED_TEXT', payload: highlighted });
      }
    }, 300),
    [state.ui.isAnalysisMode]
  );

  // Update highlighted text when input changes
  useEffect(() => {
    debouncedHighlight(state.input);
  }, [state.input, debouncedHighlight]);

  // Improved regex-based highlighting with user-friendly colors
  const highlightSuspiciousText = (text) => {
    if (!text) return '';
    let highlightedText = text;

    // High Priority Threats (Red) - Immediate action items
    const highPriorityPatterns = [
      /https?:\/\/[^\s]+/gi,
      /www\.[^\s]+/gi,
      /\$[0-9,]+(\.[0-9]{2})?/gi,
      /bitcoin|btc|cryptocurrency|crypto|wallet/gi,
    ];

    // Urgent Language (Orange) - Pressure tactics
    const urgentPatterns = [
      /\b(urgent|immediately|asap|expire[sd]?|deadline|limited time|act now|within 24 hours)\b/gi,
      /\b(verify|confirm|update|validate|authenticate|suspend|close|cancel)\b/gi,
      /\b(click here|download|install|enable|disable|activate)\b/gi,
    ];

    // Contact Methods (Yellow) - Ways to reach you
    const contactPatterns = [
      /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      /\b(whatsapp|telegram|signal|text|call)\b/gi,
    ];

    // Organizations (Blue) - Companies mentioned
    const organizationPatterns = [
      /\b(amazon|microsoft|apple|google|facebook|paypal|netflix|spotify|uber|airbnb)\b/gi,
      /\b(bank|credit union|visa|mastercard|american express)\b/gi,
      /\b(irs|social security|medicare|unemployment|government)\b/gi,
    ];

    // Apply highlighting with user-friendly colors
    highPriorityPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-red-100 text-red-800 px-2 py-1 rounded font-medium border border-red-200">${match}</span>`
      );
    });

    urgentPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded font-medium border border-orange-200">${match}</span>`
      );
    });

    contactPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium border border-yellow-200">${match}</span>`
      );
    });

    organizationPatterns.forEach(pattern => {
      highlightedText = highlightedText.replace(pattern, (match) => 
        `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium border border-blue-200">${match}</span>`
      );
    });

    return highlightedText;
  };

  // Main analysis function with improved error handling and progress
  const analyzeIncident = async () => {
    if (!state.input.trim()) return;
    
    dispatch({ type: 'START_ANALYSIS' });
    dispatch({ type: 'SET_HIGHLIGHTED_TEXT', payload: highlightSuspiciousText(state.input) });
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      dispatch({ type: 'ANALYSIS_PROGRESS', payload: Math.min(state.analysisProgress + 10, 90) });
    }, 500);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident: state.input, analysisType: 'context' }),
        signal: controller.signal
      });
      
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'ANALYSIS_SUCCESS', payload: data });
        
        // Auto-trigger research if needed
        if (data.shouldAutoTrigger) {
          setTimeout(() => runDeepResearch(data), 1000);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.userMessage || 'Analysis failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      let userMessage = 'Something went wrong. Please try again.';
      
      if (error.name === 'AbortError') {
        userMessage = 'Analysis took too long. Please try again - sometimes it just takes a moment.';
      } else if (error.message.includes('rate limit')) {
        userMessage = 'Too many people are using the service right now. Please wait a minute and try again.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: userMessage });
    }
  };

  // Deep research function with progress tracking
  const runDeepResearch = async (step1Results) => {
    dispatch({ type: 'START_RESEARCH', payload: 'Starting verification...' });
    
    // Simulate research progress
    const progressSteps = [
      { progress: 20, status: 'Checking business information...' },
      { progress: 40, status: 'Verifying contact details...' },
      { progress: 60, status: 'Searching scam databases...' },
      { progress: 80, status: 'Gathering threat intelligence...' }
    ];
    
    progressSteps.forEach((step, index) => {
      setTimeout(() => {
        dispatch({ type: 'RESEARCH_PROGRESS', payload: step });
      }, (index + 1) * 1500);
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          incident: state.input, 
          analysisType: 'deep_research',
          step1Results: step1Results || state.analysis.step1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'RESEARCH_SUCCESS', payload: data });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.userMessage || 'Research failed');
      }
    } catch (error) {
      let userMessage = 'Unable to complete additional verification right now.';
      
      if (error.name === 'AbortError') {
        userMessage = 'Verification took too long. The basic analysis is complete and reliable.';
      } else if (error.message) {
        userMessage = error.message;
      }
      
      dispatch({ type: 'SET_ERROR', payload: userMessage });
    }
  };

  // Reset functions
  const newAnalysis = () => {
    dispatch({ type: 'RESET', payload: { keepAnalysisMode: true } });
  };

  const exitAnalysis = () => {
    dispatch({ type: 'EXIT_ANALYSIS' });
  };

  // Generate enhanced user-friendly report
  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportId = `ALR-${Date.now().toString().slice(-8)}`;
    const analysis = state.analysis.step1;
    const research = state.analysis.step2;

    let researchSection = '';
    if (research?.researchConducted && research?.userFriendly) {
      researchSection = `
VERIFICATION RESULTS:
Status: ${research.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? '⚠️ FRAUD ALERTS FOUND - Do not proceed' :
  research.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? '✅ Business appears legitimate' :
  research.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' ? '🔍 Partially verified - exercise caution' :
  '✓ Additional verification completed'}

WHAT WE FOUND:
${research.userFriendly.keyFindings?.map(finding => `• ${finding}`).join('\n') || 'Research completed successfully'}

VERIFICATION SUMMARY:
${research.userFriendly.verificationSummary || 'Verification completed'}

RECOMMENDED ACTIONS BASED ON RESEARCH:
${research.userFriendly.recommendedActions?.map(action => `• ${action}`).join('\n') || 'Standard verification recommended'}

HOW TO VERIFY INDEPENDENTLY:
${research.userFriendly.officialSources?.map(source => `• ${source}`).join('\n') || 'Use official channels'}`;
    }

    const report = `ASK ALLERNA SCAM ANALYSIS REPORT
Generated: ${timestamp}
Report ID: ${reportId}

COMMUNICATION ANALYZED:
${state.input}

ANALYSIS RESULTS:
${analysis?.userFriendly?.summary || 'Analysis completed'}

SCAM TYPE: ${analysis?.userFriendly?.scamType || analysis?.scamCategory || 'Unknown'}
RISK LEVEL: ${analysis?.userFriendly?.riskLevel || 'Unknown'}

MAIN CONCERNS:
${analysis?.userFriendly?.mainConcerns?.map(concern => `• ${concern}`).join('\n') || 'No specific concerns identified'}

RECOMMENDED ACTIONS:
${analysis?.userFriendly?.nextSteps?.map(step => `• ${step}`).join('\n') || 'No specific actions recommended'}

HOW TO VERIFY:
${analysis?.userFriendly?.howToCheck?.map(method => `• ${method}`).join('\n') || 'Contact through official channels'}

${researchSection}

---
Always trust your instincts. If something feels wrong, it probably is.
Report generated by Ask Allerna - AI-Powered Scam Detection`;

    dispatch({ type: 'SET_REPORT', payload: { text: report, show: true } });
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(state.reportText);
      alert('Report copied to clipboard!');
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = state.reportText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Report copied to clipboard!');
    }
  };

  // Get risk color for UI elements
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'orange';
      case 'LOW': return 'yellow';
      default: return 'gray';
    }
  };

  // Get progress bar color
  const getProgressColor = (progress) => {
    if (progress < 50) return 'bg-blue-500';
    if (progress < 80) return 'bg-green-500';
    return 'bg-green-600';
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
        .progress-bar-animation {
          transition: width 0.3s ease-in-out;
        }
        `
      }} />

      {/* Landing Page */}
      {!state.ui.isAnalysisMode && (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">Ask Allerna</h1>
            <p className="text-xl text-gray-600 mb-8">Is This a Scam?</p>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Get instant analysis of suspicious emails, texts, calls, job offers, and other communications
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-900 mb-4">
              What happened? Describe the suspicious communication:
            </label>
            <textarea
              value={state.input}
              onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
              placeholder="For example: 'I got an email saying my Amazon account will be closed unless I click a link and verify my payment info' or 'Someone called claiming to be from Microsoft saying my computer has a virus'"
              className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
            
            {state.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Unable to Complete Analysis</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
            )}

            <button
              onClick={analyzeIncident}
              disabled={state.ui.isAnalyzing || !state.input.trim() || state.input.trim().length < 10}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Search className="w-5 h-5" />
              <span>Check for Scams</span>
            </button>
            
            {state.input.trim().length > 0 && state.input.trim().length < 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Please provide a bit more detail to get the best analysis
              </p>
            )}
          </div>

          {/* Trust indicators */}
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2">
                <span>🧠</span>
                You Were Right to Check
              </h3>
              <p className="text-blue-800">
                Your instincts brought you here, and that's exactly right. When something feels suspicious, 
                it's always smart to verify before taking any action.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span>🔒</span>
                Your Privacy Matters
              </h3>
              <p className="text-gray-700">
                We analyze your communication securely and don't store your personal information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Dashboard */}
      {state.ui.isAnalysisMode && (
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
                  New Check
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
                <h2 className="text-lg font-medium text-gray-900 mb-4">What You Described</h2>
                
                <div className="input-overlay-container h-96 mb-4">
                  {state.highlightedText ? (
                    <>
                      <div 
                        className="highlight-overlay border border-gray-200 rounded-lg bg-white" 
                        dangerouslySetInnerHTML={{ __html: state.highlightedText }} 
                      />
                      <textarea
                        value={state.input}
                        onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
                        className="input-base w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        style={{ backgroundColor: 'transparent' }}
                      />
                    </>
                  ) : (
                    <textarea
                      value={state.input}
                      onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
                      placeholder="Describe what happened..."
                      className="input-visible w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  )}
                </div>

                {/* Color legend - simplified */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">Highlighted Items:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
                      <span className="text-gray-600">High Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></span>
                      <span className="text-gray-600">Urgent Language</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span>
                      <span className="text-gray-600">Contact Info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
                      <span className="text-gray-600">Organizations</span>
                    </div>
                  </div>
                </div>
              </div>

              {state.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Something Went Wrong</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{state.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="w-1/2 p-6 overflow-y-auto">
            
            {/* Analysis Loading State */}
            {state.ui.isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Checking for Scams
                </h3>
                <p className="text-gray-600 mb-4">
                  Analyzing patterns and warning signs...
                </p>
                
                {/* Progress bar */}
                <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full progress-bar-animation ${getProgressColor(state.analysisProgress)}`}
                    style={{ width: `${state.analysisProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{state.analysisProgress}% complete</p>
              </div>
            )}

            {/* Research Loading State */}
            {state.ui.isResearching && (
              <div className="mb-6 border border-blue-100 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <h3 className="font-medium text-blue-900">Verifying Information</h3>
                </div>
                <p className="text-blue-800 text-sm mb-3">{state.researchStatus}</p>
                
                {/* Research progress bar */}
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 bg-blue-600 rounded-full progress-bar-animation"
                    style={{ width: `${state.researchProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700">{state.researchProgress}% complete</p>
              </div>
            )}

            {/* Analysis Results - User Friendly */}
            {state.analysis.step1 && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Analysis Complete
                    </h2>
                    <p className="text-sm text-gray-600">Here's what we found</p>
                  </div>
                  <div className="flex gap-2">
                    {!state.analysis.step1.shouldAutoTrigger && !state.analysis.step2 && !state.ui.isResearching && (
                      <button 
                        onClick={() => runDeepResearch(state.analysis.step1)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                      >
                        <Search className="w-4 h-4" />
                        Verify More
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

                {/* Main Results - User Friendly */}
                {state.analysis.step1.userFriendly && (
                  <>
                    {/* Risk Level & Summary */}
                    <div className={`border border-${getRiskColor(state.analysis.step1.userFriendly.riskLevel)}-200 bg-${getRiskColor(state.analysis.step1.userFriendly.riskLevel)}-50 rounded-lg p-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className={`w-5 h-5 text-${getRiskColor(state.analysis.step1.userFriendly.riskLevel)}-600`} />
                        <h3 className={`font-medium text-${getRiskColor(state.analysis.step1.userFriendly.riskLevel)}-900`}>
                          {state.analysis.step1.userFriendly.riskLevel} Risk: {state.analysis.step1.userFriendly.scamType}
                        </h3>
                      </div>
                      <p className={`text-${getRiskColor(state.analysis.step1.userFriendly.riskLevel)}-800 text-sm`}>
                        {state.analysis.step1.userFriendly.summary}
                      </p>
                    </div>

                    {/* Main Concerns */}
                    {state.analysis.step1.userFriendly.mainConcerns.length > 0 && (
                      <div className="border border-orange-100 bg-orange-50 rounded-lg p-4">
                        <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warning Signs We Found
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {state.analysis.step1.userFriendly.mainConcerns.map((concern, index) => (
                            <li key={index} className="text-orange-800 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* What to Do */}
                    {state.analysis.step1.userFriendly.nextSteps.length > 0 && (
                      <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          What You Should Do
                        </h3>
                        <ol className="space-y-2 text-sm">
                          {state.analysis.step1.userFriendly.nextSteps.map((step, index) => (
                            <li key={index} className="text-green-800 flex items-start gap-3">
                              <span className="w-6 h-6 bg-green-600 text-white rounded text-xs flex items-center justify-center mt-0.5 flex-shrink-0 font-medium">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* How to Verify */}
                    {state.analysis.step1.userFriendly.howToCheck.length > 0 && (
                      <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          How to Double-Check
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {state.analysis.step1.userFriendly.howToCheck.map((method, index) => (
                            <li key={index} className="text-blue-800 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                              {method}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Enhanced Research Results - User Friendly */}
                {state.analysis.step2 && state.analysis.step2.researchConducted && (
                  <div className="mt-8 space-y-6">
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Search className="w-6 h-6 text-blue-600" />
                        Research Results
                      </h2>
                      <p className="text-sm text-gray-600">Here's what we found through independent verification</p>
                    </div>

                    {state.analysis.step2.userFriendly && (
                      <>
                        {/* Enhanced Verification Status with Details */}
                        <div className={`border rounded-lg p-4 ${
                          state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'border-red-200 bg-red-50' :
                          state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'border-green-200 bg-green-50' :
                          state.analysis.step2.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' ? 'border-yellow-200 bg-yellow-50' :
                          'border-blue-200 bg-blue-50'
                        }`}>
                          <h3 className={`font-medium mb-3 flex items-center gap-2 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'text-red-900' :
                            state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'text-green-900' :
                            state.analysis.step2.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' ? 'text-yellow-900' :
                            'text-blue-900'
                          }`}>
                            {state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' && (
                              <>
                                <AlertTriangle className="w-5 h-5" />
                                ⚠️ Fraud Warnings Found
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' && (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                ✅ Business Verified as Legitimate
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' && (
                              <>
                                <AlertCircle className="w-5 h-5" />
                                🔍 Partially Verified
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'RESEARCH_COMPLETED' && (
                              <>
                                <Info className="w-5 h-5" />
                                ✓ Research Completed
                              </>
                            )}
                          </h3>
                          
                          {/* Verification Summary */}
                          <p className={`text-sm mb-3 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'text-red-800' :
                            state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'text-green-800' :
                            state.analysis.step2.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {state.analysis.step2.userFriendly.verificationSummary || 'Verification completed'}
                          </p>

                          {/* Verification Details */}
                          {state.analysis.step2.userFriendly.verificationDetails && 
                           state.analysis.step2.userFriendly.verificationDetails.length > 0 && (
                            <div className={`text-sm ${
                              state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'text-red-700' :
                              state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'text-green-700' :
                              state.analysis.step2.userFriendly.verificationStatus === 'PARTIALLY_VERIFIED' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              <ul className="space-y-1">
                                {state.analysis.step2.userFriendly.verificationDetails.map((detail, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 flex-shrink-0"></span>
                                    <span className="break-all">{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Specific Key Findings */}
                        {state.analysis.step2.userFriendly.keyFindings && 
                         state.analysis.step2.userFriendly.keyFindings.length > 0 && (
                          <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                            <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                              <Flag className="w-4 h-4" />
                              What We Found
                            </h3>
                            <ul className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.keyFindings.map((finding, index) => (
                                <li key={index} className="text-purple-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="break-all">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Enhanced Actions Based on Research */}
                        {state.analysis.step2.userFriendly.recommendedActions && 
                         state.analysis.step2.userFriendly.recommendedActions.length > 0 && (
                          <div className={`border rounded-lg p-4 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'border-red-100 bg-red-50' :
                            'border-green-100 bg-green-50'
                          }`}>
                            <h3 className={`font-medium mb-3 flex items-center gap-2 ${
                              state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'text-red-900' :
                              'text-green-900'
                            }`}>
                              <CheckSquare className="w-4 h-4" />
                              Based on Our Research
                            </h3>
                            <ol className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.recommendedActions.map((action, index) => (
                                <li key={index} className={`flex items-start gap-3 ${
                                  state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'text-red-800' :
                                  'text-green-800'
                                }`}>
                                  <span className={`w-6 h-6 text-white rounded text-xs flex items-center justify-center mt-0.5 flex-shrink-0 font-medium ${
                                    state.analysis.step2.userFriendly.verificationStatus === 'FRAUD_ALERTS_FOUND' ? 'bg-red-600' :
                                    'bg-green-600'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  <span className="break-all">{action}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Specific Official Sources */}
                        {state.analysis.step2.userFriendly.officialSources && 
                         state.analysis.step2.userFriendly.officialSources.length > 0 && (
                          <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              How to Verify Independently
                            </h3>
                            <ul className="space-y-1 text-sm">
                              {state.analysis.step2.userFriendly.officialSources.map((source, index) => (
                                <li key={index} className="text-blue-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="break-all">{source}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Raw Research Sections (Expandable) */}
                        {state.analysis.step2.userFriendly.rawResearchSections && 
                         state.analysis.step2.userFriendly.rawResearchSections.length > 0 && (
                          <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Detailed Research Data
                            </h3>
                            <div className="space-y-4">
                              {state.analysis.step2.userFriendly.rawResearchSections.map((section, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded p-3">
                                  <h4 className="font-medium text-gray-800 mb-2 text-sm">{section.title}</h4>
                                  <div className="bg-gray-50 border border-gray-100 rounded p-2 max-h-32 overflow-y-auto">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                      {section.content}
                                    </pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Technical Details Toggle */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => dispatch({ type: 'TOGGLE_TECHNICAL_DETAILS' })}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {state.ui.showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                  </button>
                  
                  {state.ui.showTechnicalDetails && (
                    <div className="mt-4 space-y-4">
                      {/* Original Technical Results */}
                      <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Raw Analysis Data</h4>
                        <div className="text-xs text-gray-700 space-y-2">
                          <div><strong>Category:</strong> {state.analysis.step1.scamCategory}</div>
                          <div><strong>Observed:</strong> {state.analysis.step1.whatWeObserved}</div>
                          {state.analysis.step1.entitiesDetected && (
                            <div>
                              <strong>Entities Detected:</strong>
                              <ul className="ml-4 mt-1">
                                {state.analysis.step1.entitiesDetected.organizations && (
                                  <li>Organizations: {state.analysis.step1.entitiesDetected.organizations.join(', ')}</li>
                                )}
                                {state.analysis.step1.entitiesDetected.contacts && (
                                  <li>Contacts: {state.analysis.step1.entitiesDetected.contacts.join(', ')}</li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Research Raw Data */}
                      {state.analysis.step2 && state.analysis.step2.detailedFindings && (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Research Data</h4>
                          <div className="bg-white border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                              {state.analysis.step2.detailedFindings}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Trust Building Footer */}
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">🧠 You Did the Right Thing</h3>
                    <p className="text-sm text-blue-800">
                      Checking suspicious communications is always smart. Your instincts brought you here, 
                      and that shows you're being careful with your security.
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">🔒 Your Privacy is Protected</h3>
                    <p className="text-sm text-gray-700">
                      We analyzed your communication securely and don't store your personal information.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {state.ui.showReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Scam Analysis Report</h3>
              <button 
                onClick={() => dispatch({ type: 'SET_REPORT', payload: { show: false } })} 
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
                  Copy Report
                </button>
                <button 
                  onClick={() => dispatch({ type: 'SET_REPORT', payload: { show: false } })}
                  className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-all duration-200"
                >
                  Close
                </button>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">{state.reportText}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAllerna;