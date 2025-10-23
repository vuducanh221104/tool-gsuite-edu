const { createAdminDirectoryClient } = require('../lib/googleAuth');
const { pruneEmpty } = require('../utils/prune');
const backupCodesService = require('./backupCodesService');
const User = require('../models/User');
const BackupCodes = require('../models/BackupCodes');

function buildUserResourceFromBody(body, { forPatch = false } = {}) {
  const {
    firstName,
    lastName,
    email,
    password,
    orgUnitPath,
    recoveryEmail,
    recoveryPhone,
    suspended,
    changePasswordAtNextLogin,
    workPhone,
    homePhone,
    mobilePhone,
    workAddress,
    homeAddress,
    workSecondaryEmail,
    homeSecondaryEmail,
    employeeId,
    employeeType,
    employeeTitle,
    managerEmail,
    department,
    costCenter,
    buildingId,
    floorName,
    floorSection,
    notes,
    language,
  } = body || {};

  const phones = [];
  if (workPhone) phones.push({ type: 'work', value: workPhone });
  if (homePhone) phones.push({ type: 'home', value: homePhone });
  if (mobilePhone) phones.push({ type: 'mobile', value: mobilePhone });

  const emails = [];
  if (workSecondaryEmail) emails.push({ type: 'work', address: workSecondaryEmail });
  if (homeSecondaryEmail) emails.push({ type: 'home', address: homeSecondaryEmail });

  const addresses = [];
  if (workAddress) addresses.push({ type: 'work', formatted: workAddress });
  if (homeAddress) addresses.push({ type: 'home', formatted: homeAddress });

  const organizations = [];
  const workOrg = {};
  if (department) workOrg.department = department;
  if (employeeType) workOrg.employeeType = employeeType;
  if (employeeTitle) workOrg.title = employeeTitle;
  if (costCenter) workOrg.costCenter = costCenter;
  if (Object.keys(workOrg).length > 0) organizations.push({ type: 'work', ...workOrg });

  const externalIds = [];
  if (employeeId) externalIds.push({ type: 'organization', value: employeeId });

  const relations = [];
  if (managerEmail) relations.push({ type: 'manager', value: managerEmail });

  const locations = [];
  if (buildingId || floorName || floorSection) {
    locations.push({ type: 'desk', buildingId, floorName, floorSection });
  }

  const languages = [];
  if (language) languages.push({ languageCode: language });

  const name = (firstName || lastName) ? { givenName: firstName, familyName: lastName } : undefined;

  const base = {
    primaryEmail: email,
    password,
    name,
    orgUnitPath,
    recoveryEmail,
    recoveryPhone,
    suspended,
    changePasswordAtNextLogin,
    phones,
    emails,
    addresses,
    organizations,
    externalIds,
    relations,
    locations,
    notes: notes ? { value: notes } : undefined,
    languages,
  };

  return pruneEmpty(base);
}

