const Submission = require('../models/Submission');
const BadgeService = require('../services/badgeService');

// Create a new submission (with server-side subscription deduction)
exports.createSubmission = async (req, res) => {
  const session = await Submission.startSession();
  session.startTransaction();
  try {
    const payload = req.body;
    // Basic validation
    if (!payload.user_id) {
      throw new Error('Missing user_id');
    }

    // Attempt to decrement subscription credit if available
    const Subscription = require('../models/Subscription');
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Only decrement if user has a subscription record and credits > 0
    const subscription = await Subscription.findOneAndUpdate(
      {
        userId: String(payload.user_id),
        month: currentMonth,
        year: currentYear,
        remaining_submissions: { $gt: 0 }
      },
      { $inc: { remaining_submissions: -1 } },
      { new: true }
    ).session(session);

    const submission = await Submission.create([payload], { session });
    const created = submission[0];

    // Badge processing (non-blocking but inside try for atomic success path)
    if (created.user_id) {
      try {
        await BadgeService.checkAndAwardBadges(created.user_id, 'submission', {
          submissionId: created._id,
          contestId: created.challenge_id
        });
      } catch (badgeError) {
        console.error('Error checking badges after submission:', badgeError);
      }
    }

    await session.commitTransaction();
    res.status(201).json({ submission: created, subscription });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
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

// Add a vote (one-way, non-reversible)
// Enforced rules:
//  - A user may cast at most one vote per submission.
//  - Votes cannot be removed (see removeVote handler below which now returns 403).
//  - Voting only allowed while challenge is active.
exports.addVote = async (req, res) => {
  const { submissionId } = req.params;
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ message: 'user_id is required' });
  try {
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.challenge_id) {
      try {
        const Challenge = require('../models/Challenge');
        const challenge = await Challenge.findById(submission.challenge_id).lean();
        if (challenge) {
          const now = new Date();
          let endDateTime = null;
            if (challenge.endDate && challenge.endTime) {
              const [h,m] = challenge.endTime.split(':').map(Number);
              endDateTime = new Date(challenge.endDate);
              endDateTime.setHours(h||0,m||0,0,0);
            } else if (challenge.endDate) {
              endDateTime = new Date(challenge.endDate);
            }
          const contestEnded = (challenge.status === 'completed') || (endDateTime && now > endDateTime);
          if (contestEnded) return res.status(403).json({ message: 'Voting period for this contest has ended', code: 'VOTING_CLOSED' });
        }
      } catch (challengeErr) {
        console.error('Error checking challenge for voting lock:', challengeErr);
        return res.status(500).json({ message: 'Unable to validate contest voting window' });
      }
    }
    // Atomic add (idempotent)
    await Submission.updateOne({ _id: submissionId }, { $addToSet: { votes: user_id } });
    const updated = await Submission.findById(submissionId).lean();
    return res.json({ success: true, votes: updated.votes.length });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Remove vote disabled: votes are permanent once cast.
exports.removeVote = async (req, res) => {
  return res.status(403).json({ message: 'Votes are permanent and cannot be removed', code: 'VOTE_PERMANENT' });
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
// Optional query params:
//   start=<ISO timestamp for start of local day>
// If provided, we treat the contest window as [start, start + 24h).
// If not provided, we fall back to server (UTC) calendar day logic.
exports.getCurrentLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    let startDate;
    let endDate = now;

    if (req.query.start) {
      const parsed = new Date(req.query.start);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed;
        // end of the provided local day (exclusive upper bound)
        endDate = new Date(parsed.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    // Fallback: server's current UTC day window
    if (!startDate) {
      startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    }

    const submissions = await Submission.find({ created_at: { $gte: startDate, $lt: endDate } }).lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.json(submissions.map(mapToLeaderboardEntry));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/submissions/weekly
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const now = new Date();
    // Determine start of current week in UTC (Sunday 00:00:00 UTC)
    const dayOfWeek = now.getUTCDay();
    const startOfWeekUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek, 0, 0, 0, 0));
    const submissions = await Submission.find({ created_at: { $gte: startOfWeekUTC, $lte: now } }).lean();
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
    const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    const submissions = await Submission.find({ created_at: { $gte: startOfMonthUTC, $lte: now } }).lean();
    submissions.sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
    res.status(200).json(submissions.map(mapToLeaderboardEntry));
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