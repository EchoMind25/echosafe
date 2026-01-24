// Resend client and config
export { resend, EMAIL_FROM, APP_URL } from './resend';

// Send utility functions
export {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendUploadCompleteEmail,
  type SendEmailResult,
} from './send';

// Templates (for direct use if needed)
export { welcomeEmail, welcomeEmailSubject } from './templates/welcome';
export { verificationEmail, verificationEmailSubject } from './templates/verification';
export { passwordResetEmail, passwordResetEmailSubject } from './templates/password-reset';
export { uploadCompleteEmail, uploadCompleteEmailSubject } from './templates/upload-complete';
export { baseTemplate, BRAND_COLOR, BRAND_COLOR_LIGHT } from './templates/base';
