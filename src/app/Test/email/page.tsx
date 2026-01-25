'use client';

import { useState } from 'react';

type EmailType = 'welcome' | 'verification' | 'password-reset' | 'upload-complete';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;
}

export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<EmailType | null>(null);
  const [results, setResults] = useState<Record<EmailType, TestResult | null>>({
    welcome: null,
    verification: null,
    'password-reset': null,
    'upload-complete': null,
  });

  const sendTestEmail = async (type: EmailType) => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(type);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, to: email }),
      });

      const data = await response.json();
      setResults((prev) => ({ ...prev, [type]: data }));
    } catch (_error) {
      setResults((prev) => ({
        ...prev,
        [type]: { success: false, error: 'Request failed' },
      }));
    } finally {
      setLoading(null);
    }
  };

  const emailTypes: { type: EmailType; label: string; description: string }[] = [
    {
      type: 'welcome',
      label: 'Welcome Email',
      description: 'Sent after successful signup',
    },
    {
      type: 'verification',
      label: 'Verification Email',
      description: 'Email confirmation with verification link',
    },
    {
      type: 'password-reset',
      label: 'Password Reset',
      description: 'Password recovery email with reset link',
    },
    {
      type: 'upload-complete',
      label: 'Upload Complete',
      description: 'Notification when lead scrub is finished',
    },
  ];

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-800 px-6 py-8">
            <h1 className="text-2xl font-bold text-white">Email Template Tester</h1>
            <p className="text-blue-200 mt-2">
              Test Resend email templates in development
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Emails will be sent to this address
              </p>
            </div>

            <div className="space-y-4">
              {emailTypes.map(({ type, label, description }) => (
                <div
                  key={type}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{label}</h3>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <button
                      onClick={() => sendTestEmail(type)}
                      disabled={loading !== null}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        loading === type
                          ? 'bg-gray-100 text-gray-400 cursor-wait'
                          : 'bg-blue-800 text-white hover:bg-blue-700'
                      }`}
                    >
                      {loading === type ? 'Sending...' : 'Send Test'}
                    </button>
                  </div>

                  {results[type] && (
                    <div
                      className={`mt-3 p-3 rounded-lg text-sm ${
                        results[type]?.success
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {results[type]?.success ? (
                        <>
                          <span className="font-medium">Sent successfully!</span>
                          {results[type]?.messageId && (
                            <span className="block text-xs mt-1 opacity-75">
                              ID: {results[type]?.messageId}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-medium">Failed to send</span>
                          <span className="block text-xs mt-1">
                            {results[type]?.error}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium text-amber-800">Setup Checklist</h4>
              <ul className="mt-2 text-sm text-amber-700 space-y-1">
                <li>1. Add RESEND_API_KEY to .env.local</li>
                <li>2. Verify your domain in Resend dashboard</li>
                <li>3. Update RESEND_FROM_EMAIL if using custom domain</li>
                <li>4. Test each template renders correctly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
