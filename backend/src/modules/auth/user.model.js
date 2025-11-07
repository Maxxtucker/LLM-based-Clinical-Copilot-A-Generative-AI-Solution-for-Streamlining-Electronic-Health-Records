const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    // legacy support (some old records might have this); do not use going forward
    password: { type: String, select: false },

    name: { type: String },
    roles: { type: [String], default: ['user'] },

    // Profile fields
    phone: { type: String },
    role: { type: String },
    department: { type: String },
    employeeId: { type: String },
    joinDate: { type: String }, // keep as string for simplicity (YYYY-MM-DD)
    address: { type: String },

    // Avatar metadata (store URL, not binary)
    avatarUrl: { type: String },
    avatarKey: { type: String },
    avatarETag: { type: String },
    avatarUpdatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
