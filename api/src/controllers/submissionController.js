const Submission = require('../models/Submission');

// Create a new submission
exports.createSubmission = async (req, res) => {
  try {
    const submission = new Submission(req.body);
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    const submissions = await Submission.find(filter);
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a submission
exports.updateSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a submission
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/submissions/:id
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const submission = await Submission.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    res.status(200).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/submissions?challenge_id=xxxx
// Returns all submissions for a given challenge_id
exports.getSubmissionsByChallenge = async (req, res) => {
  try {
    const { challenge_id } = req.query;

    if (!challenge_id) {
      return res.status(400).json({ message: 'challenge_id is required' });
    }
    const submissions = await Submission.find({ challenge_id });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch submissions', error: err.message });
  }
};

// Check if user has voted for a submission
exports.checkUserVote = async (req, res) => {
  const { submissionId } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    const hasVoted = submission.votes && submission.votes.includes(user_id);
    res.json({ hasVoted: !!hasVoted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a vote
exports.addVote = async (req, res) => {
  const { submissionId } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    if (!submission.votes) submission.votes = [];
    if (!submission.votes.includes(user_id)) {
      submission.votes.push(user_id);
      await submission.save();
    }
    res.json({ success: true, contest_id: submission.challenge_id || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a vote
exports.removeVote = async (req, res) => {
  const { submissionId } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }

  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }
    if (submission.votes) {
      submission.votes = submission.votes.filter(id => id !== user_id);
      await submission.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to map submissions to leaderboard entry format
function mapToLeaderboardEntry(sub, index) {
  return {
    rank: index + 1,
    userId: sub.user_id,
    username: sub.profiles.username,
    avatarUrl: sub.profiles.avatar_url,
    score: sub.votes ? sub.votes.length : 0,
    submissionId: sub._id,
    submissionUrl: sub.file_path,
    contestType: sub.contest_type,
    ageGroup: sub.age_group,
    date: sub.created_at,
  };
}

// GET /api/submissions/current
exports.getCurrentLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const submissions = await Submission.find({ created_at: { $lte: now } })
      .lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.json(submissions.map(mapToLeaderboardEntry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/submissions/weekly
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    // Get the current date
    const now = new Date();
    // Get the day of the week (0 = Sunday, 1 = Monday, ...)
    const dayOfWeek = now.getDay(); // Change to 1 for Monday as start if needed
    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - dayOfWeek);

    const submissions = await Submission.find({ created_at: { $lte: startOfWeek } })
      .lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.json(submissions.map(mapToLeaderboardEntry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/submissions/monthly
exports.getMonthlyLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const submissions = await Submission.find({ created_at: { $gte: startOfMonth } })
      .lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.json(submissions.map(mapToLeaderboardEntry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/submissions/all-time
exports.getAllTimeLeaderboard = async (req, res) => {
  try {
    const submissions = await Submission.find({}).lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.json(submissions.map(mapToLeaderboardEntry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};