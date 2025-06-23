const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tier: { type: String, enum: ['free', 'lite', 'pro', 'champ'], required: true },
  remaining_submissions: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);