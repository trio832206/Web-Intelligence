import mongoose from 'mongoose';

const AlertNotificationSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, default: null },
  rule_id: { type: String, ref: 'AlertRule', required: true },
  message: { type: String, required: true },
  url: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

AlertNotificationSchema.virtual('id').get(function() {
  return this._id;
});

export const AlertNotification = mongoose.models.AlertNotification || mongoose.model('AlertNotification', AlertNotificationSchema, 'alert_notifications');
