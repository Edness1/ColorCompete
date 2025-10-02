const mongoose = require('mongoose');

const EmailAutomationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: false },
  triggerType: { 
    type: String, 
    enum: ['daily_winner', 'monthly_winner', 'winner_reward', 'welcome', 'subscription_expired', 'contest_announcement', 'voting_results', 'comment_feedback', 'weekly_summary', 'monthly_drawing_lite', 'monthly_drawing_pro', 'monthly_drawing_champ', 'monthly_drawing_lite_participant', 'monthly_drawing_pro_participant', 'monthly_drawing_champ_participant', 'admin_broadcast'], 
    required: true 
  },
  emailTemplate: {
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    textContent: { type: String }
  },
  // Schedule settings for scheduled automations
  schedule: {
    time: { type: String }, // "09:00" format for daily automations
    dayOfMonth: { type: Number }, // 1-31 for monthly automations
    dayOfWeek: { type: Number }, // 0-6 for weekly automations (0 = Sunday)
    timezone: { type: String, default: 'America/New_York' }
  },
  // Winner reward settings
  rewardSettings: {
    giftCardAmount: { type: Number, default: 25 },
    giftCardMessage: { type: String, default: 'Congratulations on winning the ColorCompete contest!' }
  },
  // Monthly drawing settings
  monthlyDrawingSettings: {
    subscriptionTier: { type: String, enum: ['lite', 'pro', 'champ'] },
    prizeAmount: { type: Number },
    drawingDate: { type: Number, min: 1, max: 31, default: 1 } // Day of month to run drawing
  },
  // Statistics
  totalSent: { type: Number, default: 0 },
  lastTriggered: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EmailAutomationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Don't require createdBy on updates - only on initial creation
  if (this.isNew && !this.createdBy) {
    return next(new Error('createdBy is required for new automations'));
  }
  next();
});

module.exports = mongoose.model('EmailAutomation', EmailAutomationSchema);
