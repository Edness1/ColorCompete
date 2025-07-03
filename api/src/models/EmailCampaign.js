const mongoose = require('mongoose');

const EmailCampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  htmlContent: { type: String, required: true },
  textContent: { type: String },
  recipientCount: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  openedCount: { type: Number, default: 0 },
  clickedCount: { type: Number, default: 0 },
  bouncedCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'], 
    default: 'draft' 
  },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Target audience criteria
  targetAudience: {
    allMembers: { type: Boolean, default: true },
    subscriptionTypes: [{ type: String }], // ['basic', 'premium']
    userSegments: [{ type: String }], // ['active', 'inactive', 'new']
    specificUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
});

EmailCampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EmailCampaign', EmailCampaignSchema);
