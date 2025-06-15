const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  lineArt: { type: String, required: true }, // Path or URL to JPG file
  startDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g., "14:00"
  endDate: { type: Date, required: true },
  endTime: { type: String, required: true },   // e.g., "16:00"
  download: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      timestamp: { type: Date, required: true }
    }
  ],
  submissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Submission' }],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);