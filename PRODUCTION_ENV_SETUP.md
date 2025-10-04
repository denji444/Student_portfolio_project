# Production Environment Setup

## Issue: Email verification works on localhost but fails in production

**Error:** `No email provider configured`

**Cause:** SMTP environment variables are not set in the production environment.

## Solutions by Platform:

### **Render.com**
1. Go to your backend service dashboard
2. Click "Environment" tab
3. Add these environment variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_character_app_password
   MAIL_FROM=noreply@yourdomain.com
   EMAIL_TIMEOUT=30000
   NODE_ENV=production
   ```
4. Click "Save Changes"
5. Your service will automatically redeploy

### **Vercel**
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the same variables as above
4. Redeploy your application

### **Railway**
1. Go to your project dashboard
2. Click "Variables" tab
3. Add the environment variables
4. Redeploy

### **Heroku**
1. Go to your app dashboard
2. Click "Settings" → "Config Vars"
3. Add the environment variables
4. The app will restart automatically

### **Docker/VPS Deployment**
1. Create `.env` file in your backend directory:
   ```bash
   # SSH into your server
   cd /path/to/your/backend
   nano .env
   ```

2. Add the environment variables:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   MAIL_FROM=noreply@yourdomain.com
   EMAIL_TIMEOUT=30000
   NODE_ENV=production
   ```

3. Restart your application:
   ```bash
   pm2 restart your-app
   # or
   docker-compose restart
   ```

## **Gmail App Password Setup (Required for Gmail SMTP)**

1. **Enable 2-Factor Authentication:**
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn on

2. **Generate App Password:**
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use the 16-character password (not your regular Gmail password)

## **Alternative Email Providers for Production**

### **SendGrid (Recommended)**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### **Mailgun**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your_mailgun_username
SMTP_PASS=your_mailgun_password
```

## **Verification Steps**

1. **Check Environment Variables:**
   - Add a temporary log in your backend to verify variables are loaded
   - Check deployment platform's environment variable section

2. **Test After Deployment:**
   - Try signing up with a real email
   - Check backend logs for success message:
     `[Mailer] SMTP server is ready to take our messages`

3. **Monitor Logs:**
   - Look for: `[Signup] Verification email sent to: email@example.com`
   - If still failing, check the specific error message

## **Security Notes**

- Never commit `.env` files to git
- Use different email credentials for production vs development
- Consider using dedicated email service (SendGrid/Mailgun) for production
- Rotate credentials regularly

## **Troubleshooting**

If you still see "No email provider configured":

1. **Verify all required variables are set:**
   ```
   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
   ```

2. **Check variable names match exactly** (case-sensitive)

3. **Restart/redeploy** after adding variables

4. **Check deployment logs** for any startup errors
