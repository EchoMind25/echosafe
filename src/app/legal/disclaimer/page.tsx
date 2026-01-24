'use client'

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Scale, Shield } from 'lucide-react'
import { LegalDisclaimer, UserObligations } from '@/components/legal'

export default function FullDisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Legal Banner */}
      <LegalDisclaimer variant="sticky" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 pb-24">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <Scale className="w-10 h-10 text-red-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Legal Disclaimer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please read this entire document carefully before using Echo Safe.
            This information affects your legal rights and obligations.
          </p>
        </div>

        {/* Full Disclaimer */}
        <div className="mb-12">
          <LegalDisclaimer variant="full" context="general" />
        </div>

        {/* Additional Legal Sections */}
        <div className="space-y-8">
          {/* What Echo Safe Is */}
          <section className="bg-white border-2 border-gray-300 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Shield className="w-6 h-6 text-teal-600" />
              What Echo Safe Is
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                Echo Safe is a <strong>data checking tool</strong> that compares phone numbers
                against publicly available Do Not Call (DNC) registry data from the Federal
                Trade Commission (FTC) and other public sources.
              </p>
              <p>
                We provide:
              </p>
              <ul>
                <li>Phone number lookups against FTC DNC registry data</li>
                <li>AI-generated pattern analysis (informational only)</li>
                <li>Lead storage and management tools (CRM)</li>
                <li>Audit logs documenting our data checks</li>
              </ul>
            </div>
          </section>

          {/* What Echo Safe Is NOT */}
          <section className="bg-red-50 border-2 border-red-400 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-700" />
              What Echo Safe Is NOT
            </h2>
            <div className="prose prose-lg max-w-none text-red-900">
              <p className="font-semibold">
                Echo Safe is NOT any of the following:
              </p>
              <ul>
                <li><strong>NOT</strong> a law firm or legal service provider</li>
                <li><strong>NOT</strong> an attorney or source of legal advice</li>
                <li><strong>NOT</strong> a compliance solution or compliance guarantee</li>
                <li><strong>NOT</strong> a substitute for professional legal counsel</li>
                <li><strong>NOT</strong> responsible for your TCPA compliance</li>
                <li><strong>NOT</strong> liable for any calling activities you perform</li>
                <li><strong>NOT</strong> a guarantee of data accuracy or completeness</li>
              </ul>
            </div>
          </section>

          {/* Data Accuracy Limitations */}
          <section className="bg-blue-50 border-2 border-blue-400 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              Data Accuracy Limitations
            </h2>
            <div className="prose prose-lg max-w-none text-blue-900">
              <p>
                Our data comes from publicly available sources including the FTC National
                Do Not Call Registry. You acknowledge and understand that:
              </p>
              <ul>
                <li>Data may be <strong>incomplete</strong> - not all DNC registrations are captured</li>
                <li>Data may be <strong>outdated</strong> - registrations change in real-time</li>
                <li>Data may be <strong>inaccurate</strong> - public sources contain errors</li>
                <li>State DNC lists have <strong>varying update frequencies</strong></li>
                <li>Numbers can be <strong>added or removed</strong> without our knowledge</li>
                <li>We <strong>cannot guarantee</strong> 100% accuracy or completeness</li>
              </ul>
              <p className="font-bold mt-4">
                YOU MUST independently verify all information before making any calls.
              </p>
            </div>
          </section>

          {/* AI-Generated Content */}
          <section className="bg-purple-50 border-2 border-purple-400 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">
              AI-Generated Content Disclaimer
            </h2>
            <div className="prose prose-lg max-w-none text-purple-900">
              <p>
                Echo Safe uses artificial intelligence to generate risk analysis and insights.
                You understand and agree that:
              </p>
              <ul>
                <li>AI-generated content is <strong>informational only</strong></li>
                <li>AI output does NOT constitute legal advice or recommendations</li>
                <li>AI analysis is based on patterns in public data, not legal expertise</li>
                <li>AI may produce errors, inaccuracies, or incomplete analysis</li>
                <li>You should NOT rely on AI output as a substitute for legal counsel</li>
                <li>AI-generated risk scores are estimates, not compliance determinations</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-gray-100 border-2 border-gray-400 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Limitation of Liability
            </h2>
            <div className="prose prose-lg max-w-none text-gray-700">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul>
                <li>Echo Safe is provided &quot;AS IS&quot; without warranties of any kind</li>
                <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                <li>We are NOT liable for any direct, indirect, incidental, consequential, or punitive damages</li>
                <li>We are NOT liable for TCPA violations, fines, or penalties resulting from your use of our service</li>
                <li>Our total liability shall not exceed the amount you paid for the service in the 12 months preceding any claim</li>
              </ul>
            </div>
          </section>

          {/* User Obligations */}
          <div className="mt-12">
            <UserObligations />
          </div>

          {/* Contact */}
          <section className="bg-white border-2 border-gray-300 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About These Terms?
            </h2>
            <p className="text-gray-600 mb-6">
              If you have questions about this disclaimer or need clarification,
              please contact us before using the service.
            </p>
            <a
              href="mailto:legal@echosafe.app"
              className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Contact Legal Team
            </a>
          </section>
        </div>

        {/* Last Updated */}
        <p className="text-center text-sm text-gray-500 mt-12">
          Last Updated: January 2026
        </p>
      </main>
    </div>
  )
}
