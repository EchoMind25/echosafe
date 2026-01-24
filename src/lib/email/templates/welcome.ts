import { baseTemplate } from './base';

export interface WelcomeEmailParams {
  name: string;
  dashboardUrl: string;
}

export function welcomeEmail({ name, dashboardUrl }: WelcomeEmailParams): string {
  const firstName = name.split(' ')[0] || 'there';

  return baseTemplate(`
    <div class="content">
      <h2>Welcome to Echo Safe</h2>
      <p>Hi ${firstName},</p>

      <p>Thank you for joining Echo Safe. You now have access to our lead screening tools.</p>

      <!-- CRITICAL LEGAL DISCLAIMER BOX -->
      <div style="background: #fef3c7; border: 3px solid #f59e0b; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 18px; font-weight: 700; margin-bottom: 16px; text-align: center;">
          ⚠️ IMPORTANT: PLEASE READ BEFORE USING
        </p>

        <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <p style="color: #991b1b; font-weight: 700; margin-bottom: 8px;">
            Echo Safe is a DATA CHECKING TOOL.
          </p>
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            We are NOT attorneys. We do NOT provide legal advice.
            We do NOT guarantee TCPA compliance.
          </p>
        </div>

        <p style="color: #713f12; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          <strong>You understand and agree that:</strong>
        </p>

        <ul style="color: #713f12; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 16px 0;">
          <li>You are <strong>SOLELY RESPONSIBLE</strong> for compliance with TCPA and all telemarketing laws</li>
          <li>Our data may be <strong>incomplete, outdated, or inaccurate</strong></li>
          <li>You <strong>MUST verify all information independently</strong> before making calls</li>
          <li>AI-generated insights are <strong>informational only</strong>, not legal counsel</li>
          <li>Using this tool does <strong>NOT guarantee compliance</strong> with any law</li>
          <li>You will <strong>consult a qualified TCPA attorney</strong> before calling</li>
        </ul>

        <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="color: #991b1b; font-weight: 700; margin: 0;">
            ⚠️ TCPA violations: $500-$1,500 PER CALL
          </p>
        </div>
      </div>

      <!-- What you can do -->
      <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What Echo Safe Does:</h3>
      <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Checks phone numbers</strong> against the FTC DNC registry</li>
        <li><strong>Provides AI-generated risk analysis</strong> (informational only)</li>
        <li><strong>Stores leads</strong> in your private CRM</li>
        <li><strong>Maintains audit logs</strong> of our checks (not your calls)</li>
      </ul>

      <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What YOU Must Do:</h3>
      <ul style="color: #4b5563; margin: 16px 0; padding-left: 20px; line-height: 1.8;">
        <li><strong>Verify all data independently</strong> before making calls</li>
        <li><strong>Consult a TCPA compliance attorney</strong></li>
        <li><strong>Obtain proper consent</strong> for mobile/autodialer calls</li>
        <li><strong>Maintain your own call records</strong> (5 years minimum)</li>
        <li><strong>Check state-specific DNC lists</strong></li>
      </ul>

      <p style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </p>

      <p style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl.replace('/dashboard', '/legal/user-obligations')}" style="color: #0d9488; text-decoration: underline; font-weight: 600;">
          Read Full Legal Obligations →
        </a>
      </p>

      <p style="margin-top: 24px;">If you have questions about using our data tools, reply to this email.</p>

      <p style="margin-bottom: 0;">Best regards,<br><strong>The Echo Safe Team</strong></p>

      <!-- Footer Disclaimer -->
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 11px; color: #9ca3af; line-height: 1.6;">
          Echo Safe is a data checking tool, not a compliance solution or legal service.
          We do not provide legal advice. You are solely responsible for compliance with
          TCPA, TSR, and all applicable telemarketing laws. Using Echo Safe does not
          guarantee compliance with any law. Consult a qualified attorney before making calls.
        </p>
      </div>
    </div>
  `);
}

export const welcomeEmailSubject = 'Welcome to Echo Safe - Important Legal Information';
