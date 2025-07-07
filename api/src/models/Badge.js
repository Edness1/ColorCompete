const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // Icon name from lucide-react
  iconColor: { type: String, required: true }, // Color class for the icon
  type: { type: String, enum: ['win', 'participation', 'milestone', 'achievement'], required: true },
  criteria: {
    type: { type: String, enum: ['wins', 'consecutive_wins', 'votes', 'submissions', 'consecutive_submissions', 'top_votes', 'total_votes', 'submission_streak'], required: true },
    threshold: { type: Number, required: true },
    timeframe: { type: String, enum: ['all_time', 'consecutive'], default: 'all_time' }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Badge', BadgeSchema);