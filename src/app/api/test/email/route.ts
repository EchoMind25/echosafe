import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendUploadCompleteEmail,
} from '@/lib/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoints are disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { type, to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail(to, body.name || 'Test User');
        break;

      case 'verification':
        result = await sendVerificationEmail(
          to,
          body.verificationLink || `${APP_URL}/auth/verify?token=test-token-123`
        );
        break;

      case 'password-reset':
        result = await sendPasswordResetEmail(
          to,
          body.resetLink || `${APP_URL}/auth/reset-password?token=test-token-456`
        );
        break;

      case 'upload-complete':
        result = await sendUploadCompleteEmail(
          to,
          body.filename || 'test-leads.csv',
          body.stats || {
            totalLeads: 1500,
            cleanLeads: 1200,
            riskyLeads: 200,
            blockedLeads: 100,
            duplicatesRemoved: 45,
          },
          body.jobId || 'test-job-789'
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `${type} email sent successfully`,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
