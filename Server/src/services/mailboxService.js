const { google } = require('googleapis');
const { createGoogleJwtClient } = require('../lib/googleAuth');

function decodeBase64Url(value) {
  if (!value) return '';
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized + '='.repeat(4 - padding) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
}

function getHeader(headers = [], name) {
  const found = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return found?.value || '';
}

function stripHtml(html = '') {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBodyParts(payload) {
  if (!payload) {
    return { text: '', html: '' };
  }

  const textParts = [];
  const htmlParts = [];

  function walk(part) {
    if (!part) return;

    const mimeType = part.mimeType || '';
    const data = part.body?.data;

    if (data) {
      if (mimeType === 'text/plain') {
        textParts.push(decodeBase64Url(data));
      } else if (mimeType === 'text/html') {
        htmlParts.push(decodeBase64Url(data));
      }
    }

    if (Array.isArray(part.parts)) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);

  return {
    text: textParts.join('\n\n').trim(),
    html: htmlParts.join('\n\n').trim(),
  };
}

async function createGmailClientForUser(userKey) {
  const auth = createGoogleJwtClient({
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    subject: userKey,
  });

  await auth.authorize();
  return google.gmail({ version: 'v1', auth });
}

class MailboxService {
  async listMessages(userKey, options = {}) {
    const gmail = await createGmailClientForUser(userKey);
    const maxResults = Math.min(Number(options.maxResults) || 20, 100);

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken: options.pageToken,
      q: options.q,
      includeSpamTrash: false,
    });

    const baseMessages = response.data.messages || [];

    const messages = await Promise.all(
      baseMessages.map(async (message) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date'],
        });

        const payload = detail.data.payload || {};
        const headers = payload.headers || [];

        return {
          id: detail.data.id,
          threadId: detail.data.threadId,
          snippet: detail.data.snippet || '',
          internalDate: detail.data.internalDate || '',
          from: getHeader(headers, 'From'),
          to: getHeader(headers, 'To'),
          subject: getHeader(headers, 'Subject') || '(No subject)',
          date: getHeader(headers, 'Date'),
        };
      })
    );

    return {
      userKey,
      messages,
      nextPageToken: response.data.nextPageToken || null,
      resultSizeEstimate: response.data.resultSizeEstimate || 0,
    };
  }

  async getMessage(userKey, messageId) {
    const gmail = await createGmailClientForUser(userKey);

    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const payload = response.data.payload || {};
    const headers = payload.headers || [];
    const body = extractBodyParts(payload);

    return {
      id: response.data.id,
      threadId: response.data.threadId,
      snippet: response.data.snippet || '',
      internalDate: response.data.internalDate || '',
      from: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      subject: getHeader(headers, 'Subject') || '(No subject)',
      date: getHeader(headers, 'Date'),
      bodyText: body.text || stripHtml(body.html),
    };
  }
}

module.exports = new MailboxService();
