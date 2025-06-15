const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  profilePicture: { type: String, required: true }, // Path or URL to JPG file
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
  language: { type: String },
  subscription: {
    type: { type: String }, // e.g., "basic", "premium"
    id: { type: String } // Stripe subscription ID
  },
  badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);