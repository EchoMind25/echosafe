import { baseTemplate } from './base';

export interface UploadCompleteEmailParams {
  filename: string;
  stats: {
    totalLeads: number;
    cleanLeads: number;
    riskyLeads: number;
    blockedLeads: number;
    duplicatesRemoved: number;
  };
  resultsUrl: string;
}

export function uploadCompleteEmail({ filename, stats, resultsUrl }: UploadCompleteEmailParams): string {
  const safePercentage = stats.totalLeads > 0
    ? Math.round((stats.cleanLeads / stats.totalLeads) * 100)
    : 0;

  return baseTemplate(`
    <div class="content">
      <h2>Your Lead Scrub is Complete</h2>
      <p>Great news! Your file <strong>${filename}</strong> has been processed.</p>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Total Leads</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${stats.totalLeads.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #059669;">Clean (Safe to Call)</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">${stats.cleanLeads.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #d97706;">Risky (Review Needed)</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #d97706;">${stats.riskyLeads.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #dc2626;">Blocked (DNC)</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${stats.blockedLeads.toLocaleString()}</td>
          </tr>
          ${stats.duplicatesRemoved > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Duplicates Removed</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${stats.duplicatesRemoved.toLocaleString()}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="text-align: center; font-size: 18px; color: #1E40AF; font-weight: 600;">
        ${safePercentage}% of your leads are safe to call
      </p>

      <p style="text-align: center;">
        <a href="${resultsUrl}" class="button">View Results & Download</a>
      </p>

      <p style="font-size: 13px; color: #6b7280;">
        Results are available for 30 days. Download your clean leads now to save them permanently.
      </p>
    </div>
  `);
}

export const uploadCompleteEmailSubject = (filename: string) =>
  `Your lead scrub is complete: ${filename}`;
