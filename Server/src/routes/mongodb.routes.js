const express = require('express');
const router = express.Router();
const mongodbController = require('../controllers/mongodbController');

// MongoDB routes
router.get('/users', mongodbController.getUsersFromMongoDB);
router.get('/users/:userKey', mongodbController.getUserFromMongoDB);
router.get('/users/:userKey/backup-codes', mongodbController.getBackupCodesFromMongoDB);

module.exports = router;
