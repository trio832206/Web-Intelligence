import mongoose from 'mongoose';

const CrawlJobSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  url: { type: String, required: true },
  depth: { type: Number, default: 1 },
  status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
  error_message: { type: String, default: null },
  session_id: { type: String, default: null },
  research_prompt: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: false
});

CrawlJobSchema.virtual('id').get(function() {
  return this._id;
});

export const CrawlJob = mongoose.models.CrawlJob || mongoose.model('CrawlJob', CrawlJobSchema, 'crawl_jobs');
