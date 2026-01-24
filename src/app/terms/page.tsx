import Link from 'next/link'
import {
  Shield,
  FileText,
  Scale,
  AlertTriangle,
  CreditCard,
  XCircle,
  Clock,
  Mail,
  ArrowLeft,
  CheckCircle,
  Users,
  Database,
  Lock,
} from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Echo Safe',
  description: 'Terms of Service for Echo Safe DNC compliance platform. Read our terms before using our services.',
}

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-slate-100 rounded-full">
            <FileText className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">Legal Agreement</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-slate-600">
            Last updated: January 23, 2026
          </p>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl border border-teal-200 p-8 mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-teal-600" />
            Summary (Plain English)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">We provide DNC checking tools, not legal advice</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">You&apos;re responsible for TCPA compliance</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">$47/month subscription, cancel anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">Your data belongs to you, export or delete anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">60-day grace period after cancellation</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-slate-700">We never sell your data</span>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Section 1: Acceptance */}
          <section id="acceptance">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">
                By accessing or using Echo Safe (&quot;the Service&quot;), you agree to be bound by these Terms of Service
                (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
              </p>
              <p className="text-slate-700">
                These Terms apply to all users, including visitors, registered users, and paying subscribers.
                By creating an account, you confirm that you are at least 18 years old and have the legal
                authority to enter into this agreement.
              </p>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Important:</strong> Echo Safe is a data checking tool. We provide access to DNC registry
                  data and compliance insights, but we do not provide legal advice. You are solely responsible
                  for your TCPA compliance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Description of Service */}
          <section id="service-description">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">2. Description of Service</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">Echo Safe provides:</p>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">&bull;</span>
                  <strong>DNC Registry Checking:</strong> Verification of phone numbers against the Federal Do Not Call Registry
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">&bull;</span>
                  <strong>Risk Scoring:</strong> Assessment of calling risk based on publicly available data
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">&bull;</span>
                  <strong>AI Compliance Insights:</strong> Industry-specific guidance powered by AI (for informational purposes only)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">&bull;</span>
                  <strong>Lead Management:</strong> Built-in CRM for storing and organizing your leads
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-500 mt-1">&bull;</span>
                  <strong>CRM Integrations:</strong> Sync capabilities with third-party CRM systems
                </li>
              </ul>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Privacy Note:</strong> We operate on a privacy-first model. We do not track your behavior,
                  profile your usage, or sell your data. See our{' '}
                  <Link href="/privacy" className="text-purple-700 underline hover:text-purple-900">
                    Privacy Policy
                  </Link>{' '}
                  for details.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: User Responsibilities */}
          <section id="user-responsibilities">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">3. User Responsibilities & TCPA Compliance</h2>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-6 space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
                <h3 className="text-lg font-bold text-red-900 mb-2">Critical Legal Notice</h3>
                <p className="text-red-800">
                  Echo Safe is a <strong>tool</strong>, not a guarantee of TCPA compliance. You are solely responsible
                  for ensuring your telemarketing activities comply with all applicable federal, state, and local laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">You agree to:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    Use the Service only for lawful purposes
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    Maintain your own compliance program independent of our tools
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    Not rely solely on our DNC checks for compliance decisions
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    Keep your own records as required by law
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    Consult with legal counsel for compliance advice
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">You agree NOT to:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    Use the Service to harass or harm others
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    Attempt to circumvent security measures or access other users&apos; data
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    Resell or redistribute DNC data obtained through the Service
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    Use automated scripts to abuse the Service
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    Misrepresent your identity or affiliation
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Subscription & Payment */}
          <section id="subscription">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">4. Subscription & Payment</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                  <h3 className="font-semibold text-teal-900 mb-2">Professional Plan</h3>
                  <p className="text-3xl font-bold text-teal-700 mb-2">$47<span className="text-lg font-normal">/month</span></p>
                  <ul className="space-y-1 text-sm text-teal-800">
                    <li>&bull; Unlimited DNC scrubbing</li>
                    <li>&bull; AI compliance insights</li>
                    <li>&bull; Built-in CRM</li>
                    <li>&bull; CRM integrations</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Free Trial</h3>
                  <p className="text-3xl font-bold text-slate-700 mb-2">14 days</p>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>&bull; No credit card required</li>
                    <li>&bull; Full feature access</li>
                    <li>&bull; Cancel anytime</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Payment Terms</h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    Subscriptions are billed monthly in advance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    Payment is processed securely through Stripe
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    You may cancel at any time from your account settings
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    Refunds are provided at our discretion for technical issues
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-500 mt-1">&bull;</span>
                    We may change pricing with 30 days notice to existing subscribers
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="font-semibold text-amber-900 mb-2">Cancellation Policy</h4>
                <p className="text-sm text-amber-800">
                  When you cancel, you retain access until the end of your billing period. After cancellation,
                  you have a <strong>60-day grace period</strong> to export your data before it is permanently deleted.
                  Compliance audit logs are anonymized and retained for 5 years as required by federal law.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Data Ownership */}
          <section id="data-ownership">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">5. Data Ownership & Your Rights</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">Your Data Belongs to You</h3>
                <p className="text-sm text-green-800">
                  All leads, notes, and custom data you upload or create remain your property. We claim no
                  ownership rights over your content.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Database className="w-5 h-5 text-teal-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Export Anytime</h4>
                  <p className="text-sm text-slate-600">Download all your data in CSV or JSON format</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Delete Anytime</h4>
                  <p className="text-sm text-slate-600">Permanently delete your data with one click</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Lock className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">Privacy Protected</h4>
                  <p className="text-sm text-slate-600">We never sell or share your data</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Disclaimers & Limitations */}
          <section id="disclaimers">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">6. Disclaimers & Limitations of Liability</h2>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-6 space-y-6">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                <h3 className="text-lg font-bold text-amber-900 mb-2">Service Provided &quot;As Is&quot;</h3>
                <p className="text-amber-800">
                  Echo Safe is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
                  express or implied, including but not limited to warranties of merchantability, fitness for a
                  particular purpose, or non-infringement.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">We do NOT guarantee:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    That the DNC data is 100% accurate or complete at all times
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    That using our Service will prevent TCPA violations or lawsuits
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    Uninterrupted or error-free service
                  </li>
                  <li className="flex items-start gap-3 text-slate-700">
                    <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    That AI-generated insights are legally accurate or complete
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2">Limitation of Liability</h4>
                <p className="text-sm text-slate-700">
                  To the maximum extent permitted by law, Echo Safe and its officers, directors, employees, and
                  agents shall not be liable for any indirect, incidental, special, consequential, or punitive
                  damages, including but not limited to loss of profits, data, or business opportunities, arising
                  out of or related to your use of the Service.
                </p>
                <p className="text-sm text-slate-700 mt-2">
                  In no event shall our total liability exceed the amount you paid us in the 12 months preceding
                  the claim.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Indemnification */}
          <section id="indemnification">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">7. Indemnification</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-700">
                You agree to indemnify, defend, and hold harmless Echo Safe, its affiliates, and their respective
                officers, directors, employees, and agents from and against any claims, liabilities, damages,
                losses, and expenses (including reasonable attorneys&apos; fees) arising out of or in any way connected
                with:
              </p>
              <ul className="mt-4 space-y-2 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-1">&bull;</span>
                  Your use of the Service
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-1">&bull;</span>
                  Your violation of these Terms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-1">&bull;</span>
                  Your violation of any applicable laws, including TCPA
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-1">&bull;</span>
                  Any claims by third parties related to your telemarketing activities
                </li>
              </ul>
            </div>
          </section>

          {/* Section 8: Termination */}
          <section id="termination">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">8. Termination</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">
                Either party may terminate this agreement at any time:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">You May Terminate By:</h4>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>&bull; Canceling your subscription in Settings</li>
                    <li>&bull; Deleting your account</li>
                    <li>&bull; Contacting support</li>
                  </ul>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">We May Terminate For:</h4>
                  <ul className="space-y-1 text-sm text-slate-700">
                    <li>&bull; Violation of these Terms</li>
                    <li>&bull; Non-payment</li>
                    <li>&bull; Abuse of the Service</li>
                    <li>&bull; Illegal activity</li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-700">
                Upon termination, your right to use the Service ends immediately. You will have 60 days to
                export your data before it is permanently deleted.
              </p>
            </div>
          </section>

          {/* Section 9: Governing Law */}
          <section id="governing-law">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">9. Governing Law & Disputes</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <p className="text-slate-700">
                These Terms shall be governed by and construed in accordance with the laws of the State of Utah,
                United States, without regard to its conflict of law provisions.
              </p>
              <p className="text-slate-700">
                Any disputes arising out of or relating to these Terms or the Service shall be resolved through
                binding arbitration in Salt Lake City, Utah, in accordance with the rules of the American
                Arbitration Association.
              </p>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Class Action Waiver:</strong> You agree to resolve any disputes on an individual basis
                  and waive any right to participate in a class action lawsuit or class-wide arbitration.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Changes to Terms */}
          <section id="changes">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">10. Changes to Terms</h2>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="text-slate-700">
                We may update these Terms from time to time. We will notify you of any material changes by
                email at least 30 days before they take effect. Your continued use of the Service after the
                effective date constitutes acceptance of the updated Terms.
              </p>
              <p className="text-slate-700 mt-4">
                You can always find the current version of these Terms at this page.
              </p>
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
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-2 text-slate-700">
                <p><strong>Email:</strong> support@echosafe.app</p>
                <p><strong>Legal Inquiries:</strong> legal@echosafe.app</p>
                <p><strong>Company:</strong> Echo Safe Systems, LLC</p>
                <p><strong>Address:</strong> Salt Lake City, Utah, USA</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-600 mb-6">
              Start your 14-day free trial. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Link>
            </div>
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
            <Link href="/terms" className="text-sm text-teal-600 font-medium">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
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
