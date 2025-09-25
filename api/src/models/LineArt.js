const mongoose = require('mongoose');

const LineArtSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  bwImageUrl: { type: String, required: true },
  keywords: { type: [String], default: [] },
  artStyle: { type: String, enum: ['anime', 'matisse', 'standard'], default: 'standard' },
  attribution: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

LineArtSchema.index({ date: 1 }, { unique: true });

LineArtSchema.pre('save', function(next) { this.updated_at = new Date(); next(); });

module.exports = mongoose.model('LineArt', LineArtSchema);
