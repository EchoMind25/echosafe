'use client'

import { useState } from 'react'
import { AlertTriangle, Scale } from 'lucide-react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

interface ComplianceAcknowledgmentProps {
  onAccept: (acknowledgment: AcknowledgmentData) => void
  onDecline: () => void
}

export interface AcknowledgmentData {
  acceptedAt: Date
  ipAddress: string
  userAgent: string
  confirmationText: string
  checkboxesAccepted: boolean[]
}

export function ComplianceAcknowledgment({
  onAccept,
  onDecline
}: ComplianceAcknowledgmentProps) {
  const [confirmText, setConfirmText] = useState('')
  const [checkboxes, setCheckboxes] = useState([
    false, false, false, false, false, false, false
  ])

  const allChecked = checkboxes.every(checked => checked)
  const confirmTextValid = confirmText.toUpperCase().trim() === 'I AGREE'
  const canSubmit = allChecked && confirmTextValid

  const handleCheckbox = (index: number) => {
    const newCheckboxes = [...checkboxes]
    newCheckboxes[index] = !newCheckboxes[index]
    setCheckboxes(newCheckboxes)
  }

  const handleAccept = async () => {
    if (!canSubmit) return

    // Get user's IP address
    let ip = 'unknown'
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const data = await ipResponse.json()
      ip = data.ip
    } catch {
      // IP fetch failed, continue with 'unknown'
    }

    onAccept({
      acceptedAt: new Date(),
      ipAddress: ip,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      confirmationText: confirmText,
      checkboxesAccepted: checkboxes
    })
  }

  const acknowledgmentLabels = [
    "Echo Safe is a DATA TOOL that checks phone numbers against public DNC registries. It is NOT a compliance solution, legal service, or substitute for an attorney.",
    "I am SOLELY RESPONSIBLE for compliance with TCPA, Telemarketing Sales Rule, and ALL federal and state telemarketing laws. Using Echo Safe does NOT transfer this responsibility.",
    "Echo Safe does NOT provide legal advice. The operators are NOT attorneys. AI-generated insights are informational only, not legal counsel.",
    "I will consult a qualified TCPA compliance attorney BEFORE making calls. I understand that one mistake can cost thousands of dollars in penalties ($500-$1,500 per call).",
    "I will independently verify ALL information from Echo Safe before making calls. Data may be incomplete, outdated, or inaccurate.",
    "I understand that using Echo Safe does NOT guarantee compliance with any law. I remain 100% liable for all calling activities and any violations.",
    "I will NOT rely on Echo Safe as a substitute for legal counsel, compliance training, or professional verification services."
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-red-50 border-4 border-red-500 rounded-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Scale className="w-10 h-10 text-red-700" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          ⚠️ LEGAL ACKNOWLEDGMENT REQUIRED
        </h2>
        <p className="text-lg text-red-900 font-semibold">
          You must read and accept these terms to use Echo Safe
        </p>
      </div>

      {/* Critical Understanding */}
      <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
        <h3 className="font-bold text-yellow-900 text-xl mb-4">
          READ CAREFULLY - This Affects Your Legal Liability
        </h3>

        <div className="space-y-4 text-yellow-900">
          <p className="font-semibold text-lg">
            Echo Safe is a DATA CHECKING TOOL that searches public DNC registries.
          </p>

          <p className="font-semibold text-lg">
            Echo Safe is NOT:
          </p>
          <ul className="ml-6 space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold">❌</span>
              <span>A compliance solution or legal service</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">❌</span>
              <span>A substitute for legal advice</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">❌</span>
              <span>A guarantee of TCPA compliance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">❌</span>
              <span>Operated by attorneys or legal professionals</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Acknowledgment checklist */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-6">
          I Understand and Acknowledge:
        </h3>

        <div className="space-y-4">
          {acknowledgmentLabels.map((label, index) => (
            <AcknowledgmentCheckbox
              key={index}
              checked={checkboxes[index]}
              onCheck={() => handleCheckbox(index)}
              label={label}
            />
          ))}
        </div>
      </div>

      {/* Confirmation input */}
      <div className="bg-gray-50 border-2 border-gray-400 rounded-lg p-6">
        <label className="block mb-4">
          <span className="font-bold text-gray-900 text-lg mb-2 block">
            Type &quot;I AGREE&quot; to confirm you have read and understand:
          </span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg font-mono uppercase focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            placeholder="Type: I AGREE"
            autoComplete="off"
          />
        </label>

        {confirmText && !confirmTextValid && (
          <p className="text-red-600 text-sm mt-2">
            Please type exactly: I AGREE (case insensitive)
          </p>
        )}
      </div>

      {/* Penalty reminder */}
      <div className="bg-red-100 border-2 border-red-500 rounded-lg p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-red-700 mx-auto mb-3" />
        <p className="text-red-900 font-bold text-lg mb-2">
          ⚠️ TCPA Violation Penalties: $500-$1,500 PER CALL
        </p>
        <p className="text-red-800">
          You are personally liable. Consult an attorney before making calls.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center pt-6">
        <button
          onClick={onDecline}
          className="min-w-[200px] px-6 py-3 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          I Do Not Agree
        </button>

        <button
          onClick={handleAccept}
          disabled={!canSubmit}
          className={`
            min-w-[200px] px-6 py-3 rounded-lg font-semibold transition-colors
            ${canSubmit
              ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          I Accept These Terms
        </button>
      </div>

      {!canSubmit && (
        <p className="text-center text-sm text-gray-600">
          You must check all boxes and type &quot;I AGREE&quot; to continue
        </p>
      )}
    </div>
  )
}

function AcknowledgmentCheckbox({
  checked,
  onCheck,
  label
}: {
  checked: boolean
  onCheck: () => void
  label: string
}) {
  return (
    <div
      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
      onClick={onCheck}
    >
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onCheck}
        className="mt-1 flex-shrink-0 w-5 h-5 rounded border-2 border-gray-400 flex items-center justify-center bg-white data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
      >
        <Checkbox.Indicator>
          <Check className="w-3 h-3 text-white" />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <span className="text-gray-800 cursor-pointer flex-1">
        {label}
      </span>
    </div>
  )
}

export default ComplianceAcknowledgment
