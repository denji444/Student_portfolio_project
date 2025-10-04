import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'onboarding@resend.dev';

if (!RESEND_API_KEY) {
  console.warn('[Mailer] RESEND_API_KEY is not set. Email sending will be disabled.');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  replyTo?: string
) {
  if (!resend) {
    throw new Error('Email service not configured');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      text,
      html,
      reply_to: replyTo,
    });

    if (error) {
      console.error('[Mailer] Resend API error:', error);
      throw new Error('Failed to send email');
    }

    console.log('[Mailer] Email sent via Resend. ID:', data?.id);
    return data;
  } catch (error) {
    console.error('[Mailer] Error sending email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

// Keep the retry logic but update it to use the new sendEmail
export async function sendEmailWithRetry(
  to: string,
  subject: string,
  text: string,
  html?: string,
  replyTo?: string,
  maxRetries = 3
) {
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
  throw lastError!;
}

// Add graceful shutdown for connection pool
export function closeMailer() {
  // Resend doesn't need explicit cleanup
  console.log('[Mailer] Resend service ready');
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


