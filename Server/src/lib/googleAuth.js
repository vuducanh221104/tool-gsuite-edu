const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function resolveCredentialsPath(credentialsPath) {
  if (!credentialsPath) return null;

  const candidates = [
    path.resolve(credentialsPath),
    path.resolve(process.cwd(), credentialsPath),
    path.resolve(__dirname, '..', credentialsPath),
    path.resolve(__dirname, '..', 'services', credentialsPath),
    path.resolve(__dirname, '..', '..', credentialsPath),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const err = new Error(
    `Cannot find credentials file from GOOGLE_APPLICATION_CREDENTIALS='${credentialsPath}'`
  );
  err.code = 'ENOENT';
  err.pathsTried = candidates;
  throw err;
}

function loadGoogleServiceAccountCredentials() {
  let clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  let privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;

  if ((!clientEmail || !privateKeyRaw) && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const resolvedPath = resolveCredentialsPath(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    const json = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    clientEmail = clientEmail || json.client_email;
    privateKeyRaw = privateKeyRaw || json.private_key;
  }

  return { clientEmail, privateKeyRaw };
}

/**
 * Create an authorized Google Admin SDK client using a Service Account
 * with Domain-Wide Delegation to impersonate a Workspace admin user.
 */
function createAdminDirectoryClient() {
  const { clientEmail, privateKeyRaw } = loadGoogleServiceAccountCredentials();

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

module.exports = { createAdminDirectoryClient, loadGoogleServiceAccountCredentials };


