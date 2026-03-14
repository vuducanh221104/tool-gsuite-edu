const backupCodesService = require('../services/backupCodesService');

/**
 * Controller for managing Google Workspace backup verification codes
 */
class BackupCodesController {
  /**
   * List all active backup verification codes for a user
   * GET /api/backup-codes/:userKey
   */
  async listCodes(req, res) {
    try {
      const { userKey } = req.params;
      
      if (!userKey) {
        return res.status(400).json({
          success: false,
          error: 'User key is required'
        });
      }

      const result = await backupCodesService.listVerificationCodes(userKey);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error in listCodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Generate new backup verification codes for a user
   * POST /api/backup-codes/:userKey/generate
   */
  async generateCodes(req, res) {
    try {
      const { userKey } = req.params;
      
      if (!userKey) {
        return res.status(400).json({
          success: false,
          error: 'User key is required'
        });
      }

      const result = await backupCodesService.generateVerificationCodes(userKey);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error in generateCodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Invalidate all backup verification codes for a user
   * POST /api/backup-codes/:userKey/invalidate
   */
  async invalidateCodes(req, res) {
    try {
      const { userKey } = req.params;
      
      if (!userKey) {
        return res.status(400).json({
          success: false,
          error: 'User key is required'
        });
      }

      const result = await backupCodesService.invalidateVerificationCodes(userKey);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error in invalidateCodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get user's 2-step verification status
   * GET /api/backup-codes/:userKey/status
   */
  async getUserStatus(req, res) {
    try {
      const { userKey } = req.params;
      
      if (!userKey) {
        return res.status(400).json({
          success: false,
          error: 'User key is required'
        });
      }

      const result = await backupCodesService.getUserSecuritySettings(userKey);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Controller error in getUserStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get all saved backup codes from JSON file
   * GET /api/backup-codes/saved
   */
  async getAllSavedCodes(req, res) {
    try {
      const includeStale = String(req.query.includeStale || '').toLowerCase() === 'true';
      const result = await backupCodesService.getAllSavedBackupCodes({ includeStale });
      res.json({
        success: true,
        data: result,
        message: includeStale
          ? 'All saved backup codes retrieved successfully (including stale records)'
          : 'Saved backup codes retrieved successfully (stale records excluded)'
      });
    } catch (error) {
      console.error('Controller error in getAllSavedCodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }

  /**
   * Get saved backup codes for a specific user
   * GET /api/backup-codes/saved/:userKey
   */
  async getSavedCodes(req, res) {
    try {
      const { userKey } = req.params;
      
      if (!userKey) {
        return res.status(400).json({
          success: false,
          error: 'User key is required'
        });
      }

      const result = backupCodesService.getSavedBackupCodes(userKey);
      
      if (result) {
        res.json({
          success: true,
          data: result,
          message: 'Saved backup codes retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'No saved backup codes found for this user'
        });
      }
    } catch (error) {
      console.error('Controller error in getSavedCodes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
}

module.exports = new BackupCodesController();
