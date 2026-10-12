import mongoose from 'mongoose';

const AlertRuleSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  user_id: { type: String, default: null },
  keyword: { type: String, required: true },
  condition: { type: String, enum: ['contains', 'sentiment_negative', 'sentiment_positive'], default: 'contains' },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

AlertRuleSchema.virtual('id').get(function() {
  return this._id;
});

export const AlertRule = mongoose.models.AlertRule || mongoose.model('AlertRule', AlertRuleSchema, 'alert_rules');
