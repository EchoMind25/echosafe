'use client'

import { Clock, AlertCircle, Database } from 'lucide-react'

interface DataFreshnessNoticeProps {
  lastFtcUpdate: Date
  lastStateUpdate?: Date
  lastPacerUpdate?: Date
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date)
}

export function DataFreshnessNotice({
  lastFtcUpdate,
  lastStateUpdate,
  lastPacerUpdate
}: DataFreshnessNoticeProps) {
  return (
    <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Database className="w-6 h-6 text-blue-700" />
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Data Last Updated:
            </h3>

            <div className="space-y-1 text-sm text-blue-800 ml-7">
              <p>• FTC National DNC Registry: <strong>{formatDateTime(lastFtcUpdate)}</strong></p>
              {lastStateUpdate && (
                <p>• State DNC Registries: <strong>{formatDateTime(lastStateUpdate)}</strong></p>
              )}
              {lastPacerUpdate && (
                <p>• PACER Litigator Database: <strong>{formatDateTime(lastPacerUpdate)}</strong></p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-300">
            <AlertCircle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-semibold mb-1">⚠️ Data Accuracy Limitations</p>
              <p>
                DNC registries are updated continuously by the FTC and may change
                between our updates. Numbers can be added or removed at any time.
                We cannot guarantee 100% accuracy, completeness, or real-time currency.
              </p>
              <p className="mt-2 font-bold">
                YOU MUST verify all information independently before making calls.
              </p>
            </div>
          </div>

          <div className="text-xs text-blue-700 border-t border-blue-300 pt-3">
            <p>
              <strong>Update Frequency:</strong> We update federal DNC data daily,
              state registries weekly-to-quarterly (varies by state), and litigator
              data weekly. Actual FTC updates occur in real-time 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataFreshnessNotice
