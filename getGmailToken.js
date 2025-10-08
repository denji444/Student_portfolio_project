const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  '639493630511-u79b0lm4fhip0h44tobr8ldmmdqob1o6.apps.googleusercontent.com',
  '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',
  'http://localhost:8080/oauth2callback'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

async function getAccessToken() {
  const authUrl = oauth2Client.generateAuthUrl({
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

  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh token:', tokens.refresh_token);
  return tokens.refresh_token;
}

getAccessToken().catch(console.error);