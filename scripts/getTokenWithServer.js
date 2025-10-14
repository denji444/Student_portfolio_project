const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const destroyer = require('server-destroy');

// Gmail send-only scope
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Read OAuth creds strictly from environment
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error('Missing required environment variables. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REDIRECT_URI.');
  process.exit(1);
}

// Use a dedicated port derived from REDIRECT_URI (avoid conflicts with Vite 8080 and backend 4000)
const LOCAL_PORT = (() => {
  try { return Number(new URL(REDIRECT_URI).port) || 80; } catch { return 8888; }
})();

function openBrowser(targetUrl) {
  const platform = process.platform;
  if (platform === 'win32') {
    // Use empty title argument and quote URL to avoid parsing issues
    exec(`start "" "${targetUrl}"`);
  } else if (platform === 'darwin') {
    exec(`open "${targetUrl}"`);
  } else {
    exec(`xdg-open "${targetUrl}"`);
  }
}

async function getAccessToken() {
  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // Force consent to ensure we get a refresh token
    response_type: 'code',
    include_granted_scopes: true,
  });

  return new Promise((resolve, reject) => {
    const server = http
      .createServer(async (req, res) => {
        try {
          const qs = new url.URL(req.url, `http://localhost:${LOCAL_PORT}`).searchParams;
          const code = qs.get('code');
          
          if (!code) {
            throw new Error('No authorization code received');
          }

          console.log('Received authorization code');
          
          const { tokens } = await oauth2Client.getToken(code);
          console.log('Successfully obtained tokens');
          
          res.end('Authentication successful! You can close this tab.');
          server.destroy();
          resolve(tokens.refresh_token);
        } catch (e) {
          console.error('Error during token exchange:', e.message);
          res.end(`Error: ${e.message}`);
          reject(e);
        }
      })
      .listen(LOCAL_PORT, () => {
        console.log('Opening auth URL in your browser...');
        console.log('If the browser does not open, copy this entire URL (single line) into the address bar:');
        console.log('\n' + authUrl + '\n');
        openBrowser(authUrl);
      });
      
    destroyer(server);
  });
}

getAccessToken()
  .then(token => {
    console.log('\nSuccess! Your refresh token is:');
    console.log(token);
    console.log('\nSave this token in your .env file as GMAIL_REFRESH_TOKEN');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to get refresh token:', error.message);
    process.exit(1);
  });