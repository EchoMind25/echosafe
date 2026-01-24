export const BRAND_COLOR = '#1E40AF';
export const BRAND_COLOR_LIGHT = '#3B82F6';

export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Echo Safe</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: ${BRAND_COLOR};
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px;
    }
    .content h2 {
      color: ${BRAND_COLOR};
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 20px;
    }
    .content p {
      margin: 0 0 16px;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      background-color: ${BRAND_COLOR};
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      margin: 24px 0;
    }
    .button:hover {
      background-color: ${BRAND_COLOR_LIGHT};
    }
    .footer {
      padding: 24px 40px;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer p {
      margin: 0 0 8px;
      font-size: 12px;
      color: #6b7280;
    }
    .footer a {
      color: ${BRAND_COLOR};
      text-decoration: none;
    }
    .privacy-notice {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px 10px;
      }
      .header, .content, .footer {
        padding-left: 24px;
        padding-right: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Echo Safe</h1>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Echo Safe. All rights reserved.</p>
        <p>
          <a href="https://echosafe.app/privacy">Privacy Policy</a> |
          <a href="https://echosafe.app/terms">Terms of Service</a>
        </p>
        <div class="privacy-notice">
          <p>Your privacy matters. We never sell or share your personal data with third parties for marketing purposes. You can delete your account and all associated data at any time from your dashboard settings.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