async function createUser(body) {
  if (!body || !body.email || !body.password || !body.firstName || !body.lastName) {
    const e = new Error('firstName, lastName, email, password là bắt buộc');
    e.status = 400;
    throw e;
  }

  const admin = createAdminDirectoryClient();
  const userResource = buildUserResourceFromBody(body);
  const { data } = await admin.users.insert({ requestBody: userResource });
  
  // Lưu user vào MongoDB
  try {
    const userData = {
      googleId: data.id,
      primaryEmail: data.primaryEmail,
      name: {
        givenName: data.name?.givenName || body.firstName,
        familyName: data.name?.familyName || body.lastName
      },
      isAdmin: data.isAdmin || false,
      isDelegatedAdmin: data.isDelegatedAdmin || false,
      creationTime: new Date(data.creationTime),
      customerId: data.customerId,
      orgUnitPath: data.orgUnitPath || '/',
      isMailboxSetup: data.isMailboxSetup || false,
      suspended: body.suspended || false,
      changePasswordAtNextLogin: body.changePasswordAtNextLogin || false,
      recoveryEmail: body.recoveryEmail,
      recoveryPhone: body.recoveryPhone,
      workPhone: body.workPhone,
      homePhone: body.homePhone,
      mobilePhone: body.mobilePhone,
      workAddress: body.workAddress,
      homeAddress: body.homeAddress,
      workSecondaryEmail: body.workSecondaryEmail,
      homeSecondaryEmail: body.homeSecondaryEmail,
      employeeId: body.employeeId,
      employeeType: body.employeeType,
      employeeTitle: body.employeeTitle,
      managerEmail: body.managerEmail,
      department: body.department,
      costCenter: body.costCenter,
      buildingId: body.buildingId,
      floorName: body.floorName,
      floorSection: body.floorSection,
      notes: body.notes,
      language: body.language
    };
    
    const savedUser = await User.create(userData);
    console.log(`✅ User saved to MongoDB: ${savedUser.primaryEmail}`);
  } catch (mongoError) {
    console.error('❌ Error saving user to MongoDB:', mongoError.message);
  }
  
  // Tích hợp API backup codes sau khi tạo user thành công
  try {
    console.log(`User created successfully: ${data.primaryEmail}`);
    console.log('Fetching backup codes from Google API...');
    
    // Lấy backup codes từ Google API
    const backupCodesResult = await backupCodesService.listVerificationCodes(data.primaryEmail);
    
    if (backupCodesResult.success && backupCodesResult.data && backupCodesResult.data.items) {
      // Lưu backup codes vào response
      data.backupCodes = backupCodesResult.data.items.map(item => item.code || item.verificationCode);
      data.backupCodesCount = backupCodesResult.data.items.length;
      console.log(`Retrieved ${data.backupCodesCount} backup codes for ${data.primaryEmail}`);
      
      // Lưu backup codes vào MongoDB và cập nhật reference trong user
      try {
        const backupCodesDoc = await BackupCodes.createForUser(data.primaryEmail, data.id, data.backupCodes);
        // Cập nhật reference trong user
        await User.findOneAndUpdate(
          { primaryEmail: data.primaryEmail },
          { backupCodes: backupCodesDoc._id }
        );
        console.log(`✅ Backup codes saved to MongoDB for ${data.primaryEmail}`);
      } catch (mongoError) {
        console.error('❌ Error saving backup codes to MongoDB:', mongoError.message);
      }
    } else {
      console.log('No backup codes found, attempting to generate new codes...');
      data.backupCodesMessage = `No existing backup codes found: ${backupCodesResult.error}`;
      
      // Nếu không có backup codes, thử generate codes mới
      const generateResult = await backupCodesService.generateVerificationCodes(data.primaryEmail);
      
      if (generateResult.success) {
        console.log('Generate API succeeded, fetching codes...');
        
        // Sau khi generate thành công, lấy codes bằng list API
        const listResult = await backupCodesService.listVerificationCodes(data.primaryEmail);
        
        if (listResult.success && listResult.data && listResult.data.items) {
          data.backupCodes = listResult.data.items.map(item => item.code || item.verificationCode);
          data.backupCodesCount = listResult.data.items.length;
          data.backupCodesMessage = `Generated ${data.backupCodesCount} new backup codes`;
          console.log(`Retrieved ${data.backupCodesCount} backup codes after generation`);
          
          // Lưu backup codes vào MongoDB và cập nhật reference trong user
          try {
            const backupCodesDoc = await BackupCodes.createForUser(data.primaryEmail, data.id, data.backupCodes);
            // Cập nhật reference trong user
            await User.findOneAndUpdate(
              { primaryEmail: data.primaryEmail },
              { backupCodes: backupCodesDoc._id }
            );
            console.log(`✅ Generated backup codes saved to MongoDB for ${data.primaryEmail}`);
          } catch (mongoError) {
            console.error('❌ Error saving generated backup codes to MongoDB:', mongoError.message);
          }
        } else {
          data.backupCodes = [];
          data.backupCodesCount = 0;
          data.backupCodesMessage = `Generated successfully but no codes retrieved: ${listResult.error}`;
          console.log('Generated but could not retrieve codes:', listResult.error);
        }
      } else {
        console.log('Could not generate backup codes:', generateResult.error);
        data.backupCodes = [];
        data.backupCodesCount = 0;
        data.backupCodesMessage = `Backup codes not available: ${generateResult.error}`;
      }
    }
  } catch (error) {
    console.error('Error retrieving/generating backup codes:', error.message);
    data.backupCodes = [];
    data.backupCodesCount = 0;
    data.backupCodesMessage = 'Error retrieving backup codes: ' + error.message;
    data.backupCodesError = error.message;
  }
  
  return data;
}

