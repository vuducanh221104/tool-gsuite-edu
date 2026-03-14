const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { createAdminDirectoryClient, loadGoogleServiceAccountCredentials } = require('../lib/googleAuth');

/**
 * Helper function to get access token
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  try {
    const { clientEmail, privateKeyRaw } = loadGoogleServiceAccountCredentials();

    if (!privateKeyRaw) {
      throw new Error('No private key found');
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/admin.directory.user.security',
      ],
      subject: process.env.GOOGLE_IMPERSONATE_SUBJECT,
    });

    const { token } = await auth.getAccessToken();
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

/**
 * Service for managing Google Workspace backup verification codes
 * Uses REST API directly since Node.js client may not support verificationCodes methods
 */
class BackupCodesService {
  constructor() {
    this.backupCodesFilePath = path.join(__dirname, '../data/google_backup_codes.json');
    this.ensureDataDirectory();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    const dataDir = path.dirname(this.backupCodesFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Load existing backup codes from JSON file
   * @returns {Object} Existing backup codes data
   */
  loadBackupCodes() {
    try {
      if (fs.existsSync(this.backupCodesFilePath)) {
        const data = fs.readFileSync(this.backupCodesFilePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading backup codes:', error);
    }
    return {};
  }

  /**
   * Save backup codes to JSON file
   * @param {Object} data - Backup codes data to save
   */
  saveBackupCodes(data) {
    try {
      fs.writeFileSync(this.backupCodesFilePath, JSON.stringify(data, null, 2));
      console.log(`Backup codes saved to ${this.backupCodesFilePath}`);
    } catch (error) {
      console.error('Error saving backup codes:', error);
    }
  }

  /**
   * List all active backup verification codes for a user using REST API
   * @param {string} userKey - User's email or ID
   * @returns {Promise<Object>} List of verification codes
   */
  async listVerificationCodes(userKey) {
    try {
      const token = await getAccessToken();
      const baseUrl = 'https://admin.googleapis.com/admin/directory/v1';
      const url = `${baseUrl}/users/${encodeURIComponent(userKey)}/verificationCodes`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Save backup codes to JSON file if we have codes
        if (data && data.items && data.items.length > 0) {
          const existingData = this.loadBackupCodes();
          const timestamp = new Date().toISOString();
          
          existingData[userKey] = {
            email: userKey,
            backupCodes: data.items.map(item => item.code || item.verificationCode),
            retrievedAt: timestamp,
            codesCount: data.items.length,
            status: 'active'
          };

          this.saveBackupCodes(existingData);
          console.log(`Saved ${data.items.length} backup codes for ${userKey} to JSON file`);
        }

        return {
          success: true,
          data: data,
          message: 'Verification codes retrieved successfully'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to list verification codes',
          details: data
        };
      }
    } catch (error) {
      console.error('Error listing verification codes:', error);
      return {
        success: false,
        error: error.message || 'Failed to list verification codes',
        details: null
      };
    }
  }

  /**
   * Generate new backup verification codes for a user using REST API
   * This will invalidate all existing codes and create new ones
   * @param {string} userKey - User's email or ID
   * @returns {Promise<Object>} New verification codes
   */
  async generateVerificationCodes(userKey) {
    try {
      const token = await getAccessToken();
      const baseUrl = 'https://admin.googleapis.com/admin/directory/v1';
      const url = `${baseUrl}/users/${encodeURIComponent(userKey)}/verificationCodes/generate`;
      
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          success: false,
          error: 'Invalid JSON response from Google API',
          details: { responseText, status: response.status }
        };
      }
      
      if (response.ok) {
        // Handle 204 No Content response (successful generation but no data returned)
        if (response.status === 204) {
          console.log('Generate API returned 204 - codes generated successfully but no data returned');
          return { 
            success: true, 
            data: { items: [] }, 
            message: 'Verification codes generated successfully (204 response)' 
          };
        }
        
        // Save backup codes to JSON file
        if (data && data.items) {
          const existingData = this.loadBackupCodes();
          const timestamp = new Date().toISOString();
          
          existingData[userKey] = {
            email: userKey,
            backupCodes: data.items.map(item => item.code),
            generatedAt: timestamp,
            codesCount: data.items.length
          };

          this.saveBackupCodes(existingData);
          
          console.log(`Generated ${data.items.length} backup codes for ${userKey}`);
          console.log(`Codes: ${data.items.map(item => item.code).join(', ')}`);
        }

        return {
          success: true,
          data: data,
          message: 'New verification codes generated successfully'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to generate verification codes',
          details: data
        };
      }
    } catch (error) {
      console.error('Error generating verification codes:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate verification codes',
        details: null
      };
    }
  }

  /**
   * Invalidate all backup verification codes for a user using REST API
   * @param {string} userKey - User's email or ID
   * @returns {Promise<Object>} Result of invalidation
   */
  async invalidateVerificationCodes(userKey) {
    try {
      const token = await getAccessToken();
      const baseUrl = 'https://admin.googleapis.com/admin/directory/v1';
      const url = `${baseUrl}/users/${encodeURIComponent(userKey)}/verificationCodes/invalidate`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        // Update JSON file to mark codes as invalidated
        const existingData = this.loadBackupCodes();
        if (existingData[userKey]) {
          existingData[userKey].invalidatedAt = new Date().toISOString();
          existingData[userKey].status = 'invalidated';
          this.saveBackupCodes(existingData);
          console.log(`Backup codes invalidated for ${userKey}`);
        }

        return {
          success: true,
          data: data,
          message: 'All verification codes invalidated successfully'
        };
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to invalidate verification codes',
          details: data
        };
      }
    } catch (error) {
      console.error('Error invalidating verification codes:', error);
      return {
        success: false,
        error: error.message || 'Failed to invalidate verification codes',
        details: null
      };
    }
  }

  /**
   * Get user's 2-step verification status
   * @param {string} userKey - User's email or ID
   * @returns {Promise<Object>} User's 2SV status
   */
  async getUserSecuritySettings(userKey) {
    try {
      const admin = createAdminDirectoryClient();
      
      const response = await admin.users.get({
        userKey: userKey,
        projection: 'full',
        fields: 'id,primaryEmail,isEnforcedIn2Sv,isEnrolledIn2Sv'
      });

      return {
        success: true,
        data: {
          id: response.data.id,
          email: response.data.primaryEmail,
          isEnforcedIn2Sv: response.data.isEnforcedIn2Sv,
          isEnrolledIn2Sv: response.data.isEnrolledIn2Sv
        },
        message: 'User security settings retrieved successfully'
      };
    } catch (error) {
      console.error('Error getting user security settings:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user security settings',
        details: error.response?.data || null
      };
    }
  }

  /**
   * Get all saved backup codes from JSON file
   * @returns {Object} All backup codes data
   */
  getAllSavedBackupCodes() {
    return this.loadBackupCodes();
  }

  /**
   * Get saved backup codes for a specific user
   * @param {string} userKey - User's email or ID
   * @returns {Object|null} User's backup codes data
   */
  getSavedBackupCodes(userKey) {
    const data = this.loadBackupCodes();
    return data[userKey] || null;
  }
}

module.exports = new BackupCodesService();
