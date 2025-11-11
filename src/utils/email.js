/**
 * Email Utility
 * Handles sending emails (password reset, verification, etc.)
 */

import logger from './logger';

/**
 * Email Configuration
 * TODO: Configure with real email service in production
 */
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@diginvoice.com',
  fromName: process.env.EMAIL_FROM_NAME || 'DigInvoice ERP',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@diginvoice.com',
};

/**
 * Send Email (Mock Implementation)
 *
 * In production, replace with:
 * - Nodemailer (SMTP)
 * - SendGrid
 * - Amazon SES
 * - Mailgun
 * - Resend
 *
 * @param {object} options - Email options
 * @returns {Promise<object>} - Result
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    // ========================================
    // DEVELOPMENT MODE - Log Email
    // ========================================

    if (process.env.NODE_ENV === 'development') {
      logger.info('📧 Email (Development Mode - Not Sent)', {
        to,
        subject,
        from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
        textPreview: text?.substring(0, 100) || 'No text content',
      });

      // Log full email content for debugging
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL CONTENT (Development)');
      console.log('='.repeat(80));
      console.log(`To: ${to}`);
      console.log(`From: ${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`);
      console.log(`Subject: ${subject}`);
      console.log('-'.repeat(80));
      console.log('TEXT VERSION:');
      console.log(text || 'No text version');
      console.log('-'.repeat(80));
      console.log('HTML VERSION:');
      console.log(html || 'No HTML version');
      console.log('='.repeat(80) + '\n');

      return {
        success: true,
        messageId: `dev-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        mode: 'development',
        message: 'Email logged to console (not sent)',
      };
    }

    // ========================================
    // PRODUCTION MODE - Send Real Email
    // ========================================

    // TODO: Implement real email sending
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `${EMAIL_CONFIG.fromName} <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      mode: 'production',
    };
    */

    // Placeholder for production
    logger.warning('Email service not configured in production', { to, subject });

    return {
      success: false,
      error: 'Email service not configured',
      message: 'Please configure email service in production',
    };
  } catch (error) {
    logger.error('Send email error', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send Password Reset Email
 * @param {object} options - Email options
 * @returns {Promise<object>}
 */
export async function sendPasswordResetEmail({ to, name, resetUrl, resetToken, expiryMinutes }) {
  const subject = 'Password Reset Request - DigInvoice ERP';

  const text = `
Hello ${name},

You requested to reset your password for your DigInvoice ERP account.

Click the link below to reset your password:
${resetUrl}

Or copy and paste this link into your browser:
${resetUrl}

This link will expire in ${expiryMinutes} minutes for security reasons.

If you did not request this password reset, please ignore this email or contact support if you have concerns.

Security Tips:
- Never share your password with anyone
- Use a strong, unique password
- Enable two-factor authentication (coming soon)

---
DigInvoice ERP Team
${EMAIL_CONFIG.replyTo}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background: #5568d3;
    }
    .warning {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔐 Password Reset Request</h1>
    <p>DigInvoice ERP</p>
  </div>

  <div class="content">
    <p>Hello <strong>${name}</strong>,</p>

    <p>You requested to reset your password for your DigInvoice ERP account.</p>

    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Your Password</a>
    </p>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background: #f4f4f4; padding: 10px; border-radius: 5px;">
      ${resetUrl}
    </p>

    <div class="warning">
      <strong>⏰ Important:</strong> This link will expire in <strong>${expiryMinutes} minutes</strong> for security reasons.
    </div>

    <p><strong>If you did not request this password reset:</strong></p>
    <ul>
      <li>Please ignore this email</li>
      <li>Your password will remain unchanged</li>
      <li>Contact support if you have security concerns</li>
    </ul>

    <p><strong>Security Tips:</strong></p>
    <ul>
      <li>Never share your password with anyone</li>
      <li>Use a strong, unique password</li>
      <li>Enable two-factor authentication (coming soon)</li>
      <li>Review your active sessions regularly</li>
    </ul>
  </div>

  <div class="footer">
    <p>
      <strong>DigInvoice ERP</strong><br>
      Questions? Contact us at ${EMAIL_CONFIG.replyTo}
    </p>
    <p style="font-size: 11px; color: #999;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({ to, subject, text, html });
}

/**
 * Send Password Reset Success Email
 * @param {object} options - Email options
 * @returns {Promise<object>}
 */
export async function sendPasswordResetSuccessEmail({ to, name, loginUrl }) {
  const subject = 'Password Successfully Reset - DigInvoice ERP';

  const text = `
Hello ${name},

Your password has been successfully reset.

You can now login with your new password at:
${loginUrl}

If you did not make this change, please contact our support team immediately at ${EMAIL_CONFIG.replyTo}.

For your security:
- All your active sessions have been terminated
- You will need to login again with your new password
- Review your account activity regularly

---
DigInvoice ERP Team
${EMAIL_CONFIG.replyTo}
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .button {
      display: inline-block;
      background: #11998e;
      color: white;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .success {
      background: #d4edda;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin: 20px 0;
    }
    .alert {
      background: #f8d7da;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Password Reset Successful</h1>
    <p>DigInvoice ERP</p>
  </div>

  <div class="content">
    <p>Hello <strong>${name}</strong>,</p>

    <div class="success">
      <strong>✅ Success!</strong> Your password has been successfully reset.
    </div>

    <p>You can now login with your new password:</p>

    <p style="text-align: center;">
      <a href="${loginUrl}" class="button">Login Now</a>
    </p>

    <div class="alert">
      <strong>⚠️ Security Notice:</strong><br>
      If you did not make this change, please contact our support team immediately at
      <a href="mailto:${EMAIL_CONFIG.replyTo}">${EMAIL_CONFIG.replyTo}</a>
    </div>

    <p><strong>What happened:</strong></p>
    <ul>
      <li>Your password was successfully changed</li>
      <li>All active sessions have been terminated</li>
      <li>You will need to login again with your new password</li>
    </ul>

    <p><strong>Security Recommendations:</strong></p>
    <ul>
      <li>Review your account activity regularly</li>
      <li>Never share your password with anyone</li>
      <li>Use a unique password for this account</li>
      <li>Enable two-factor authentication (coming soon)</li>
    </ul>
  </div>

  <div class="footer">
    <p>
      <strong>DigInvoice ERP</strong><br>
      Questions? Contact us at ${EMAIL_CONFIG.replyTo}
    </p>
    <p style="font-size: 11px; color: #999;">
      This is an automated email. Please do not reply to this message.
    </p>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({ to, subject, text, html });
}

/**
 * Configuration Guide
 *
 * Add to .env.local:
 *
 * # Email Configuration
 * EMAIL_FROM=noreply@yourdomain.com
 * EMAIL_FROM_NAME=Your App Name
 * EMAIL_REPLY_TO=support@yourdomain.com
 *
 * # SMTP (if using Nodemailer)
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=465
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password
 *
 * # SendGrid
 * SENDGRID_API_KEY=your-sendgrid-api-key
 *
 * # AWS SES
 * AWS_SES_REGION=us-east-1
 * AWS_SES_ACCESS_KEY=your-access-key
 * AWS_SES_SECRET_KEY=your-secret-key
 */
