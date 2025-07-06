const mongoose = require('mongoose');

const EmailAutomationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: false },
  triggerType: { 
    type: String, 
    enum: ['daily_winner', 'monthly_winner', 'winner_reward', 'welcome', 'subscription_expired', 'contest_announcement', 'voting_results', 'comment_feedback', 'weekly_summary'], 
    required: true 
  },
  emailTemplate: {
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    textContent: { type: String }
  },
  // Schedule settings for daily/monthly automations
  schedule: {
    time: { type: String }, // "09:00" format for daily automations
    dayOfMonth: { type: Number }, // 1-31 for monthly automations
    timezone: { type: String, default: 'America/New_York' }
  },
  // Winner reward settings
  rewardSettings: {
    giftCardAmount: { type: Number, default: 25 },
    giftCardMessage: { type: String, default: 'Congratulations on winning the ColorCompete contest!' }
  },
  // Statistics
  totalSent: { type: Number, default: 0 },
  lastTriggered: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmailAutomationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailAutomation', EmailAutomationSchema);
