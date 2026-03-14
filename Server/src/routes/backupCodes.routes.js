const express = require('express');
const router = express.Router();
const backupCodesController = require('../controllers/backupCodesController');

/**
 * Routes for managing Google Workspace backup verification codes
 */

// GET /api/backup-codes/saved - Get all saved backup codes from JSON file
router.get('/saved', backupCodesController.getAllSavedCodes);

// GET /api/backup-codes/saved/:userKey - Get saved backup codes for specific user
router.get('/saved/:userKey', backupCodesController.getSavedCodes);

// GET /api/backup-codes/:userKey - List all active backup verification codes
router.get('/:userKey', backupCodesController.listCodes);

// POST /api/backup-codes/:userKey/generate - Generate new backup verification codes
router.post('/:userKey/generate', backupCodesController.generateCodes);

// POST /api/backup-codes/:userKey/invalidate - Invalidate all backup verification codes
router.post('/:userKey/invalidate', backupCodesController.invalidateCodes);

// GET /api/backup-codes/:userKey/status - Get user's 2-step verification status
router.get('/:userKey/status', backupCodesController.getUserStatus);

module.exports = router;
