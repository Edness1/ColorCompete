const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tier: { type: String, enum: ['free', 'lite', 'pro', 'champ'], required: true, default: 'free' },
  remaining_submissions: { type: Number, required: true, default: 2 },
  // Tracks when the monthly counter was last reset; used to auto-reset when a new month starts
  lastResetAt: { type: Date, required: true, default: () => new Date() }
}, { timestamps: true });

// Index userId for lookups
SubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);