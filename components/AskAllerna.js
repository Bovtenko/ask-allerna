// components/AskAllerna.js - Complete Overhaul for Research-First Logic

import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { Shield, Send, Search, Clock, CheckCircle, AlertTriangle, RotateCcw, FileText, Eye, Flag, CheckSquare, Building, Users, TrendingUp, Copy, ExternalLink, Loader, X, AlertCircle, Info, Brain, Target, Zap } from 'lucide-react';

// Updated state management for new data structure
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
        researchStatus: action.payload || 'Starting investigation...',
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
        researchStatus: 'Investigation complete'
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

  // Main analysis function with updated error handling
  const analyzeIncident = async () => {
    if (!state.input.trim()) return;
    
    dispatch({ type: 'START_ANALYSIS' });
    
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

  // Deep research function with updated progress tracking
  const runDeepResearch = async (step1Results) => {
    dispatch({ type: 'START_RESEARCH', payload: 'Starting comprehensive investigation...' });
    
    // Updated research progress steps
    const progressSteps = [
      { progress: 20, status: 'Verifying sender identity...' },
      { progress: 40, status: 'Checking contact methods...' },
      { progress: 60, status: 'Analyzing threat patterns...' },
      { progress: 80, status: 'Cross-referencing databases...' }
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
      let userMessage = 'Unable to complete investigation right now.';
      
      if (error.name === 'AbortError') {
        userMessage = 'Investigation took too long. The basic analysis is complete and reliable.';
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

  // Generate enhanced user-friendly report with new structure
  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportId = `ALR-${Date.now().toString().slice(-8)}`;
    const analysis = state.analysis.step1;
    const research = state.analysis.step2;

    let researchSection = '';
    if (research?.researchConducted && research?.userFriendly) {
      researchSection = `
INVESTIGATION RESULTS:
Status: ${research.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? '⚠️ HIGH RISK DETECTED - Do not proceed' :
  research.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? '✅ Communication appears legitimate' :
  research.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? '⚠️ MODERATE RISK - Exercise extreme caution' :
  research.userFriendly.verificationStatus === 'SOME_CONCERNS_DETECTED' ? '🔍 Some concerns detected - verify carefully' :
  '✓ Investigation completed'}

CRITICAL FINDINGS:
${research.userFriendly.criticalFindings?.map(finding => `• ${finding}`).join('\n') || 'No critical issues detected'}

INVESTIGATION SUMMARY:
${research.userFriendly.verificationSummary || 'Investigation completed successfully'}

RECOMMENDED ACTIONS:
${research.userFriendly.recommendedActions?.map(action => `• ${action}`).join('\n') || 'Standard verification recommended'}

OFFICIAL VERIFICATION SOURCES:
${research.userFriendly.officialSources?.map(source => `• ${source}`).join('\n') || 'Use official channels'}`;
    }

    const report = `ASK ALLERNA COMMUNICATION ANALYSIS REPORT
Generated: ${timestamp}
Report ID: ${reportId}

COMMUNICATION ANALYZED:
${state.input}

BEHAVIOR ANALYSIS:
Communication Type: ${analysis?.userFriendly?.scamType || 'Unknown'}
Risk Level: ${analysis?.userFriendly?.riskLevel || 'Unknown'}
Summary: ${analysis?.userFriendly?.summary || 'Analysis completed'}

TACTICS OBSERVED:
${analysis?.userFriendly?.tacticsObserved?.map(tactic => `• ${tactic}`).join('\n') || 'No specific tactics identified'}

REQUESTS MADE:
${analysis?.userFriendly?.requestsMade?.map(request => `• ${request}`).join('\n') || 'No specific requests identified'}

WARNING SIGNS:
${analysis?.userFriendly?.mainConcerns?.map(concern => `• ${concern}`).join('\n') || 'No specific concerns identified'}

RECOMMENDED ACTIONS:
${analysis?.userFriendly?.nextSteps?.map(step => `• ${step}`).join('\n') || 'No specific actions recommended'}

VERIFICATION METHODS:
${analysis?.userFriendly?.howToCheck?.map(method => `• ${method}`).join('\n') || 'Contact through official channels'}

${researchSection}

---
Trust your instincts. If something feels suspicious, investigate further.
Report generated by Ask Allerna - AI-Powered Communication Analysis`;

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
      {/* Landing Page */}
      {!state.ui.isAnalysisMode && (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">Ask Allerna</h1>
            <p className="text-xl text-gray-600 mb-8">Is This Communication Suspicious?</p>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Get instant analysis of suspicious emails, texts, calls, job offers, and other communications
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-900 mb-4">
              Paste the suspicious communication or describe what happened:
            </label>
            <textarea
              value={state.input}
              onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
              placeholder="For example, paste the email you received, or describe: 'I got a call from someone claiming to be from Microsoft saying my computer has a virus'"
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
              <Brain className="w-5 h-5" />
              <span>Analyze Communication</span>
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
                Smart Detection
              </h3>
              <p className="text-blue-800">
                Our AI analyzes communication patterns, verifies sender identity, and checks against current threat intelligence.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                <span>🔒</span>
                Privacy Protected
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
                  New Analysis
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
                <h2 className="text-lg font-medium text-gray-900 mb-4">Communication Being Analyzed</h2>
                
                <textarea
                  value={state.input}
                  onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
                  placeholder="Paste the communication or describe what happened..."
                  className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
                />

                <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    Analysis in progress - results will show patterns and behaviors detected
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
                  Analyzing Communication
                </h3>
                <p className="text-gray-600 mb-4">
                  Detecting patterns, behaviors, and potential risks...
                </p>
                
                {/* Progress bar */}
                <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(state.analysisProgress)}`}
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
                  <Target className="w-5 h-5 text-blue-600 animate-pulse" />
                  <h3 className="font-medium text-blue-900">Conducting Investigation</h3>
                </div>
                <p className="text-blue-800 text-sm mb-3">{state.researchStatus}</p>
                
                {/* Research progress bar */}
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div 
                    className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${state.researchProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-700">{state.researchProgress}% complete</p>
              </div>
            )}

            {/* Analysis Results - Updated for New Structure */}
            {state.analysis.step1 && (
              <div className="space-y-6">
                
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Analysis Complete
                    </h2>
                    <p className="text-sm text-gray-600">Behavior and pattern analysis results</p>
                  </div>
                  <div className="flex gap-2">
                    {!state.analysis.step1.shouldAutoTrigger && !state.analysis.step2 && !state.ui.isResearching && (
                      <button 
                        onClick={() => runDeepResearch(state.analysis.step1)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200"
                      >
                        <Search className="w-4 h-4" />
                        Investigate
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

                {/* Main Results - Behavior-Based Analysis */}
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

                    {/* Tactics Observed */}
                    {state.analysis.step1.userFriendly.tacticsObserved && state.analysis.step1.userFriendly.tacticsObserved.length > 0 && (
                      <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                        <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                          <Zap className="w-4 h-4" />
                          Tactics Detected
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {state.analysis.step1.userFriendly.tacticsObserved.map((tactic, index) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                              {tactic.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Requests Made */}
                    {state.analysis.step1.userFriendly.requestsMade && state.analysis.step1.userFriendly.requestsMade.length > 0 && (
                      <div className="border border-orange-100 bg-orange-50 rounded-lg p-4">
                        <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Information Requests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {state.analysis.step1.userFriendly.requestsMade.map((request, index) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                              {request.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Warning Signs */}
                    {state.analysis.step1.userFriendly.mainConcerns && state.analysis.step1.userFriendly.mainConcerns.length > 0 && (
                      <div className="border border-red-100 bg-red-50 rounded-lg p-4">
                        <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Warning Signs Detected
                        </h3>
                        <ul className="space-y-1 text-sm">
                          {state.analysis.step1.userFriendly.mainConcerns.map((concern, index) => (
                            <li key={index} className="text-red-800 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                              {concern}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* What to Do */}
                    {state.analysis.step1.userFriendly.nextSteps && state.analysis.step1.userFriendly.nextSteps.length > 0 && (
                      <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          Recommended Actions
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
                    {state.analysis.step1.userFriendly.howToCheck && state.analysis.step1.userFriendly.howToCheck.length > 0 && (
                      <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Verification Methods
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

                {/* Enhanced Research Results - Updated for New Structure */}
                {state.analysis.step2 && state.analysis.step2.researchConducted && (
                  <div className="mt-8 space-y-6">
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Search className="w-6 h-6 text-blue-600" />
                        Investigation Results
                      </h2>
                      <p className="text-sm text-gray-600">Comprehensive verification and threat intelligence</p>
                    </div>

                    {state.analysis.step2.userFriendly && (
                      <>
                        {/* Enhanced Verification Status */}
                        <div className={`border rounded-lg p-4 ${
                          state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'border-red-200 bg-red-50' :
                          state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'border-green-200 bg-green-50' :
                          state.analysis.step2.userFriendly.verificationStatus === 'SOME_CONCERNS_DETECTED' ? 'border-yellow-200 bg-yellow-50' :
                          state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'border-orange-200 bg-orange-50' :
                          'border-blue-200 bg-blue-50'
                        }`}>
                          <h3 className={`font-medium mb-3 flex items-center gap-2 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'text-red-900' :
                            state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'text-green-900' :
                            state.analysis.step2.userFriendly.verificationStatus === 'SOME_CONCERNS_DETECTED' ? 'text-yellow-900' :
                            state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'text-orange-900' :
                            'text-blue-900'
                          }`}>
                            {state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' && (
                              <>
                                <AlertTriangle className="w-5 h-5" />
                                ⚠️ HIGH RISK DETECTED
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' && (
                              <>
                                <CheckCircle className="w-5 h-5" />
                                ✅ Communication Verified Legitimate
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'SOME_CONCERNS_DETECTED' && (
                              <>
                                <AlertCircle className="w-5 h-5" />
                                🔍 Some Concerns Detected
                              </>
                            )}
                            {state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' && (
                              <>
                                <AlertTriangle className="w-5 h-5" />
                                ⚠️ MODERATE RISK DETECTED
                              </>
                            )}
                            {!['HIGH_RISK_DETECTED', 'VERIFIED_LEGITIMATE', 'SOME_CONCERNS_DETECTED', 'MODERATE_RISK_DETECTED'].includes(state.analysis.step2.userFriendly.verificationStatus) && (
                              <>
                                <Info className="w-5 h-5" />
                                ✓ Investigation Completed
                              </>
                            )}
                          </h3>
                          
                          <p className={`text-sm mb-3 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'text-red-800' :
                            state.analysis.step2.userFriendly.verificationStatus === 'VERIFIED_LEGITIMATE' ? 'text-green-800' :
                            state.analysis.step2.userFriendly.verificationStatus === 'SOME_CONCERNS_DETECTED' ? 'text-yellow-800' :
                            state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'text-orange-800' :
                            'text-blue-800'
                          }`}>
                            {state.analysis.step2.userFriendly.verificationSummary || 'Investigation completed'}
                          </p>
                        </div>

                        {/* Critical Findings */}
                        {state.analysis.step2.userFriendly.criticalFindings && 
                         state.analysis.step2.userFriendly.criticalFindings.length > 0 && (
                          <div className="border border-red-100 bg-red-50 rounded-lg p-4">
                            <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                              <Flag className="w-4 h-4" />
                              Critical Findings
                            </h3>
                            <ul className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.criticalFindings.map((finding, index) => (
                                <li key={index} className="text-red-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="break-all">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {state.analysis.step2.userFriendly.riskFactors && 
                         state.analysis.step2.userFriendly.riskFactors.length > 0 && (
                          <div className="border border-orange-100 bg-orange-50 rounded-lg p-4">
                            <h3 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Risk Factors
                            </h3>
                            <ul className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.riskFactors.map((factor, index) => (
                                <li key={index} className="text-orange-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="break-all">{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Legitimacy Indicators */}
                        {state.analysis.step2.userFriendly.legitimacyIndicators && 
                         state.analysis.step2.userFriendly.legitimacyIndicators.length > 0 && (
                          <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                            <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Legitimacy Indicators
                            </h3>
                            <ul className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.legitimacyIndicators.map((indicator, index) => (
                                <li key={index} className="text-green-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="break-all">{indicator}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Investigation-Based Actions */}
                        {state.analysis.step2.userFriendly.recommendedActions && 
                         state.analysis.step2.userFriendly.recommendedActions.length > 0 && (
                          <div className={`border rounded-lg p-4 ${
                            state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'border-red-100 bg-red-50' :
                            state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'border-orange-100 bg-orange-50' :
                            'border-green-100 bg-green-50'
                          }`}>
                            <h3 className={`font-medium mb-3 flex items-center gap-2 ${
                              state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'text-red-900' :
                              state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'text-orange-900' :
                              'text-green-900'
                            }`}>
                              <CheckSquare className="w-4 h-4" />
                              Investigation-Based Recommendations
                            </h3>
                            <ol className="space-y-2 text-sm">
                              {state.analysis.step2.userFriendly.recommendedActions.map((action, index) => (
                                <li key={index} className={`flex items-start gap-3 ${
                                  state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'text-red-800' :
                                  state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'text-orange-800' :
                                  'text-green-800'
                                }`}>
                                  <span className={`w-6 h-6 text-white rounded text-xs flex items-center justify-center mt-0.5 flex-shrink-0 font-medium ${
                                    state.analysis.step2.userFriendly.verificationStatus === 'HIGH_RISK_DETECTED' ? 'bg-red-600' :
                                    state.analysis.step2.userFriendly.verificationStatus === 'MODERATE_RISK_DETECTED' ? 'bg-orange-600' :
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

                        {/* Official Verification Sources */}
                        {state.analysis.step2.userFriendly.officialSources && 
                         state.analysis.step2.userFriendly.officialSources.length > 0 && (
                          <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              Official Verification Sources
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
                      {/* Behavior Analysis Data */}
                      <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Behavior Analysis Data</h4>
                        <div className="text-xs text-gray-700 space-y-2">
                          {state.analysis.step1.behaviorAnalysis && (
                            <>
                              <div><strong>Impersonation Type:</strong> {state.analysis.step1.behaviorAnalysis.impersonationType}</div>
                              <div><strong>Tactics:</strong> {state.analysis.step1.behaviorAnalysis.tacticsUsed?.join(', ')}</div>
                              <div><strong>Requests:</strong> {state.analysis.step1.behaviorAnalysis.requestsMade?.join(', ')}</div>
                              <div><strong>Red Flags:</strong> {state.analysis.step1.behaviorAnalysis.redFlags?.join(', ')}</div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sender Entities Data */}
                      {state.analysis.step1.communicationAnalysis?.senderEntities && (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Sender Entities Detected</h4>
                          <div className="text-xs text-gray-700 space-y-2">
                            {state.analysis.step1.communicationAnalysis.senderEntities.organizations && (
                              <div><strong>Organizations:</strong> {state.analysis.step1.communicationAnalysis.senderEntities.organizations.join(', ')}</div>
                            )}
                            {state.analysis.step1.communicationAnalysis.senderEntities.contactMethods?.emails && (
                              <div><strong>Emails:</strong> {state.analysis.step1.communicationAnalysis.senderEntities.contactMethods.emails.join(', ')}</div>
                            )}
                            {state.analysis.step1.communicationAnalysis.senderEntities.contactMethods?.domains && (
                              <div><strong>Domains:</strong> {state.analysis.step1.communicationAnalysis.senderEntities.contactMethods.domains.join(', ')}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Research Raw Data */}
                      {state.analysis.step2 && state.analysis.step2.detailedFindings && (
                        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Investigation Raw Data</h4>
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
                    <h3 className="font-medium text-blue-900 mb-2">🧠 Smart Analysis Complete</h3>
                    <p className="text-sm text-blue-800">
                      Our AI analyzed communication patterns, verified entities, and checked current threat intelligence 
                      to provide you with actionable insights.
                    </p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">🔒 Privacy Protected</h3>
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
              <h3 className="text-lg font-medium">Communication Analysis Report</h3>
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