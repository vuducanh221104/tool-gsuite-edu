const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Create an authorized Google Admin SDK client using a Service Account
 * with Domain-Wide Delegation to impersonate a Workspace admin user.
 */
function createAdminDirectoryClient() {
  let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  // Support GOOGLE_APPLICATION_CREDENTIALS to load from JSON file
  if ((!clientEmail || !privateKeyRaw) && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credentialsPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const json = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    clientEmail = clientEmail || json.client_email;
    privateKeyRaw = privateKeyRaw || json.private_key;
  }

  const requiredNow = [
    ['GOOGLE_CLIENT_EMAIL', clientEmail],
    ['GOOGLE_PRIVATE_KEY', privateKeyRaw],
    ['GOOGLE_IMPERSONATE_SUBJECT', process.env.GOOGLE_IMPERSONATE_SUBJECT],
  ];

  for (const [name, value] of requiredNow) {
    if (!value) {
      throw new Error(`Missing required env var: ${name}`);
    }
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      'https://www.googleapis.com/auth/admin.directory.user',
    ],
    subject: process.env.GOOGLE_IMPERSONATE_SUBJECT,
  });

  // Debug log: which identity we are using (no secrets)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[auth] client_email:', clientEmail);
    console.log('[auth] subject:', process.env.GOOGLE_IMPERSONATE_SUBJECT);
  }

  const admin = google.admin({ version: 'directory_v1', auth });
  return admin;
}

module.exports = { createAdminDirectoryClient };


