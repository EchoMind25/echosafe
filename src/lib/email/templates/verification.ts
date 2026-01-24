import { baseTemplate } from './base';

export interface VerificationEmailParams {
  verificationLink: string;
}

export function verificationEmail({ verificationLink }: VerificationEmailParams): string {
  return baseTemplate(`
    <div class="content">
      <h2>Verify Your Email Address</h2>
      <p>Thanks for signing up for Echo Safe!</p>
      <p>Please click the button below to verify your email address and activate your account. This link will expire in 24 hours.</p>
      <p style="text-align: center;">
        <a href="${verificationLink}" class="button">Verify Email Address</a>
      </p>
      <p>If you didn't create an account with Echo Safe, you can safely ignore this email.</p>
      <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationLink}" style="color: #1E40AF; word-break: break-all;">${verificationLink}</a>
      </p>
    </div>
  `);
}

export const verificationEmailSubject = 'Verify your Echo Safe email';
