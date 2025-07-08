const mongoose = require('mongoose');

const MonthlyDrawingSchema = new mongoose.Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  subscriptionTier: { type: String, enum: ['lite', 'pro', 'champ'], required: true },
  prizeAmount: { type: Number, required: true },
  winner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    name: { type: String }
  },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    entryDate: { type: Date, default: Date.now }
  }],
  drawingDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  giftCardDetails: {
    giftCardId: { type: String },
    giftCardCode: { type: String },
    redeemUrl: { type: String },
    sentAt: { type: Date }
  },
  automationId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAutomation' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MonthlyDrawingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to ensure one drawing per tier per month
MonthlyDrawingSchema.index({ month: 1, year: 1, subscriptionTier: 1 }, { unique: true });

module.exports = mongoose.model('MonthlyDrawing', MonthlyDrawingSchema);
