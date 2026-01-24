import Link from 'next/link'
import {
  Shield,
  Database,
  Brain,
  Users,
  Clock,
  Download,
  Lock,
  FileText,
  ArrowRight,
  Check,
  XCircle,
  Server,
} from 'lucide-react'

export const metadata = {
  title: 'Features | Privacy-First DNC Compliance Tools',
  description: 'Real-time DNC scrubbing, AI risk scoring, built-in CRM, and 5-year audit logs. All built on privacy-first architecture. No tracking, no data selling.',
}

export default function FeaturesPage() {
  const features = [
    {
      icon: Database,
      title: 'Daily FTC DNC Updates',
      description: 'Most competitors update monthly. We update daily. Every phone number is checked against the latest federal Do Not Call registry data from the FTC.',
      privacyNote: 'We only access public FTC data. We don\'t track which numbers you check.',
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      icon: Brain,
      title: 'AI Risk Scoring (Stateless)',
      description: 'Get industry-specific compliance insights powered by Claude AI. Real-time analysis of DNC registry matches, PACER litigator data, and deleted number patterns.',
      privacyNote: 'Zero retention: AI analyzes your batch, gives you insights, then forgets everything. Nothing stored or used for training.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Users,
      title: 'Built-In CRM (User-Controlled)',
      description: 'Store leads permanently in your private CRM. Tag, filter, and manage contacts. Export to CSV/JSON anytime. No per-lead storage fees.',
      privacyNote: 'You own this data completely. We never access, analyze, or monetize your leads. Delete everything with one click.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: FileText,
      title: '5-Year Compliance Audit Trail',
      description: 'TCPA requires 5-year records of DNC checks. We log every scrub with timestamps, FTC release dates, and results. Your proof of due diligence.',
      privacyNote: 'Logs are tied to your account while active. On deletion, logs are anonymized (required by law) but can\'t be linked back to you.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      icon: Clock,
      title: '90-Day Deleted Number Tracking',
      description: 'We track numbers removed from the DNC registry in the last 90 days. Useful for pattern detection and understanding registration trends.',
      privacyNote: 'This is public FTC data only. We don\'t track your call outcomes or lead conversion.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: Download,
      title: 'Multiple Export Formats',
      description: 'Download clean leads in CSV, Excel, or JSON. Export your full CRM or just specific batches. Integrates with any workflow.',
      privacyNote: 'Client-side processing. Your exported data goes directly to your device, not through our servers.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
  ]

  const comparisonData = [
    { feature: 'User Behavior Tracking', echoSafe: false, competitors: true },
    { feature: 'Sells Lead Data to Third Parties', echoSafe: false, competitors: true },
    { feature: 'Builds User Profiles', echoSafe: false, competitors: true },
    { feature: 'AI Learns From Your Data', echoSafe: false, competitors: true },
    { feature: 'Delete Data Instantly', echoSafe: true, competitors: false },
    { feature: 'Daily DNC Updates', echoSafe: true, competitors: false },
    { feature: 'Stateless AI Analysis', echoSafe: true, competitors: false },
    { feature: 'Transparent Pricing (Flat Rate)', echoSafe: true, competitors: false },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">Echo Safe</span>
              <p className="text-xs text-purple-600">Privacy-First</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-100 rounded-full">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Privacy-First Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Compliance Features Built on Privacy
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Real-time DNC scrubbing, AI risk scoring, and compliance tools—without tracking you or selling your data. Every feature designed with privacy as the foundation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
            >
              Start 14-Day Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Every Feature, Privacy-First
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We don&apos;t just add privacy as an afterthought. Every feature is designed from the ground up to protect your data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 mb-4">
                  {feature.description}
                </p>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-800">{feature.privacyNote}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How Privacy-First Scrubbing Works
            </h2>
            <p className="text-lg text-slate-600">
              From upload to clean leads in seconds—with nothing stored you don&apos;t control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">1</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Upload Leads</h3>
              <p className="text-sm text-slate-600">
                Drop your CSV or paste from Google Sheets. Files processed in memory, not stored.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">2</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">DNC Check</h3>
              <p className="text-sm text-slate-600">
                Every number checked against daily FTC data. Results logged for your compliance records.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">3</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-slate-600">
                Stateless AI gives you risk scores and insights. Nothing stored after display.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-teal-600">4</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Download Clean List</h3>
              <p className="text-sm text-slate-600">
                Export to CSV, Excel, or JSON. Save to CRM if you choose. You control what stays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Comparison */}
      <section className="py-16 sm:py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Privacy Comparison: Us vs Them
            </h2>
            <p className="text-lg text-slate-400">
              See why privacy-first isn&apos;t just marketing—it&apos;s architecture.
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-300">Feature</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-teal-400">Echo Safe</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-500">Competitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 text-sm text-slate-300">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      {row.echoSafe ? (
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-green-500 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {row.competitors ? (
                        <Check className="w-5 h-5 text-red-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Green = good for your privacy. Red = bad for your privacy.
          </p>
        </div>
      </section>

      {/* AI Privacy Deep Dive */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Brain className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                AI That Forgets: How Stateless Analysis Works
              </h2>
              <p className="text-slate-600 mb-6">
                We use Claude AI (Anthropic) with enterprise privacy guarantees. Here&apos;s exactly what happens when you scrub leads:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Zero Retention:</strong>
                    <span className="text-slate-600"> Anthropic does not store your data or use it for model training. Enterprise API mode.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Stateless Analysis:</strong>
                    <span className="text-slate-600"> Each batch is analyzed independently. No historical context, no learning from your data.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Aggregate Data Only:</strong>
                    <span className="text-slate-600"> AI sees statistics (X% on DNC), not individual lead details. No PII sent.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">No Cross-User Analysis:</strong>
                    <span className="text-slate-600"> We don&apos;t compare you to other users or build benchmarks from your data.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Third Party Transparency */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Third-Party Services We Use
            </h2>
            <p className="text-lg text-slate-600">
              Full transparency on every service that touches your data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Server className="w-6 h-6 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Supabase</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">Database and authentication</p>
              <p className="text-xs text-slate-500">SOC 2 Type II certified. Data encrypted at rest. US data centers.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Claude AI (Anthropic)</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">AI risk scoring and insights</p>
              <p className="text-xs text-slate-500">Enterprise privacy mode. Zero data retention. No training on your data.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Stripe</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">Payment processing</p>
              <p className="text-xs text-slate-500">PCI DSS Level 1 certified. We never see your full card number.</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <Database className="w-6 h-6 text-slate-600" />
                <h3 className="font-semibold text-slate-900">FTC Registry</h3>
              </div>
              <p className="text-sm text-slate-600 mb-2">DNC data source</p>
              <p className="text-xs text-slate-500">Public data. Updated daily. We pay FTC directly for access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-teal-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready for Privacy-First Compliance?
          </h2>
          <p className="text-xl text-teal-100 mb-4">
            14-day free trial. No credit card required. Delete your data anytime.
          </p>
          <p className="text-lg text-teal-200 mb-8">
            $47/month unlimited. Save $1,200+/year vs per-lead pricing.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-teal-600 font-bold text-lg rounded-xl transition-colors"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Echo Safe Systems. We don&apos;t sell your data.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-500 hover:text-slate-700 text-sm transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
