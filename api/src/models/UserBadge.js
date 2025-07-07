const mongoose = require('mongoose');

const UserBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge', required: true },
  earnedAt: { type: Date, default: Date.now },
  isVisible: { type: Boolean, default: true }, // User can choose to hide badges
  metadata: {
    // Additional data specific to when/how the badge was earned
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
    value: { type: Number } // The actual value that triggered the badge (e.g., 10 wins, 1000 votes)
  }
});

// Ensure a user can only earn each badge once
UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model('UserBadge', UserBadgeSchema);
