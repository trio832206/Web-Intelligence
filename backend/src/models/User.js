import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashed_password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'premium'], default: 'user' },
  date_of_birth: { type: Date },
  phone: { type: String, unique: true, sparse: true },
  phone_verified: { type: Boolean, default: false },
  premium_expires_at: { type: Date },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  accent: { type: String, default: 'green' },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

UserSchema.virtual('id').get(function() {
  return this._id;
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema, 'users');
