const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  primaryEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  name: {
    givenName: {
      type: String,
      required: true
    },
    familyName: {
      type: String,
      required: true
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isDelegatedAdmin: {
    type: Boolean,
    default: false
  },
  creationTime: {
    type: Date,
    default: Date.now
  },
  customerId: {
    type: String,
    required: true
  },
  orgUnitPath: {
    type: String,
    default: '/'
  },
  isMailboxSetup: {
    type: Boolean,
    default: false
  },
  suspended: {
    type: Boolean,
    default: false
  },
  changePasswordAtNextLogin: {
    type: Boolean,
    default: false
  },
  recoveryEmail: {
    type: String,
    lowercase: true
  },
  recoveryPhone: {
    type: String
  },
  // Additional fields
  workPhone: String,
  homePhone: String,
  mobilePhone: String,
  workAddress: String,
  homeAddress: String,
  workSecondaryEmail: {
    type: String,
    lowercase: true
  },
  homeSecondaryEmail: {
    type: String,
    lowercase: true
  },
  employeeId: String,
  employeeType: String,
  employeeTitle: String,
  managerEmail: {
    type: String,
    lowercase: true
  },
  department: String,
  costCenter: String,
  buildingId: String,
  floorName: String,
  floorSection: String,
  notes: String,
  language: String,
  // Reference to backup codes
  backupCodes: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BackupCodes'
  },
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
  collection: 'users'
});

// Indexes
userSchema.index({ primaryEmail: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ customerId: 1 });
userSchema.index({ createdAt: -1 });

// Methods
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.__v;
  return user;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ primaryEmail: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

userSchema.statics.findByCustomerId = function(customerId) {
  return this.find({ customerId });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
