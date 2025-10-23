const userService = require('../services/userService');

async function getUsersFromMongoDB(req, res, next) {
  try {
    const { page = 1, limit = 100, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };
    
    const result = await userService.getUsersFromMongoDB(options);
    
    // Format users với backup codes message
    const formattedUsers = result.users.map(user => {
      let backupCodesMessage = 'No backup codes available';
      
      if (user.backupCodes) {
        const activeCodes = user.backupCodes.backupCodes.filter(code => !code.used).length;
        const totalCodes = user.backupCodes.backupCodes.length;
        const codesList = user.backupCodes.backupCodes.map(code => code.code).join(', ');
        
        backupCodesMessage = `Backup Codes (${activeCodes}/${totalCodes} active): ${codesList}`;
      }
      
      return {
        ...user,
        backupCodesMessage
      };
    });
    
    res.json({
      success: true,
      data: formattedUsers,
      pagination: result.pagination
    });
  } catch (err) {
    handleError(err, res, next);
  }
}

async function getUserFromMongoDB(req, res, next) {
  try {
    const { userKey } = req.params;
    const user = await userService.getUserFromMongoDB(userKey);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found in MongoDB'
      });
    }
    
    // Format backup codes message
    let backupCodesMessage = 'No backup codes available';
    
    if (user.backupCodes) {
      const activeCodes = user.backupCodes.backupCodes.filter(code => !code.used).length;
      const totalCodes = user.backupCodes.backupCodes.length;
      const codesList = user.backupCodes.backupCodes.map(code => code.code).join(', ');
      
      backupCodesMessage = `Backup Codes (${activeCodes}/${totalCodes} active): ${codesList}`;
    }
    
    res.json({
      success: true,
      data: {
        ...user,
        backupCodesMessage
      }
    });
  } catch (err) {
    handleError(err, res, next);
  }
}

async function getBackupCodesFromMongoDB(req, res, next) {
  try {
    const { userKey } = req.params;
    const backupCodes = await userService.getBackupCodesFromMongoDB(userKey);
    
    if (!backupCodes) {
      return res.status(404).json({
        success: false,
        error: 'Backup codes not found in MongoDB'
      });
    }
    
    res.json({
      success: true,
      data: backupCodes
    });
  } catch (err) {
    handleError(err, res, next);
  }
}

function handleError(err, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ 
    success: false,
    error: message 
  });
}

module.exports = {
  getUsersFromMongoDB,
  getUserFromMongoDB,
  getBackupCodesFromMongoDB
};
