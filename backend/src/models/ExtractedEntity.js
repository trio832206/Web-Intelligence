import mongoose from 'mongoose';

const ExtractedEntitySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  job_id: { type: String, ref: 'CrawlJob', required: true, index: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  content_snippet: { type: String, default: '' },
  sentiment_score: { type: Number, default: 0.0 },
  sentiment_label: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
  named_entities: { type: [String], default: [] },
  extracted_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

ExtractedEntitySchema.virtual('id').get(function() {
  return this._id;
});

export const ExtractedEntity = mongoose.models.ExtractedEntity || mongoose.model('ExtractedEntity', ExtractedEntitySchema, 'extracted_entities');
