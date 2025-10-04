# Email Verification Setup Guide

This guide helps you configure email verification for the Student Portfolio application.

## Common Timeout Issues and Solutions

### Issue: Email verification always shows timeout error

**Root Causes:**
1. **Missing SMTP Configuration** - No email provider configured
2. **Incorrect SMTP Settings** - Wrong host, port, or credentials
3. **Network/Firewall Issues** - SMTP ports blocked
4. **Email Provider Limits** - Rate limiting or authentication issues
5. **Server Timeout** - Default timeouts too short for email sending

**Solutions Implemented:**

### 1. Enhanced SMTP Configuration
- Added connection timeout settings (30 seconds default)
- Added connection pooling for better performance
- Added retry logic with exponential backoff
- Added proper error handling with specific error messages

### 2. Environment Variables
Create a `.env` file in the `backend/` directory with:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=noreply@yourdomain.com
EMAIL_TIMEOUT=30000
```

### 3. Common SMTP Providers

#### Gmail Setup
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_character_app_password
```

**Important:** Use App Password, not your regular Gmail password
1. Enable 2-factor authentication
2. Go to Google Account settings
3. Generate App Password for "Mail"
4. Use the 16-character password

#### Outlook/Hotmail Setup
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

#### SendGrid Setup (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### 4. Testing Email Configuration

1. **Check SMTP Connection:**
   ```bash
   # The server will log SMTP verification on startup
   npm run dev
   # Look for: "[Mailer] SMTP server is ready to take our messages"
   ```

2. **Test Email Sending:**
   - Try signing up with a real email address
   - Check server logs for email sending status
   - Check spam/junk folders

### 5. Troubleshooting

#### Error: "No email provider configured"
- Ensure all SMTP environment variables are set
- Restart the server after adding environment variables

#### Error: "Email service timeout"
- Check your internet connection
- Verify SMTP host and port are correct
- Try increasing EMAIL_TIMEOUT value

#### Error: "Email authentication failed"
- Verify SMTP_USER and SMTP_PASS are correct
- For Gmail, ensure you're using App Password
- Check if 2FA is enabled and configured properly

#### Error: "Unable to connect to email server"
- Check if SMTP port (587/465) is blocked by firewall
- Try different SMTP provider
- Verify SMTP_HOST is correct

### 6. Production Considerations

1. **Use Dedicated Email Service:**
   - SendGrid, Mailgun, or AWS SES for reliability
   - Better deliverability and monitoring

2. **Environment Variables:**
   ```env
   NODE_ENV=production
   EMAIL_TIMEOUT=45000
   SMTP_HOST=smtp.sendgrid.net
   ```

3. **Monitoring:**
   - Check server logs for email sending failures
   - Monitor email delivery rates
   - Set up alerts for email service issues

### 7. Security Best Practices

1. **Never commit credentials to git**
2. **Use App Passwords instead of regular passwords**
3. **Rotate email credentials regularly**
4. **Use environment-specific configurations**
5. **Enable rate limiting for email endpoints**

### 8. Backup Options

If email continues to fail:

1. **Manual Verification:**
   - Admin can manually verify users in database
   - Update `email_confirmed_at` in Supabase Auth

2. **Alternative Verification:**
   - SMS verification
   - Social login (Google OAuth is already implemented)

## Files Modified

- `backend/src/util/mailer.ts` - Enhanced SMTP configuration and retry logic
- `backend/src/routes/auth.ts` - Updated to use retry email sending
- `backend/src/index.ts` - Added request timeout handling
- `frontend/src/lib/api.ts` - Added client-side timeout handling
- `backend/.env.example` - Sample environment configuration

The email verification system now has robust timeout handling, retry logic, and better error messages to prevent the timeout issues you were experiencing.
