// components/AskAllerna.js
// Ask Allerna — Facts-first investigation UI
// Shows Discoveries (concrete facts) before any guidance. Neutral tone.

import React, { useReducer } from 'react';
import {
  Shield, Search, CheckCircle, AlertTriangle, RotateCcw, FileText, Eye, Flag,
  CheckSquare, Copy, ExternalLink, AlertCircle, Info, Loader2
} from 'lucide-react';

const initialState = {
  analysis: { step1: null, step2: null },
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

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    case 'START_ANALYSIS':
      return {
        ...state,
        ui: { ...state.ui, isAnalyzing: true, isAnalysisMode: true },
        error: null,
        analysisProgress: 0,
        analysis: { step1: null, step2: null },
      };
    case 'ANALYSIS_PROGRESS':
      return { ...state, analysisProgress: action.payload };
    case 'ANALYSIS_SUCCESS':
      return { ...state, analysis: { ...state.analysis, step1: action.payload }, ui: { ...state.ui, isAnalyzing: false }, analysisProgress: 100 };
    case 'START_RESEARCH':
      return { ...state, ui: { ...state.ui, isResearching: true }, researchStatus: action.payload || 'Starting verification…', researchProgress: 0 };
    case 'RESEARCH_PROGRESS':
      return { ...state, researchProgress: action.payload.progress, researchStatus: action.payload.status };
    case 'RESEARCH_SUCCESS':
      return { ...state, analysis: { ...state.analysis, step2: action.payload }, ui: { ...state.ui, isResearching: false }, researchProgress: 100, researchStatus: 'Verification complete' };
    case 'SET_ERROR':
      return { ...state, error: action.payload, ui: { ...state.ui, isAnalyzing: false, isResearching: false } };
    case 'TOGGLE_TECHNICAL_DETAILS':
      return { ...state, ui: { ...state.ui, showTechnicalDetails: !state.ui.showTechnicalDetails } };
    case 'SET_REPORT':
      return { ...state, reportText: action.payload.text ?? state.reportText, ui: { ...state.ui, showReport: action.payload.show } };
    case 'RESET':
      return { ...initialState, ui: { ...initialState.ui, isAnalysisMode: action.payload?.keepAnalysisMode || false } };
    case 'EXIT_ANALYSIS':
      return initialState;
    default:
      return state;
  }
}

// Tone / status colors (Tailwind-safe static classes)
const toneUI = (tone = 'REVIEW') => {
  switch (tone) {
    case 'CAUTION': return { panel: 'border-orange-200 bg-orange-50', title: 'text-orange-900', icon: 'text-orange-600', body: 'text-orange-800' };
    case 'CONSISTENT': return { panel: 'border-green-200 bg-green-50', title: 'text-green-900', icon: 'text-green-600', body: 'text-green-800' };
    default: return { panel: 'border-blue-200 bg-blue-50', title: 'text-blue-900', icon: 'text-blue-600', body: 'text-blue-800' };
  }
};
const statusUI = (s = 'RESEARCH_COMPLETED') => {
  switch (s) {
    case 'NEEDS_CONFIRMATION': return { panel: 'border-yellow-200 bg-yellow-50', title: 'text-yellow-900' };
    case 'MIXED_SIGNALS': return { panel: 'border-purple-200 bg-purple-50', title: 'text-purple-900' };
    case 'APPEARS_CONSISTENT': return { panel: 'border-green-200 bg-green-50', title: 'text-green-900' };
    default: return { panel: 'border-blue-200 bg-blue-50', title: 'text-blue-900' };
  }
};
const progressColor = (p) => (p < 50 ? 'bg-blue-500' : p < 80 ? 'bg-green-500' : 'bg-green-600');

