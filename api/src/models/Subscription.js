const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tier: { type: String, enum: ['free', 'lite', 'pro', 'champ'], required: true },
  remaining_submissions: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true }
}, { timestamps: true });

// Ensure only one subscription document per user per month/year
SubscriptionSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);