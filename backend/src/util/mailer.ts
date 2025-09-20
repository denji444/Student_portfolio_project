import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER || 'no-reply@example.com';

const DEFAULT_REPLY_TO = process.env.REPLY_TO_EMAIL || '';

let smtpTransporter: nodemailer.Transporter | null = null;

try {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    smtpTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
} catch {
  smtpTransporter = null;
}

export async function sendEmail(to: string, subject: string, text: string, html?: string, replyTo?: string) {
  if (smtpTransporter) {
    await smtpTransporter.sendMail({ from: MAIL_FROM, to, subject, text, html, replyTo: replyTo || DEFAULT_REPLY_TO || undefined });
    return;
  }
  throw new Error('No email provider configured');
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


