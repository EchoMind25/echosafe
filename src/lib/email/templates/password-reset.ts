import { baseTemplate } from './base';

export interface PasswordResetEmailParams {
  resetLink: string;
}

export function passwordResetEmail({ resetLink }: PasswordResetEmailParams): string {
  return baseTemplate(`
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your password for your Echo Safe account.</p>
      <p>Click the button below to create a new password. This link will expire in 1 hour for security reasons.</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p><strong>Didn't request this?</strong></p>
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      <p>For security, we recommend enabling two-factor authentication on your account.</p>
      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #1E40AF; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
  `);
}

export const passwordResetEmailSubject = 'Reset your Echo Safe password';
