'use client'

import { AlertTriangle, Scale } from 'lucide-react'

export function UserObligations() {
  return (
    <div className="bg-white border-4 border-red-500 rounded-xl shadow-lg p-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Scale className="w-8 h-8 text-red-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            📋 YOUR LEGAL OBLIGATIONS
          </h2>
          <p className="text-gray-600">
            Federal law places compliance responsibilities on YOU, the caller.
            Echo Safe provides data. You make legal decisions.
          </p>
        </div>
      </div>

      {/* Critical warning */}
      <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 mb-2">
              ⚠️ YOU ARE SOLELY RESPONSIBLE FOR TCPA COMPLIANCE
            </p>
            <p className="text-red-800 text-sm">
              Using Echo Safe does NOT transfer legal responsibility to us.
              You remain 100% liable for your calling activities. We provide
              data tools, not legal compliance services.
            </p>
          </div>
        </div>
      </div>

      {/* Your obligations */}
      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-gray-900 text-lg">
          Federal Law Requires YOU To:
        </h3>

        <div className="space-y-3">
          <ObligationItem
            number="1"
            title="Verify All Data Independently"
            description="You MUST verify phone numbers before calling. Our data may be incomplete, outdated, or inaccurate. Verification is YOUR responsibility."
          />

          <ObligationItem
            number="2"
            title="Maintain Your Own Call Records (5 Years)"
            description="TCPA requires you to keep records of ALL calls made for minimum 5 years. Echo Safe's compliance logs document OUR checks, not YOUR calls."
          />

          <ObligationItem
            number="3"
            title="Obtain Written Consent for Mobile Autodialers"
            description="If using automated dialing systems to call mobile numbers, you MUST obtain prior express written consent. No exceptions."
          />

          <ObligationItem
            number="4"
            title="Check State-Specific DNC Lists"
            description="We provide federal DNC data and some state lists. YOU must verify compliance with ALL applicable state laws in your calling area."
          />

          <ObligationItem
            number="5"
            title="Honor Opt-Out Requests Immediately"
            description="You must stop calling anyone who requests to be added to your internal DNC list within 30 days (sooner in some states)."
          />

          <ObligationItem
            number="6"
            title="Maintain Company-Specific Internal DNC List"
            description="You must maintain your own 'do not call' list separate from federal registry and honor it permanently."
          />

          <ObligationItem
            number="7"
            title="Consult an Attorney"
            description="Before making ANY calls, consult a TCPA compliance attorney. Laws vary by state. One mistake costs thousands of dollars."
          />
        </div>
      </div>

      {/* Penalties */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-500 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Penalties for TCPA Violations:
        </h3>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded p-4 border border-red-300">
            <p className="font-semibold text-gray-900 mb-2">Per Violation:</p>
            <ul className="space-y-1 text-gray-700 ml-4">
              <li>• Negligent: Up to $500 per call</li>
              <li>• Willful: Up to $1,500 per call</li>
              <li>• Treble damages possible</li>
            </ul>
          </div>

          <div className="bg-white rounded p-4 border border-red-300">
            <p className="font-semibold text-gray-900 mb-2">Additional Consequences:</p>
            <ul className="space-y-1 text-gray-700 ml-4">
              <li>• Class action lawsuits</li>
              <li>• State AG enforcement</li>
              <li>• FTC fines and injunctions</li>
              <li>• Business closure</li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-red-900 font-bold text-center">
          One batch of 1,000 violations = $500,000 - $1,500,000 in penalties
        </p>
      </div>

      {/* What Echo Safe does NOT do */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-yellow-900 mb-4">
          ❌ What Echo Safe Does NOT Do:
        </h3>

        <ul className="space-y-2 text-sm text-yellow-800 ml-6">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Provide legal advice or compliance guidance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Guarantee TCPA compliance for your calling activities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Make legal decisions about who you can call</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Replace consultation with a qualified attorney</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Maintain your call records (you must do this)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Verify state-specific requirements (you must do this)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-1">•</span>
            <span>Accept any liability for your violations</span>
          </li>
        </ul>
      </div>

      {/* Resources */}
      <div className="pt-6 border-t-2 border-gray-300">
        <p className="text-sm text-gray-600 mb-3">
          <strong>Recommended Resources:</strong>
        </p>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <a
            href="https://www.ftc.gov/legal-library/browse/rules/telemarketing-sales-rule"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            FTC Telemarketing Sales Rule →
          </a>
          <a
            href="https://www.fcc.gov/consumers/guides/stop-unwanted-robocalls-and-texts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            FCC TCPA Guidelines →
          </a>
          <a
            href="/legal/find-attorney"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            Find a TCPA Compliance Attorney →
          </a>
          <a
            href="/resources/compliance-checklist"
            className="text-teal-600 hover:text-teal-700 underline"
          >
            TCPA Compliance Checklist →
          </a>
        </div>
      </div>
    </div>
  )
}

function ObligationItem({
  number,
  title,
  description
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </div>
  )
}

export default UserObligations
