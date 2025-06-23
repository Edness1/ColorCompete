const mongoose = require('mongoose');

const ContestAnalyticsSchema = new mongoose.Schema({
  contest_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  downloads: {
    type: Number,
    default: 0,
  },
  submissions: {
    type: Number,
    default: 0,
  },
  votes: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ContestAnalytics', ContestAnalyticsSchema);