export default function AskAllerna() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const analyze = async () => {
    if (!state.input.trim()) return;
    dispatch({ type: 'START_ANALYSIS' });

    let prog = 0;
    const iv = setInterval(() => {
      prog = Math.min(prog + 10, 90);
      dispatch({ type: 'ANALYSIS_PROGRESS', payload: prog });
      if (prog >= 90) clearInterval(iv);
    }, 300);

    try {
      const ctl = new AbortController();
      const tid = setTimeout(() => ctl.abort(), 60000);
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: state.input, analysisType: 'context' }),
        signal: ctl.signal,
      });
      clearInterval(iv);
      clearTimeout(tid);

      const data = await r.json();
      if (!r.ok) throw new Error(data?.userMessage || 'Analysis failed.');
      dispatch({ type: 'ANALYSIS_SUCCESS', payload: data });

      // Optional: auto-verify if notable signals present
      if (data.shouldAutoTrigger) setTimeout(() => deepResearch(data), 900);
    } catch (e) {
      clearInterval(iv);
      dispatch({ type: 'SET_ERROR', payload: e.name === 'AbortError' ? 'That took longer than usual. Please try again.' : e.message || 'We couldn’t finish the check.' });
    }
  };

  const deepResearch = async (step1Results) => {
    dispatch({ type: 'START_RESEARCH', payload: 'Starting verification…' });
    const steps = [
      { progress: 25, status: 'Looking for official references…' },
      { progress: 55, status: 'Comparing contact details…' },
      { progress: 85, status: 'Checking advisories with similar wording…' },
    ];
    steps.forEach((s, i) => setTimeout(() => dispatch({ type: 'RESEARCH_PROGRESS', payload: s }), (i + 1) * 1200));

    try {
      const ctl = new AbortController();
      const tid = setTimeout(() => ctl.abort(), 45000);
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident: state.input, analysisType: 'deep_research', step1Results: step1Results || state.analysis.step1 }),
        signal: ctl.signal,
      });
      clearTimeout(tid);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.userMessage || 'Verification failed.');
      dispatch({ type: 'RESEARCH_SUCCESS', payload: data });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.name === 'AbortError' ? 'We paused verification to keep things fast. The discoveries above are still useful.' : e.message || 'We couldn’t complete verification.' });
    }
  };

  const newAnalysis = () => dispatch({ type: 'RESET', payload: { keepAnalysisMode: true } });
  const exitAnalysis = () => dispatch({ type: 'EXIT_ANALYSIS' });

  const generateReport = () => {
    const ts = new Date().toLocaleString();
    const id = `ALR-${Date.now().toString().slice(-8)}`;
    const s1 = state.analysis.step1;
    const s2 = state.analysis.step2;

    const report = `ASK ALLERNA — INVESTIGATION REPORT
Generated: ${ts}
Report ID: ${id}

YOUR DESCRIPTION
${state.input}

PATTERN OBSERVED
${s1?.patternCategory || 'Not classified'}

SUMMARY
${s1?.userFriendly?.summary || 'Investigation highlights are below.'}

DISCOVERIES
${(s1?.discoveries || []).map(d => `• ${d.label}: ${d.value}${d.badge ? " (" + d.badge + ")" : ""}${d.note ? " — " + d.note : ""}`).join('\n') || '• No specific discoveries captured'}

CAUTION SIGNALS
${(s1?.signals?.caution || []).map(x => `• ${x}`).join('\n') || '• —'}

CONSISTENCY SIGNALS
${(s1?.signals?.consistent || []).map(x => `• ${x}`).join('\n') || '• —'}

EVIDENCE (QUOTED)
${(s1?.evidence || []).map(e => `• ${e.quote}`).join('\n') || '• —'}

WHAT TO DOUBLE-CHECK
${(s1?.userFriendly?.whatToDoubleCheck || []).map(x => `• ${x}`).join('\n') || '• Compare contacts on the official website.'}

INDEPENDENT VERIFICATION
${(s1?.userFriendly?.independentVerification || []).map(x => `• ${x}`).join('\n') || '• Call the organization using a number from its official site.'}

EDUCATIONAL TIPS
${(s1?.userFriendly?.helpfulTips || []).map(x => `• ${x}`).join('\n') || '• Take your time; pressure is a common tactic.'}

${s2?.researchConducted ? `
VERIFICATION SNAPSHOT
Status: ${s2?.verificationStatus || 'RESEARCH_COMPLETED'}

KEY TAKEAWAYS
${(s2?.userFriendly?.keyTakeaways || []).map(x => `• ${x}`).join('\n') || '• —'}

SOURCES TO REVIEW
${(s2?.userFriendly?.officialSources || []).map(x => `• ${x}`).join('\n') || '• —'}
` : ''}

DISCLAIMER
This report highlights discoveries and ways to verify through official channels. Avoid clicking links in unexpected messages.

— End of Report —`;

    dispatch({ type: 'SET_REPORT', payload: { text: report, show: true } });
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(state.reportText);
      alert('Report copied to clipboard.');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = state.reportText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Report copied to clipboard.');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Landing */}
      {!state.ui.isAnalysisMode && (
        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-5xl font-semibold text-gray-900 mb-4">Ask Allerna</h1>
            <p className="text-xl text-gray-600 mb-8">Facts first. Learn what to verify before you act.</p>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">Paste an email, text, or job pitch. We’ll extract concrete discoveries and show how to verify through official channels.</p>
          </div>

          <div className="mb-8">
            <label className="block text-lg font-medium text-gray-900 mb-4">Describe what you received (paste the message):</label>
            <textarea
              value={state.input}
              onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
              placeholder="Example: Email from dppj55445569@srtpluntan.xyz with a part-time TEMU review job, same-day payouts, WhatsApp +1 781 667 1374."
              className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
            {state.error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">We couldn’t finish the check</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={state.ui.isAnalyzing || !state.input.trim() || state.input.trim().length < 10}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg py-4 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Search className="w-5 h-5" />
              <span>Show Discoveries</span>
            </button>

            {state.input.trim().length > 0 && state.input.trim().length < 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">Please paste a bit more of the message so we can extract details.</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2 flex items-center gap-2"><span>🧭</span> We highlight facts you can check</h3>
              <p className="text-blue-800">Compare contacts and claims with official pages you find yourself.</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2"><span>🔒</span> Privacy</h3>
              <p className="text-gray-700">We don’t store your text. Avoid pasting passwords or codes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {state.ui.isAnalysisMode && (
        <div className="h-screen flex">
          {/* Left */}
          <div className="w-1/2 border-r border-gray-100 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-gray-900">Ask Allerna</span>
              </div>
              <div className="flex gap-2">
                <button onClick={newAnalysis} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  New Check
                </button>
                <button onClick={exitAnalysis} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                  Exit
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">What you pasted</h2>
              <textarea
                value={state.input}
                onChange={(e) => dispatch({ type: 'SET_INPUT', payload: e.target.value })}
                className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900"
              />
              <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-4">
                <div className="text-sm text-gray-600">We’ll keep this visible while showing discoveries on the right.</div>
              </div>
            </div>

            {state.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Something went wrong</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{state.error}</p>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* Step 1 loading */}
            {state.ui.isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Extracting discoveries</h3>
                <p className="text-gray-600 mb-4">Pulling contacts, claims, and exact quotes…</p>
                <div className="w-64 mx-auto bg-gray-200 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${progressColor(state.analysisProgress)}`} style={{ width: `${state.analysisProgress}%` }} />
                </div>
                <p className="text-sm text-gray-500">{state.analysisProgress}% complete</p>
              </div>
            )}

            {/* Step 2 loading */}
            {state.ui.isResearching && (
              <div className="mb-6 border border-blue-100 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <h3 className="font-medium text-blue-900">Independent verification in progress</h3>
                </div>
                <p className="text-blue-800 text-sm mb-3">{state.researchStatus}</p>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${state.researchProgress}%` }} />
                </div>
                <p className="text-xs text-blue-700">{state.researchProgress}% complete</p>
              </div>
            )}

            {/* Results */}
            {state.analysis.step1 && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      Discoveries
                    </h2>
                    <p className="text-sm text-gray-600">Concrete facts extracted from the message</p>
                  </div>
                  <div className="flex gap-2">
                    {!state.analysis.step1.shouldAutoTrigger && !state.analysis.step2 && !state.ui.isResearching && (
                      <button onClick={() => deepResearch(state.analysis.step1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200">
                        <Search className="w-4 h-4" />
                        Verify More
                      </button>
                    )}
                    <button onClick={generateReport} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-all duration-200">
                      <FileText className="w-4 h-4" />
                      Report
                    </button>
                  </div>
                </div>

                {/* Pattern & summary */}
                {(() => {
                  const ui = toneUI(state.analysis.step1.riskTone);
                  return (
                    <div className={`rounded-lg p-4 ${ui.panel}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className={`w-5 h-5 ${ui.icon}`} />
                        <h3 className={`font-medium ${ui.title}`}>Pattern detected: {state.analysis.step1.patternCategory}</h3>
                      </div>
                      <p className={`${ui.body} text-sm`}>{state.analysis.step1.userFriendly?.summary}</p>
                    </div>
                  );
                })()}

                {/* Discoveries Grid */}
                {state.analysis.step1.discoveries?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.analysis.step1.discoveries.map((d, i) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-3">
                        <div className="text-xs uppercase tracking-wide text-gray-500">{d.label}</div>
                        <div className="text-sm font-medium text-gray-900 break-words mt-0.5">
                          {d.value}
                          {d.badge && <span className="ml-2 inline-block text-xs px-2 py-0.5 rounded bg-gray-100 border border-gray-200">{d.badge}</span>}
                        </div>
                        {d.note && <div className="text-xs text-gray-600 mt-1">{d.note}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Signals */}
                {(state.analysis.step1.signals?.caution?.length > 0 || state.analysis.step1.signals?.consistent?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {state.analysis.step1.signals?.caution?.length > 0 && (
                      <div className="border border-yellow-100 bg-yellow-50 rounded-lg p-4">
                        <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Caution signals</h3>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {state.analysis.step1.signals.caution.map((x, i) => <li key={i} className="break-words">• {x}</li>)}
                        </ul>
                      </div>
                    )}
                    {state.analysis.step1.signals?.consistent?.length > 0 && (
                      <div className="border border-green-100 bg-green-50 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Consistency signals</h3>
                        <ul className="text-sm text-green-800 space-y-1">
                          {state.analysis.step1.signals.consistent.map((x, i) => <li key={i} className="break-words">• {x}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Evidence quotes */}
                {state.analysis.step1.evidence?.length > 0 && (
                  <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2"><Flag className="w-4 h-4" /> Evidence (quoted from the message)</h3>
                    <ul className="space-y-1 text-sm text-purple-800">
                      {state.analysis.step1.evidence.map((e, i) => (
                        <li key={i} className="break-words">“{e.quote}”</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verification (short, not preachy) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {state.analysis.step1.userFriendly?.whatToDoubleCheck?.length > 0 && (
                    <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> What to double-check</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {state.analysis.step1.userFriendly.whatToDoubleCheck.map((x, i) => <li key={i}>• {x}</li>)}
                      </ul>
                    </div>
                  )}
                  {state.analysis.step1.userFriendly?.independentVerification?.length > 0 && (
                    <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Independent verification</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        {state.analysis.step1.userFriendly.independentVerification.map((x, i) => <li key={i}>• {x}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Step 2 results */}
                {state.analysis.step2?.researchConducted && (
                  <div className="mt-8 space-y-6">
                    <div className="border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
                        <Search className="w-6 h-6 text-blue-600" />
                        Independent Verification
                      </h2>
                      <p className="text-sm text-gray-600">Short factual snapshot with sources (when available).</p>
                    </div>

                    {(() => {
                      const ui = statusUI(state.analysis.step2.verificationStatus);
                      return (
                        <div className={`rounded-lg p-4 border ${ui.panel}`}>
                          <h3 className={`font-medium mb-2 ${ui.title}`}>Snapshot: {state.analysis.step2.verificationStatus}</h3>
                          <p className="text-sm text-gray-800">{state.analysis.step2.userFriendly?.overview}</p>
                        </div>
                      );
                    })()}

                    {state.analysis.step2.userFriendly?.keyTakeaways?.length > 0 && (
                      <div className="border border-purple-100 bg-purple-50 rounded-lg p-4">
                        <h3 className="font-medium text-purple-900 mb-3 flex items-center gap-2"><Flag className="w-4 h-4" /> Key takeaways</h3>
                        <ul className="space-y-2 text-sm text-purple-800">
                          {state.analysis.step2.userFriendly.keyTakeaways.map((k, i) => <li key={i} className="break-words">• {k}</li>)}
                        </ul>
                      </div>
                    )}

                    {state.analysis.step2.userFriendly?.officialSources?.length > 0 && (
                      <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Sources to review</h3>
                        <ul className="space-y-1 text-sm text-blue-800">
                          {state.analysis.step2.userFriendly.officialSources.map((src, i) => <li key={i} className="break-all">• {src}</li>)}
                        </ul>
                      </div>
                    )}

                    {state.analysis.step2.detailedFindings && (
                      <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Research notes (raw)</h4>
                        <div className="bg-white border border-gray-200 rounded p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{state.analysis.step2.detailedFindings}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Technical details toggle (entities) */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => dispatch({ type: 'TOGGLE_TECHNICAL_DETAILS' })} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {state.ui.showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                  </button>
                  {state.ui.showTechnicalDetails && (
                    <div className="mt-4 space-y-4">
                      <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Extracted entities</h4>
                        <div className="text-xs text-gray-700 space-y-2">
                          <div><strong>Emails:</strong> {state.analysis.step1.entities?.emailAddresses?.join(', ') || '—'}</div>
                          <div><strong>Domains:</strong> {state.analysis.step1.entities?.domains?.join(', ') || '—'}</div>
                          <div><strong>URLs:</strong> {state.analysis.step1.entities?.urls?.join(', ') || '—'}</div>
                          <div><strong>Phone numbers:</strong> {state.analysis.step1.entities?.phoneNumbers?.join(', ') || '—'}</div>
                          <div><strong>WhatsApp:</strong> {state.analysis.step1.entities?.whatsappNumbers?.join(', ') || '—'}</div>
                          <div><strong>Amounts:</strong> {state.analysis.step1.entities?.amounts?.join(', ') || '—'}</div>
                          <div><strong>Ages:</strong> {state.analysis.step1.entities?.ages?.join(', ') || '—'}</div>
                          <div><strong>Brands:</strong> {state.analysis.step1.entities?.brands?.join(', ') || '—'}</div>
                          <div><strong>Companies:</strong> {state.analysis.step1.entities?.companies?.join(', ') || '—'}</div>
                        </div>
                      </div>
                    </div>
                  )}
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
              <h3 className="text-lg font-medium">Investigation Report</h3>
              <button onClick={() => dispatch({ type: 'SET_REPORT', payload: { show: false } })} className="text-white hover:text-gray-200 text-xl font-medium">×</button>
            </div>
            <div className="p-6">
              <div className="mb-4 flex gap-2">
                <button onClick={copyReport} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-2 transition-all duration-200">
                  <Copy className="w-4 h-4" />
                  Copy Report
                </button>
                <button onClick={() => dispatch({ type: 'SET_REPORT', payload: { show: false } })} className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded-lg transition-all duration-200">
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
}
