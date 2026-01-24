import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SupabaseWebhookPayload {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    email_confirmed_at?: string | null;
    raw_user_meta_data?: {
      full_name?: string;
    };
    confirmation_token?: string;
    recovery_token?: string;
  };
  old_record?: {
    email_confirmed_at?: string | null;
  };
}

/**
 * Supabase Auth Webhook Handler
 *
 * Configure in Supabase Dashboard > Database > Webhooks
 * URL: https://your-domain.com/api/auth/webhook
 * Events: INSERT, UPDATE on auth.users
 *
 * To use custom emails via Resend instead of Supabase defaults:
 * 1. Disable Supabase email templates in Auth settings
 * 2. Configure this webhook to handle auth events
 * 3. Ensure RESEND_API_KEY is set
 */
export async function POST(request: NextRequest) {
  // Verify webhook secret (configure in Supabase)
  const webhookSecret = request.headers.get('x-supabase-webhook-secret');
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;

  if (expectedSecret && webhookSecret !== expectedSecret) {
    console.error('[Auth Webhook] Invalid webhook secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload: SupabaseWebhookPayload = await request.json();
    const { type, record, old_record } = payload;

    console.log(`[Auth Webhook] Received ${type} event for user:`, record.id);

    // Handle new user signup - send verification email
    if (type === 'INSERT' && record.confirmation_token && !record.email_confirmed_at) {
      const verificationLink = `${APP_URL}/auth/callback?token=${record.confirmation_token}&type=signup`;
      await sendVerificationEmail(record.email, verificationLink);
      console.log('[Auth Webhook] Sent verification email to:', record.email);
    }

    // Handle email verification completion - send welcome email
    if (
      type === 'UPDATE' &&
      !old_record?.email_confirmed_at &&
      record.email_confirmed_at
    ) {
      const fullName = record.raw_user_meta_data?.full_name || 'there';
      await sendWelcomeEmail(record.email, fullName);
      console.log('[Auth Webhook] Sent welcome email to:', record.email);
    }

    // Handle password reset request
    if (type === 'UPDATE' && record.recovery_token) {
      const resetLink = `${APP_URL}/auth/callback?token=${record.recovery_token}&type=recovery`;
      await sendPasswordResetEmail(record.email, resetLink);
      console.log('[Auth Webhook] Sent password reset email to:', record.email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Auth Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
