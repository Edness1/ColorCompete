const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  voting: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  image: { type: String, required: true }, // Path or URL to JPEG file
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Submission', SubmissionSchema);