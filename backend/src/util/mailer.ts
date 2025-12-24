import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'no-reply@example.com';
const EMAIL_TIMEOUT = Number(process.env.EMAIL_TIMEOUT || 60000); // 60 seconds for production

// Provider selection
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

// Gmail API OAuth envs
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || '';
const GMAIL_SENDER = process.env.GMAIL_SENDER || MAIL_FROM;

let smtpTransporter: nodemailer.Transporter | null = null;
let gmailOAuthClient: OAuth2Client | null = null;

try {
  console.log('[Mailer] Email provider:', EMAIL_PROVIDER);
  if (EMAIL_PROVIDER === 'gmail_api') {
    console.log('[Mailer] Checking Gmail API env configuration...');
    console.log('[Mailer] GMAIL_CLIENT_ID:', GMAIL_CLIENT_ID ? 'SET' : 'MISSING');
    console.log('[Mailer] GMAIL_CLIENT_SECRET:', GMAIL_CLIENT_SECRET ? 'SET' : 'MISSING');
    console.log('[Mailer] GMAIL_REFRESH_TOKEN:', GMAIL_REFRESH_TOKEN ? 'SET' : 'MISSING');
    console.log('[Mailer] GMAIL_REDIRECT_URI:', GMAIL_REDIRECT_URI ? 'SET' : 'MISSING');
  } else {
    console.log('[Mailer] Checking SMTP configuration...');
    console.log('[Mailer] SMTP_HOST:', SMTP_HOST ? 'SET' : 'MISSING');
    console.log('[Mailer] SMTP_USER:', SMTP_USER ? 'SET' : 'MISSING');
    console.log('[Mailer] SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
    console.log('[Mailer] SMTP_PORT:', SMTP_PORT);
  }

  if (EMAIL_PROVIDER === 'gmail_api') {
    if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN && GMAIL_REDIRECT_URI) {
      console.log('[Mailer] Initializing Gmail OAuth2 client...');
      gmailOAuthClient = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);
      gmailOAuthClient.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });
      console.log('[Mailer] Gmail API ready. Emails will be sent via Gmail API.');
    } else {
      console.warn('[Mailer] Gmail API envs incomplete. Email sending will be disabled.');
    }
  } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log('[Mailer] Creating SMTP transporter...');
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Enhanced timeout configuration for production
      connectionTimeout: EMAIL_TIMEOUT,
      greetingTimeout: 30000,
      socketTimeout: EMAIL_TIMEOUT,
      // Connection pooling
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // TLS configuration
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' ? false : true,
        ciphers: 'SSLv3'
      }
    });

    // Verify connection (non-blocking)
    smtpTransporter.verify((error, success) => {
      if (error) {
        console.error('[Mailer] SMTP verification failed:', error.message);
        console.log('[Mailer] Will attempt to send emails anyway');
      } else {
        console.log('[Mailer] SMTP server is ready to take our messages');
      }
    });
  } else {
    console.warn('[Mailer] SMTP configuration incomplete. Email sending will be disabled.');
  }
} catch (error: any) {
  console.error('[Mailer] Failed to create SMTP transporter:', error.message);
  smtpTransporter = null;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string, replyTo?: string) {
  if (EMAIL_PROVIDER === 'gmail_api') {
    if (!gmailOAuthClient) throw new Error('No email provider configured');

    try {
      // Acquire access token using refresh token
      const { token } = await gmailOAuthClient.getAccessToken();
      if (!token) throw new Error('Failed to acquire Gmail access token');

      const gmail = google.gmail({ version: 'v1', auth: gmailOAuthClient });

      // Build raw RFC822 message
      const from = GMAIL_SENDER || MAIL_FROM;
      const headers = [
        `From: ${from}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        html ? 'Content-Type: text/html; charset="UTF-8"' : 'Content-Type: text/plain; charset="UTF-8"',
        replyTo ? `Reply-To: ${replyTo}` : undefined,
      ].filter(Boolean).join('\r\n');

      const body = html || text || '';
      const rawMessage = Buffer.from(`${headers}\r\n\r\n${body}`)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: rawMessage },
      });

      console.log('[Mailer] Email sent successfully to:', to, '(Gmail API)');
      return { accepted: [to], provider: 'gmail_api' } as any;
    } catch (error: any) {
      console.error('[Mailer] Gmail API send failed for', to, 'Error:', error.message);
      if (error.message?.includes('invalid_grant')) {
        throw new Error('Gmail token invalid or expired. Re-authorize to get a new refresh token.');
      }
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // SMTP path
  if (!smtpTransporter) throw new Error('No email provider configured');

  const mailOptions = {
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo: replyTo || process.env.REPLY_TO_EMAIL || undefined
  };

  try {
    // Send without artificial timeout - let nodemailer handle its own timeouts
    const result = await smtpTransporter.sendMail(mailOptions);
    console.log('[Mailer] Email sent successfully to:', to);
    return result;
  } catch (error: any) {
    console.error('[Mailer] Failed to send email to:', to, 'Error:', error.message);

    // Provide better error messages
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      throw new Error('Email service timeout. Please try again later.');
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to email server. Please try again later.');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please contact support.');
    } else {
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }
}

// Keep the retry logic but update it to use the new sendEmail
export async function sendEmailWithRetry(to: string, subject: string, text: string, html?: string, replyTo?: string, maxRetries = 3) {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Mailer] Sending email (attempt ${attempt}/${maxRetries})`);
      await sendEmail(to, subject, text, html, replyTo);
      return; // Success
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[Mailer] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[Mailer] Failed after ${maxRetries} attempts:`, lastError.message);
  throw lastError;
}

// Add graceful shutdown for connection pool
export function closeMailer() {
  if (smtpTransporter) {
    smtpTransporter.close();
    console.log('[Mailer] Connection pool closed');
  }
}

export const renderCommentHtml = (params: { studentName: string; projectTitle: string; comment: string; projectId: string; appUrl?: string }) => {
  const { studentName, projectTitle, comment, projectId, appUrl } = params;
  const safe = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const link = appUrl || '';
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7fb;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <tr><td style="padding:20px 24px">
    <h2 style="margin:0 0 8px;color:#0f172a">New admin comment on your project</h2>
    <p style="margin:0 0 12px;color:#4b5563">Hello ${safe(studentName)}, an admin commented on <strong>${safe(projectTitle)}</strong>:</p>
    <blockquote style="margin:12px 0;padding:12px 16px;background:#f9fafb;border-left:3px solid #0ea5e9;border-radius:8px">${safe(comment)}</blockquote>
    ${link ? `<p style="margin:16px 0"><a href="${link}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block">View activity</a></p>` : ''}
    <p style="margin:16px 0 0;color:#6b7280;font-size:12px">This is an automated message, please do not reply.</p>
  </td></tr></table>
  </body></html>`;
};


