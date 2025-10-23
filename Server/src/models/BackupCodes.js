const mongoose = require('mongoose');

// BackupCodes Schema
const backupCodesSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  googleUserId: {
    type: String,
    required: true,
    index: true
  },
  backupCodes: [{
    code: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  codesCount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: Date,
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'backup_codes'
});

// Indexes
backupCodesSchema.index({ userEmail: 1 });
backupCodesSchema.index({ googleUserId: 1 });
backupCodesSchema.index({ status: 1 });
backupCodesSchema.index({ generatedAt: -1 });

// Methods
backupCodesSchema.methods.toJSON = function() {
  const backupCodes = this.toObject();
  delete backupCodes.__v;
  return backupCodes;
};

backupCodesSchema.methods.getActiveCodes = function() {
  return this.backupCodes.filter(code => !code.used);
};

backupCodesSchema.methods.markCodeAsUsed = function(codeValue) {
  const code = this.backupCodes.find(c => c.code === codeValue && !c.used);
  if (code) {
    code.used = true;
    code.usedAt = new Date();
    this.lastUsedAt = new Date();
    this.updatedAt = new Date();
    return true;
  }
  return false;
};

backupCodesSchema.methods.addNewCodes = function(newCodes) {
  const codesToAdd = newCodes.map(codeValue => ({
    code: codeValue,
    createdAt: new Date(),
    used: false
  }));
  
  this.backupCodes.push(...codesToAdd);
  this.codesCount = this.backupCodes.length;
  this.generatedAt = new Date();
  this.updatedAt = new Date();
};

// Static methods
backupCodesSchema.statics.findByUserEmail = function(userEmail) {
  return this.findOne({ userEmail: userEmail.toLowerCase() });
};

backupCodesSchema.statics.findByGoogleUserId = function(googleUserId) {
  return this.findOne({ googleUserId });
};

backupCodesSchema.statics.findActiveByUserEmail = function(userEmail) {
  return this.findOne({ 
    userEmail: userEmail.toLowerCase(),
    status: 'active'
  });
};

backupCodesSchema.statics.createForUser = function(userEmail, googleUserId, codes) {
  const backupCodes = new this({
    userEmail: userEmail.toLowerCase(),
    googleUserId,
    backupCodes: codes.map(code => ({
      code,
      createdAt: new Date(),
      used: false
    })),
    codesCount: codes.length,
    status: 'active',
    generatedAt: new Date()
  });
  
  return backupCodes.save();
};

// Pre-save middleware
backupCodesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BackupCodes', backupCodesSchema);
