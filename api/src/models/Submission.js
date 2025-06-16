const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User
  file_path: { type: String, required: true },
  age_group: { type: String, required: true },
  contest_type: { type: String, required: true },
  status: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of User IDs who voted
  created_at: { type: String, required: true },
  challenge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true }, // Reference to Challenge
  profiles: {
    username: { type: String },
    avatar_url: { type: String }
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);