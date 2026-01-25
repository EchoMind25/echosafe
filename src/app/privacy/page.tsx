import Link from 'next/link'
import {
  Shield,
  Database,
  Clock,
  Download,
  Trash2,
  Lock,
  Server,
  Brain,
  CreditCard,
  Mail,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  AlertTriangle,
} from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Privacy-First DNC Compliance',
  description: 'We don\'t track you. We don\'t sell your data. Read our privacy policy in plain English—what we collect, what we don\'t, and how to delete everything anytime.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">Echo Safe</span>
              <p className="text-xs text-purple-600">Privacy-First</p>
            </div>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-100 rounded-full">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Privacy-First Platform</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy That&apos;s Actually Readable</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-2">
            We don&apos;t bury tracking disclosures in legal jargon. Here&apos;s exactly what we do (and don&apos;t do) with your data.
          </p>
          <p className="text-sm text-slate-500">
            Last updated: January 23, 2026
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Our Privacy Promise (TL;DR)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">We <strong>never</strong> sell your data</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">We <strong>never</strong> track your behavior</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Delete all your data anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Export all your data anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">AI analysis is stateless (nothing stored)</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">60-day grace period after cancellation</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Section 1: Data Collection */}
          <section id="data-collection">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">1. Data We Collect (Minimal)</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">
                We collect only what&apos;s essential to provide our service:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Account Information</strong>
                    <p className="text-sm text-slate-600">Email, name, company name (optional), industry selection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Your Leads (CRM)</strong>
                    <p className="text-sm text-slate-600">Phone numbers, names, and contact info you choose to save</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Upload History</strong>
                    <p className="text-sm text-slate-600">File names, lead counts, compliance scores (for your reference)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Billing Information</strong>
                    <p className="text-sm text-slate-600">Processed by Stripe. We never see your full card number.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: What We DON'T Collect */}
          <section id="not-collected">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">2. What We DON&apos;T Collect</h2>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-6 space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Individual lead outcomes or conversion data</span>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">User behavior patterns across sessions</span>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Cross-user analytics or benchmarking data</span>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">Browsing history or third-party tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">AI analysis results (displayed once, never stored)</span>
              </div>
            </div>
          </section>

          {/* Section 3: Data Usage */}
          <section id="data-usage">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">3. How We Use Your Data</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">We use your data <strong>only</strong> to:</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Provide DNC scrubbing and compliance services
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Store your leads in your private CRM (you control this)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Generate real-time AI compliance insights (stateless)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Process payments through Stripe
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Send transactional emails (receipts, password resets)
                </li>
              </ul>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-800">
                  <strong>We will never:</strong> Sell, rent, or share your data with third parties for marketing purposes.
                  Your leads stay yours. Period.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Data Storage & Retention */}
          <section id="data-retention">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">4. Data Storage & Retention</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              {/* Your Personal Data */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Your Personal Data</h3>
                <p className="text-slate-700 mb-4">
                  Your leads, upload history, and account information are stored while your account is active.
                  You have complete control and can delete this data anytime.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">Active Accounts</h4>
                    <p className="text-sm text-green-800">
                      Your data is stored securely while your account is active. You control what stays and what goes.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-900 mb-2">After Cancellation</h4>
                    <p className="text-sm text-amber-800">
                      60-day grace period to export your data. After that, personal data is permanently deleted.
                      Compliance logs are anonymized but retained for 5 years as required by law.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">On-Demand Deletion</h4>
                    <p className="text-sm text-purple-800">
                      Request deletion anytime from Settings &rarr; Data &amp; Privacy. Your leads, uploads, and
                      account details are deleted permanently. Compliance logs are anonymized (detached from
                      your account) but retained as required by federal law.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-2">Upload Files</h4>
                    <p className="text-sm text-slate-700">
                      Uploaded files are processed and then deleted within 24 hours. We don&apos;t keep copies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Federal Compliance Audit Logs Disclosure */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-700" />
                  <h3 className="text-lg font-semibold text-blue-900">
                    Federal Compliance Audit Logs (5-Year Retention)
                  </h3>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Legal Requirement:</strong> Under the Telephone Consumer Protection Act (TCPA)
                  and FTC regulations (47 CFR &sect; 64.1200), we are legally required to maintain audit logs
                  of DNC registry checks for 5 years.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">What we log for compliance:</p>
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        Date and time of each DNC check
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        Phone numbers checked
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        Check results (on DNC or not)
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        Your company name and industry
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <span className="text-blue-500 mt-0.5">&bull;</span>
                        Purpose of check (lead scrubbing)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-2">What we DON&apos;T use compliance logs for:</p>
                    <ul className="space-y-1">
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Profiling your behavior
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Marketing or advertising
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Selling to third parties
                      </li>
                      <li className="flex items-start gap-2 text-sm text-blue-800">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        Cross-user analytics
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Privacy-First Compliance:</p>
                  <p className="text-sm text-blue-800">
                    When you delete your data, we anonymize compliance logs (detach from your account)
                    but retain them for the 5-year period as required by law. After 5 years, logs are
                    automatically purged.
                  </p>
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <strong>Summary:</strong> Personal data = your control, delete anytime.
                  Compliance logs = federal requirement, anonymized on deletion, automatically
                  purged after 5 years.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Your Rights */}
          <section id="your-rights">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">5. Your Rights</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Download className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Right to Export</h3>
                  <p className="text-sm text-slate-600">
                    Download all your data anytime in CSV or JSON format from Settings.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Right to Delete</h3>
                  <p className="text-sm text-slate-600">
                    Delete all your data with one click. No waiting period, no &quot;are you sure&quot; emails.
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Right to Access</h3>
                  <p className="text-sm text-slate-600">
                    See exactly what data we have about you. It&apos;s all visible in your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: California Privacy Rights (CCPA) */}
          <section id="do-not-sell">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">6. California Privacy Rights (CCPA)</h2>
            </div>
            <div className="bg-white rounded-xl border border-yellow-200 p-6 space-y-6">
              {/* Do Not Sell Banner */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded-r-lg">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  Do Not Sell My Personal Information
                </h3>
                <p className="text-yellow-800 font-medium">
                  Echo Safe does NOT sell your personal information. We never have, and we never will.
                </p>
              </div>

              <p className="text-slate-700">
                If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Right to Know
                  </h4>
                  <p className="text-sm text-slate-700">
                    You can request details about what personal information we collect and how we use it.
                    View all your data directly in your dashboard.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Right to Delete
                  </h4>
                  <p className="text-sm text-slate-700">
                    Request deletion of your personal information. Go to Settings &rarr; Data &amp; Privacy to delete immediately.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Right to Opt-Out of Sale
                  </h4>
                  <p className="text-sm text-slate-700">
                    <strong>Not applicable</strong> — we do not sell personal information. Our business model is subscription-based,
                    not data monetization.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Right to Non-Discrimination
                  </h4>
                  <p className="text-sm text-slate-700">
                    We will not discriminate against you for exercising any of your CCPA rights.
                  </p>
                </div>
              </div>

              {/* Explicit No Sale Statement */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Our Commitment</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    We have NEVER sold personal information in the past
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    We do NOT currently sell personal information
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    We have NO plans to sell personal information in the future
                  </li>
                </ul>
                <p className="text-sm text-green-800 mt-3">
                  If our practices ever change, we will update this policy and provide you with the ability to opt-out
                  before any sale occurs.
                </p>
              </div>

              {/* Contact for CCPA */}
              <div className="p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-700">
                  <strong>To exercise your California privacy rights:</strong> Email us at{' '}
                  <a href="mailto:support@echosafe.app" className="text-teal-600 hover:underline">
                    support@echosafe.app
                  </a>{' '}
                  with the subject line &quot;CCPA Request&quot; or manage your data directly in Settings.
                  We will respond within 45 days as required by law.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Data Deletion & Export */}
          <section id="data-deletion">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">7. Data Deletion & Export</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <p className="text-slate-700">
                You have complete control over your data. Export or delete anytime from
                Settings &rarr; Data &amp; Privacy.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* What Gets Deleted */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">What Gets Deleted</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      All your leads (permanently)
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      All upload jobs and results
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      All CRM integration settings
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      All notes, tags, and preferences
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-1" />
                      Your account information (if you also close account)
                    </li>
                  </ul>
                </div>

                {/* What Remains (Compliance Only) */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">What Remains (Compliance Only)</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-slate-700">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                      Anonymized compliance audit logs (5-year federal requirement)
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <Lock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                      These logs are detached from your account and cannot be linked back to you
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <Clock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                      Automatically purged after 5 years
                    </li>
                    <li className="flex items-start gap-2 text-slate-700">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-1" />
                      Never used for marketing, profiling, or business intelligence
                    </li>
                  </ul>
                </div>
              </div>

              {/* Why We Can't Delete Compliance Logs */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Why we can&apos;t delete compliance logs immediately:
                    </p>
                    <p className="text-sm text-amber-800">
                      The FTC requires businesses using the DNC registry to maintain audit trails for
                      5 years to prove compliance with TCPA regulations. This protects both you and us
                      in case of regulatory audits.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Options */}
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Your Data
                </h3>
                <p className="text-sm text-teal-800">
                  Before deleting, you can export all your data in CSV or JSON format.
                  This includes leads, upload history, and compliance audit logs associated with your account.
                  Go to Settings &rarr; Data &amp; Privacy &rarr; Export Data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8: Third Parties */}
          <section id="third-parties">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">8. Third-Party Services</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">
                We use these trusted services to operate Echo Safe. Each has strong privacy commitments:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Database className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Supabase</strong>
                    <p className="text-sm text-slate-600">Database and authentication. SOC 2 Type II certified. Data stored in US.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Claude AI (Anthropic)</strong>
                    <p className="text-sm text-slate-600">AI insights. Enterprise privacy: zero data retention, no training on your data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Stripe</strong>
                    <p className="text-sm text-slate-600">Payment processing. PCI DSS Level 1 certified. We never see your full card number.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <Mail className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Resend</strong>
                    <p className="text-sm text-slate-600">Transactional emails only. No marketing, no tracking pixels.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: AI Privacy Guarantees */}
          <section id="ai-privacy">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">9. AI Privacy Guarantees</h2>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-6 space-y-4">
              <p className="text-slate-700">
                Our AI compliance insights are powered by Claude (Anthropic) with enterprise privacy guarantees:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Zero Retention:</strong> Anthropic does not store your data or use it for training</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Stateless Analysis:</strong> Each analysis is independent—no historical tracking</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>Aggregate Data Only:</strong> AI sees statistics, not individual lead details</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700"><strong>No Cross-User Data:</strong> No comparisons to other users or benchmarking</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10: Security */}
          <section id="security">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">10. Security Measures</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  All data encrypted in transit (TLS 1.3) and at rest (AES-256)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Row-Level Security (RLS) ensures you only access your own data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Regular security audits and penetration testing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Secure password hashing with industry-standard algorithms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">•</span>
                  Automatic session expiration and secure cookie handling
                </li>
              </ul>
            </div>
          </section>

          {/* Section 11: Contact */}
          <section id="contact">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">11. Contact Us</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-700 mb-4">
                Questions about privacy? We&apos;re here to help:
              </p>
              <div className="space-y-2 text-slate-700">
                <p><strong>General Support:</strong> support@echosafe.app</p>
                <p><strong>Business Inquiries:</strong> braxton@echosafe.app</p>
                <p><strong>Security Concerns:</strong> keaton@echosafe.app</p>
                <p><strong>Company:</strong> Echo Safe Systems, LLC</p>
                <p><strong>Response Time:</strong> Within 24 hours</p>
              </div>
            </div>
          </section>

          {/* Section 12: Changes */}
          <section id="changes">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">12. Policy Changes</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-700">
                We&apos;ll notify you of any material changes to this policy via email at least 30 days before they take effect.
                You can always find the current version here.
              </p>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-teal-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to Experience Privacy-First DNC Compliance?
            </h2>
            <p className="text-slate-600 mb-6">
              Start your 7-day free trial. Cancel anytime. Delete anytime. $47/month unlimited.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
              >
                See All Features
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              <Link href="/pricing" className="text-teal-600 hover:underline">View pricing</Link>
              {' '}&bull;{' '}
              <Link href="/features" className="text-teal-600 hover:underline">Explore features</Link>
              {' '}&bull;{' '}
              <Link href="/terms" className="text-teal-600 hover:underline">Terms of service</Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; 2026 Echo Safe. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-teal-600 font-medium">
              Privacy Policy
            </Link>
            <Link href="/support" className="text-sm text-slate-500 hover:text-slate-700">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
