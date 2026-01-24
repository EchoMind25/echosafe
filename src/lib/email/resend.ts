import { Resend } from 'resend';

// Lazy initialization to prevent build errors when API key is not set
let _resend: Resend | null = null;

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set - emails will not be sent');
    return null;
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Backward compatibility - this will be null if API key is missing
export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : (null as unknown as Resend);

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL
  ? `${process.env.RESEND_FROM_NAME || 'Echo Safe'} <${process.env.RESEND_FROM_EMAIL}>`
  : 'Echo Safe <noreply@echosafe.app>';

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
