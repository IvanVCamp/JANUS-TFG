const { google } = require('googleapis');

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground" // URI de redireccionamiento (ajústalo si es necesario)
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: 'v1',
  auth: oauth2Client,
});

const sendEmail = async ({ to, subject, text, html }) => {
  const emailLines = [];
  emailLines.push(`From: "JANUS APP" <${process.env.GOOGLE_FROM_EMAIL}>`);
  emailLines.push(`To: ${to}`);
  emailLines.push(`Subject: ${subject}`);
  emailLines.push('MIME-Version: 1.0');
  emailLines.push('Content-Type: text/html; charset=utf-8');
  emailLines.push('');
  emailLines.push(html || text);
  const email = emailLines.join('\n');

  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
    console.log('Correo enviado a:', to);
    return res;
  } catch (error) {
    console.error('Error al enviar el correo:', error.response ? error.response.data : error);
    throw error;
  }
};

module.exports = sendEmail;
