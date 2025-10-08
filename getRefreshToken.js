const { google } = require('google-auth-library');
const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function getAccessToken() {
  const oAuth2Client = new OAuth2Client(
    '',  // Your Client ID
    '',  // Your Client Secret
    'http://localhost:8080/oauth2callback'
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this URL:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const code = await new Promise(resolve => {
    rl.question('Enter the code from that page here: ', resolve);
  });

  rl.close();

  const { tokens } = await oAuth2Client.getToken(code);
  console.log('Refresh token:', tokens.refresh_token);
  return tokens.refresh_token;
}

getAccessToken().catch(console.error);