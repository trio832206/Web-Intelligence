import mongoose from 'mongoose';

const PendingRegistrationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  hashed_password: { type: String, required: true },
  date_of_birth: { type: Date, required: true },
  phone: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

PendingRegistrationSchema.virtual('id').get(function() {
  return this._id;
});

export const PendingRegistration = mongoose.models.PendingRegistration || 
  mongoose.model('PendingRegistration', PendingRegistrationSchema, 'pending_registrations');
