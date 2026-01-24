'use client'

import Link from 'next/link'
import { ArrowLeft, Scale, AlertTriangle, CheckCircle } from 'lucide-react'
import { LegalDisclaimer, UserObligations } from '@/components/legal'

export default function UserObligationsPage() {
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
            Your Legal Obligations
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Understanding your responsibilities under TCPA and federal telemarketing law.
            This page does NOT constitute legal advice. Consult an attorney.
          </p>
        </div>

        {/* Critical Warning */}
        <div className="bg-red-50 border-4 border-red-500 rounded-xl p-8 mb-12">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-12 h-12 text-red-700 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-4">
                YOU Are Responsible for TCPA Compliance
              </h2>
              <p className="text-red-800 text-lg mb-4">
                Using Echo Safe does NOT make you compliant. Using Echo Safe does NOT
                transfer any legal responsibility to us. You are 100% personally liable
                for every call you make.
              </p>
              <p className="text-red-900 font-bold">
                Violations: $500-$1,500 PER CALL. One batch of 1,000 violations can
                result in $500,000 - $1,500,000 in penalties.
              </p>
            </div>
          </div>
        </div>

        {/* User Obligations Component */}
        <div className="mb-12">
          <UserObligations />
        </div>

        {/* TCPA Overview */}
        <section className="bg-white border-2 border-gray-300 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What is TCPA?
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              The Telephone Consumer Protection Act (TCPA) is a federal law that restricts
              telemarketing calls, auto-dialed calls, prerecorded calls, text messages,
              and unsolicited faxes.
            </p>
            <p>
              Key provisions include:
            </p>
            <ul>
              <li>Prohibition on calls to numbers on the National Do Not Call Registry</li>
              <li>Requirements for prior express consent for certain calls</li>
              <li>Requirements for prior express WRITTEN consent for autodialed or prerecorded calls to mobile phones</li>
              <li>Time-of-day calling restrictions (8am-9pm in called party&apos;s time zone)</li>
              <li>Caller ID requirements</li>
              <li>Internal DNC list maintenance requirements</li>
            </ul>
          </div>
        </section>

        {/* What We DO vs DON&apos;T DO */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <section className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              What Echo Safe Does
            </h3>
            <ul className="space-y-3 text-green-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Check numbers against FTC DNC registry</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Provide AI-generated risk analysis (informational)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Store and manage your lead data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Maintain audit logs of OUR data checks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Update data daily from public sources</span>
              </li>
            </ul>
          </section>

          <section className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
            <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              What Echo Safe Does NOT Do
            </h3>
            <ul className="space-y-3 text-red-800">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Provide legal advice or compliance guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Guarantee TCPA compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Make calling decisions for you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Maintain YOUR call records (you must do this)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Accept liability for your violations</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Compliance Checklist */}
        <section className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-yellow-900 mb-6">
            Before You Call - Checklist
          </h2>
          <div className="space-y-4">
            {[
              'Have I verified this data independently?',
              'Have I consulted a TCPA compliance attorney?',
              'Do I have required consent for this number type?',
              'Am I calling within allowed hours (8am-9pm local time)?',
              'Is my caller ID accurate and not spoofed?',
              'Have I checked my internal DNC list?',
              'Have I checked state-specific DNC lists?',
              'Am I maintaining proper call records?',
              'Do I have a process for honoring opt-out requests?',
              'Am I prepared to stop calling immediately upon request?',
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 mt-0.5 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="text-yellow-900">{item}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-yellow-800 font-semibold">
            If you cannot check ALL boxes, do NOT make the call. Consult an attorney.
          </p>
        </section>

        {/* Resources */}
        <section className="bg-white border-2 border-gray-300 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Official Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.ftc.gov/legal-library/browse/rules/telemarketing-sales-rule"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">FTC Telemarketing Sales Rule</h3>
              <p className="text-sm text-gray-600">Official FTC rules and regulations</p>
            </a>

            <a
              href="https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">FCC TCPA Information</h3>
              <p className="text-sm text-gray-600">FCC consumer protection guidelines</p>
            </a>

            <a
              href="https://www.donotcall.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">National Do Not Call Registry</h3>
              <p className="text-sm text-gray-600">Official FTC DNC registry</p>
            </a>

            <a
              href="https://www.law.cornell.edu/uscode/text/47/227"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 mb-2">TCPA Full Text (47 U.S.C. § 227)</h3>
              <p className="text-sm text-gray-600">Complete statutory text</p>
            </a>
          </div>
        </section>

        {/* Find an Attorney */}
        <section className="bg-teal-50 border-2 border-teal-400 rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold text-teal-900 mb-4">
            Find a TCPA Compliance Attorney
          </h2>
          <p className="text-teal-800 mb-6 max-w-2xl mx-auto">
            We strongly recommend consulting with an attorney who specializes in TCPA
            and telemarketing compliance BEFORE making any calls. This is not legal
            advice - this is a strong recommendation for your protection.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://www.martindale.com/find/tcpa-lawyers"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Find TCPA Attorneys
            </a>
            <a
              href="https://www.avvo.com/topics/tcpa"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors"
            >
              TCPA Legal Q&A
            </a>
          </div>
        </section>

        {/* Final Disclaimer */}
        <div className="mt-12">
          <LegalDisclaimer variant="full" context="general" />
        </div>

        {/* Last Updated */}
        <p className="text-center text-sm text-gray-500 mt-12">
          Last Updated: January 2026
        </p>
      </main>
    </div>
  )
}
