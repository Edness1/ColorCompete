const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  profilePicture: { type: String }, // Path or URL to JPG file
  createdDate: { type: Date, default: Date.now },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  website: { type: String },
  password: { type: String, required: true },
  loginNotification: { type: Boolean, default: false },
  emailPreferences: {
    marketingEmails: { type: Boolean, default: true },
    contestNotifications: { type: Boolean, default: true },
    winnerAnnouncements: { type: Boolean, default: true },
    rewardNotifications: { type: Boolean, default: true }
  },
  language: { type: String },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserBadge' }], // Array of user badges
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', UserSchema);