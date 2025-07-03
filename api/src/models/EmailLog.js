const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientEmail: { type: String, required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailCampaign' },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAutomation' },
  subject: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'], 
    default: 'sent' 
  },
  sendGridMessageId: { type: String },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date },
  openedAt: { type: Date },
  clickedAt: { type: Date },
  bouncedAt: { type: Date },
  failureReason: { type: String },
  // Track clicks and opens
  opens: [{ 
    timestamp: { type: Date, default: Date.now },
    userAgent: { type: String },
    ip: { type: String }
  }],
  clicks: [{ 
    timestamp: { type: Date, default: Date.now },
    url: { type: String },
    userAgent: { type: String },
    ip: { type: String }
  }]
});

module.exports = mongoose.model('EmailLog', EmailLogSchema);
