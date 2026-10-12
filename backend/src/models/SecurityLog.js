import mongoose from 'mongoose';

const SecurityLogSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ip_address: { type: String, default: '127.0.0.1' },
  event_type: { type: String, required: true },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

SecurityLogSchema.virtual('id').get(function() {
  return this._id;
});

export const SecurityLog = mongoose.models.SecurityLog || mongoose.model('SecurityLog', SecurityLogSchema, 'security_logs');