async function updateUser(userKey, body) {
  if (!userKey) {
    const e = new Error('userKey là bắt buộc');
    e.status = 400;
    throw e;
  }
  const admin = createAdminDirectoryClient();
  const requestBody = buildUserResourceFromBody(body, { forPatch: true });
  const { data } = await admin.users.patch({ userKey, requestBody });
  return data;
}

async function deleteUser(userKey) {
  if (!userKey) {
    const e = new Error('userKey là bắt buộc');
    e.status = 400;
    throw e;
  }
  const admin = createAdminDirectoryClient();
  await admin.users.delete({ userKey });
}

// MongoDB methods
async function getUsersFromMongoDB(options = {}) {
  try {
    const { page = 1, limit = 100, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find({})
      .populate('backupCodes')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await User.countDocuments({});
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting users from MongoDB:', error.message);
    throw error;
  }
}

async function getUserFromMongoDB(userKey) {
  try {
    const user = await User.findOne({ primaryEmail: userKey }).lean();
    if (user && user.backupCodes) {
      const backupCodes = await BackupCodes.findById(user.backupCodes).lean();
      user.backupCodes = backupCodes;
    }
    return user;
  } catch (error) {
    console.error('Error getting user from MongoDB:', error.message);
    throw error;
  }
}

async function getBackupCodesFromMongoDB(userKey) {
  try {
    const backupCodes = await BackupCodes.findByUserEmail(userKey);
    return backupCodes;
  } catch (error) {
    console.error('Error getting backup codes from MongoDB:', error.message);
    throw error;
  }
}

module.exports = { 
  createUser, 
  updateUser, 
  deleteUser, 
  buildUserResourceFromBody,
  getUsersFromMongoDB,
  getUserFromMongoDB,
  getBackupCodesFromMongoDB
};

async function listUsers(options = {}) {
  const admin = createAdminDirectoryClient();
  const { pageToken, maxResults = 100, orderBy = 'email', sortOrder = 'ASCENDING', domain } = options;
  const params = {
    maxResults,
    orderBy,
    sortOrder,
  };
  if (domain) params.domain = domain;
  else params.customer = 'my_customer';
  if (pageToken) params.pageToken = pageToken;

  const { data } = await admin.users.list(params);
  return { users: data.users || [], nextPageToken: data.nextPageToken || null };
}

async function listAllUsers(options = {}) {
  const admin = createAdminDirectoryClient();
  const { domain, chunkSize = 500, orderBy = 'email', sortOrder = 'ASCENDING' } = options;
  let pageToken = undefined;
  const all = [];
  do {
    const params = {
      maxResults: chunkSize,
      orderBy,
      sortOrder,
    };
    if (domain) params.domain = domain;
    else params.customer = 'my_customer';
    if (pageToken) params.pageToken = pageToken;
    const { data } = await admin.users.list(params);
    if (data.users && data.users.length) all.push(...data.users);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return all;
}

module.exports.listUsers = listUsers;
module.exports.listAllUsers = listAllUsers;


