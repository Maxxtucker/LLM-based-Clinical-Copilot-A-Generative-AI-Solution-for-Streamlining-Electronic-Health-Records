const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String },
    roles: { type: [String], default: ['user'] },
    // Profile fields
    phone: { type: String },
    role: { type: String, default: 'user' },
    department: { type: String },
    employeeId: { type: String },
    joinDate: { type: String },
    address: { type: String },
    avatar: { type: String }, // store URL or base64 (small) string
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
