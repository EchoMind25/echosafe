import { resend, EMAIL_FROM, APP_URL } from './resend';
import { welcomeEmail, welcomeEmailSubject } from './templates/welcome';
import { verificationEmail, verificationEmailSubject } from './templates/verification';
import { passwordResetEmail, passwordResetEmailSubject } from './templates/password-reset';
import { uploadCompleteEmail, uploadCompleteEmailSubject } from './templates/upload-complete';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<SendEmailResult> {
  try {
    const dashboardUrl = `${APP_URL}/dashboard`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: welcomeEmailSubject,
      html: welcomeEmail({ name, dashboardUrl }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send welcome email:', message);
    return { success: false, error: message };
  }
}

export async function sendVerificationEmail(
  to: string,
  verificationLink: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: verificationEmailSubject,
      html: verificationEmail({ verificationLink }),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send verification email:', message);
    return { success: false, error: message };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<SendEmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: passwordResetEmailSubject,
      html: passwordResetEmail({ resetLink }),
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send password reset email:', message);
    return { success: false, error: message };
  }
}

export async function sendUploadCompleteEmail(
  to: string,
  filename: string,
  stats: {
    totalLeads: number;
    cleanLeads: number;
    riskyLeads: number;
    blockedLeads: number;
    duplicatesRemoved: number;
  },
  jobId: string
): Promise<SendEmailResult> {
  try {
    const resultsUrl = `${APP_URL}/dashboard/results/${jobId}`;

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: uploadCompleteEmailSubject(filename),
      html: uploadCompleteEmail({ filename, stats, resultsUrl }),
    });

    if (error) {
      console.error('Failed to send upload complete email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send upload complete email:', message);
    return { success: false, error: message };
  }
}
