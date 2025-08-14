import React, { useState } from 'react';
import { AlertTriangle, Send, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

const AskAllerna = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeIncident = async () => {
    if (!input.trim()) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const prompt = `You are an expert cybersecurity analyst. Analyze this potential security incident against social engineering patterns.

IMPORTANT: You MUST respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON. Your entire response should be parseable JSON.

INCIDENT: ${input}

CRITICAL: For ANY suspicious activity, the FIRST recommendation must ALWAYS be to report to IT security/company security team immediately. This is the most important step in incident response.

Respond with this exact JSON format:
{
  "threatLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE",
  "incidentType": "string describing the type of threat",
  "riskScore": number between 0-100,
  "immediateAction": "string with immediate action needed",
  "redFlags": ["array", "of", "warning", "signs", "detected"],
  "explanation": "detailed explanation of the analysis",
  "nextSteps": ["ALWAYS start with: Report this incident to your IT security team or designated security personnel immediately", "other", "specific", "actions", "to", "take"]
}

DO NOT output anything other than valid JSON. Your response must start with { and end with }.`;

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis({
        threatLevel: "ERROR",
        incidentType: "Analysis Failed",
        riskScore: 0,
        immediateAction: "Try again or contact support",
        redFlags: ["System temporarily unavailable"],
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
      'ERROR': 'text-gray-600 bg-gray-100'
    };
    return colors[level] || 'text-gray-600 bg-gray-100';
  };

  const getThreatIcon = (level) => {
    if (level === 'CRITICAL' || level === 'HIGH') return <XCircle className="w-5 h-5" />;
    if (level === 'MEDIUM') return <AlertTriangle className="w-5 h-5" />;
    if (level === 'LOW') return <Clock className="w-5 h-5" />;
    if (level === 'SAFE') return <CheckCircle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  const clearAnalysis = () => {
    setInput('');
    setAnalysis(null);
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
            <button
              onClick={clearAnalysis}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              New Analysis
            </button>
          </div>

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