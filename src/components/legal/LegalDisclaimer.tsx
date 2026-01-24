'use client'

import { AlertTriangle } from 'lucide-react'

interface LegalDisclaimerProps {
  variant?: 'full' | 'compact' | 'inline' | 'sticky'
  context?: 'ai-insights' | 'results' | 'general' | 'signup'
  className?: string
}

export function LegalDisclaimer({
  variant = 'full',
  context = 'general',
  className = ''
}: LegalDisclaimerProps) {

  // Sticky footer disclaimer (appears on every page)
  if (variant === 'sticky') {
    return (
      <div className={`fixed bottom-0 left-0 right-0 bg-yellow-50 border-t-2 border-yellow-500 p-2 text-center z-50 ${className}`}>
        <p className="text-xs font-semibold text-yellow-900">
          ⚠️ DATA TOOL ONLY - NOT LEGAL ADVICE - NOT COMPLIANCE SOFTWARE -
          USER SOLELY RESPONSIBLE FOR TCPA COMPLIANCE - CONSULT ATTORNEY
        </p>
      </div>
    )
  }

  // Inline compact warning
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg ${className}`}>
        <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-900">
          <strong>Not Legal Advice:</strong> Echo Safe is a data tool. We are NOT attorneys.
          You remain solely responsible for TCPA compliance. Consult a qualified attorney.
        </p>
      </div>
    )
  }

  // Compact card
  if (variant === 'compact') {
    return (
      <div className={`p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm">
            <p className="font-bold text-yellow-900">⚠️ CRITICAL DISCLAIMER</p>
            <p className="text-yellow-800">
              Echo Safe is a DATA CHECKING TOOL. We are NOT attorneys and do NOT
              provide legal advice or compliance services. You are SOLELY responsible
              for compliance with TCPA and all telemarketing laws.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Full disclaimer (default)
  return (
    <div className={`border-4 border-yellow-500 bg-white rounded-xl shadow-lg p-8 ${className}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-yellow-700" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              ⚠️ CRITICAL LEGAL DISCLAIMER
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              READ CAREFULLY - THIS AFFECTS YOUR LEGAL OBLIGATIONS
            </p>
          </div>
        </div>

        {/* Main disclaimer */}
        <div className="space-y-4 text-sm">
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
            <p className="font-bold text-red-900 mb-2">
              Echo Safe is a DATA TOOL, NOT a compliance solution or legal service.
            </p>
            <p className="text-red-800">
              We check phone numbers against public DNC registries. That&apos;s ALL we do.
              We do NOT guarantee compliance with any law. We are NOT attorneys.
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-gray-900">You understand and agree that:</p>

            <ul className="space-y-2 ml-6">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  We are <strong className="text-gray-900">NOT attorneys</strong> and do
                  <strong className="text-gray-900"> NOT provide legal advice</strong>
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  You are <strong className="text-gray-900">SOLELY RESPONSIBLE</strong> for
                  compliance with TCPA, TSR, and all federal/state telemarketing laws
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  Our data comes from public sources and may be
                  <strong className="text-gray-900"> incomplete, outdated, or inaccurate</strong>
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  You MUST <strong className="text-gray-900">verify all information independently</strong> before
                  making calls
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  AI-generated insights are <strong className="text-gray-900">informational only</strong>,
                  not legal counsel
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  You will <strong className="text-gray-900">consult a qualified attorney</strong> regarding
                  your compliance obligations
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span className="text-gray-700">
                  Using this tool does <strong className="text-gray-900">NOT guarantee compliance</strong> with
                  any law
                </span>
              </li>
            </ul>
          </div>

          {context === 'ai-insights' && (
            <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-400 rounded-lg">
              <p className="font-bold text-purple-900 mb-2">AI-Generated Content Notice:</p>
              <p className="text-purple-800 text-sm">
                The analysis above is generated by artificial intelligence based on public
                data patterns. It is INFORMATIONAL ONLY and does NOT constitute legal advice,
                compliance guidance, or recommendations. Do not rely on AI output as a substitute
                for legal counsel.
              </p>
            </div>
          )}

          {context === 'results' && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg">
              <p className="font-bold text-blue-900 mb-2">Data Accuracy Limitations:</p>
              <p className="text-blue-800 text-sm">
                We use publicly available data from the FTC and other sources. DNC registries
                are updated dynamically and may change between our updates. Numbers may be
                added or removed without our knowledge. We cannot guarantee 100% accuracy,
                completeness, or currency. ALWAYS verify independently before making calls.
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-red-100 border-2 border-red-500 rounded-lg">
            <p className="font-bold text-red-900 mb-2">⚠️ Penalty Warning:</p>
            <p className="text-red-900 text-sm">
              TCPA violations carry penalties of <strong>$500-$1,500 PER CALL</strong>.
              A single mistake can cost tens of thousands of dollars. You are personally
              liable for your calling activities. Consult an attorney BEFORE making calls.
            </p>
          </div>
        </div>

        {/* Footer links */}
        <div className="pt-4 border-t-2 border-gray-300 flex flex-col sm:flex-row gap-3 justify-between items-start">
          <a
            href="/legal/full-disclaimer"
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold underline"
          >
            Read Complete Legal Disclaimer →
          </a>
          <a
            href="/legal/user-obligations"
            className="text-sm text-teal-600 hover:text-teal-700 font-semibold underline"
          >
            Your Legal Obligations →
          </a>
        </div>
      </div>
    </div>
  )
}

export default LegalDisclaimer
