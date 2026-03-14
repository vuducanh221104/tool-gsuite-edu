const express = require('express');
const router = express.Router();
const mailboxController = require('../controllers/mailboxController');

// GET /api/mailbox/:userKey/messages
router.get('/:userKey/messages', mailboxController.listMessages);

// GET /api/mailbox/:userKey/messages/:messageId
router.get('/:userKey/messages/:messageId', mailboxController.getMessage);

module.exports = router;
