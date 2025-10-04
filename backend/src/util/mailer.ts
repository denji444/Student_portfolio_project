import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'no-reply@example.com';
const EMAIL_TIMEOUT = Number(process.env.EMAIL_TIMEOUT || 30000); // 30 seconds default

const DEFAULT_REPLY_TO = process.env.REPLY_TO_EMAIL || '';

let smtpTransporter: nodemailer.Transporter | null = null;

try {
  console.log('[Mailer] Checking SMTP configuration...');
  console.log('[Mailer] SMTP_HOST:', SMTP_HOST ? 'SET' : 'MISSING');
  console.log('[Mailer] SMTP_USER:', SMTP_USER ? 'SET' : 'MISSING');
  console.log('[Mailer] SMTP_PASS:', SMTP_PASS ? 'SET' : 'MISSING');
  console.log('[Mailer] SMTP_PORT:', SMTP_PORT);
  
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    console.log('[Mailer] Creating SMTP transporter...');
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Add timeout configurations
      connectionTimeout: 60000, // Increase timeout for production
      greetingTimeout: 30000, 
      socketTimeout: 60000,
      // Connection pooling to reuse connections
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      // Enhanced TLS configuration for production
      tls: {
        rejectUnauthorized: false, // More lenient for production issues
        ciphers: 'SSLv3'
      },
      // Add debug for production
      debug: process.env.NODE_ENV === 'production',
      logger: process.env.NODE_ENV === 'production'
    });
    
    // Verify connection configuration on startup (non-blocking)
    smtpTransporter.verify((error, success) => {
      if (error) {
        console.error('[Mailer] SMTP verification failed:', error.message);
        console.log('[Mailer] Will attempt to send emails anyway (verification can fail but sending might work)');
        // Don't set transporter to null - let it try to send emails anyway
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
  if (!smtpTransporter) {
    throw new Error('No email provider configured');
  }

  const mailOptions = {
    from: MAIL_FROM,
    to,
    subject,
    text,
    html,
    replyTo: replyTo || DEFAULT_REPLY_TO || undefined
  };

  try {
    // Create a promise with timeout
    const sendPromise = smtpTransporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Email sending timeout')), EMAIL_TIMEOUT);
    });

    // Race between sending and timeout
    const result = await Promise.race([sendPromise, timeoutPromise]);
    console.log('[Mailer] Email sent successfully to:', to);
    return result;
  } catch (error: any) {
    console.error('[Mailer] Failed to send email to:', to, 'Error:', error.message);
    
    // Provide more specific error messages
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

// Add a function to send emails with retry logic
export async function sendEmailWithRetry(to: string, subject: string, text: string, html?: string, replyTo?: string, maxRetries: number = 3) {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendEmail(to, subject, text, html, replyTo);
      return; // Success, exit the function
    } catch (error: any) {
      lastError = error;
      console.warn(`[Mailer] Attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      // Don't retry on authentication errors
      if (error.code === 'EAUTH') {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
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


