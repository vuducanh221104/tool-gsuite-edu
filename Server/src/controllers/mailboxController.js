const mailboxService = require('../services/mailboxService');

function normalizeError(error) {
  const status = error?.status || error?.code || 500;
  const apiMessage = error?.response?.data?.error?.message;

  return {
    status: Number.isInteger(status) ? status : 500,
    message: apiMessage || error?.message || 'Internal server error',
  };
}

class MailboxController {
  async listMessages(req, res) {
    try {
      const { userKey } = req.params;
      const { q, pageToken, maxResults } = req.query;

      if (!userKey) {
        return res.status(400).json({ success: false, error: 'User key is required' });
      }

      const data = await mailboxService.listMessages(userKey, {
        q,
        pageToken,
        maxResults,
      });

      return res.json({ success: true, data });
    } catch (error) {
      const normalized = normalizeError(error);
      return res.status(normalized.status).json({ success: false, error: normalized.message });
    }
  }

  async getMessage(req, res) {
    try {
      const { userKey, messageId } = req.params;

      if (!userKey || !messageId) {
        return res.status(400).json({ success: false, error: 'User key and message ID are required' });
      }

      const data = await mailboxService.getMessage(userKey, messageId);
      return res.json({ success: true, data });
    } catch (error) {
      const normalized = normalizeError(error);
      return res.status(normalized.status).json({ success: false, error: normalized.message });
    }
  }
}

module.exports = new MailboxController();
