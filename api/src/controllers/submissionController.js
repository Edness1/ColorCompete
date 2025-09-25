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
    // Ensure a single subscription exists and is reset if needed
    let subscription = await Subscription.findOne({ userId: String(payload.user_id) }).session(session);
    if (!subscription) {
      subscription = await Subscription.create([
        {
          userId: String(payload.user_id),
          tier: 'free',
          remaining_submissions: 2,
          lastResetAt: new Date()
        }
      ], { session }).then(r => r[0]);
    } else {
      // Monthly reset if needed
      const now = new Date();
      const tierLimits = { free: 2, lite: 5, pro: 20, champ: 999 };
      if (
        !subscription.lastResetAt ||
        subscription.lastResetAt.getUTCFullYear() !== now.getUTCFullYear() ||
        subscription.lastResetAt.getUTCMonth() !== now.getUTCMonth()
      ) {
        const limit = tierLimits[subscription.tier || 'free'];
        subscription.remaining_submissions = limit;
        subscription.lastResetAt = now;
        await subscription.save({ session });
      }
    }

    // Enforce credits: decrement atomically or reject
    const updatedSub = await Subscription.findOneAndUpdate(
      { _id: subscription._id, remaining_submissions: { $gt: 0 } },
      { $inc: { remaining_submissions: -1 } },
      { new: true, session }
    );
    if (!updatedSub) {
      await session.abortTransaction();
      return res.status(402).json({ message: 'No submissions left' });
    }

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
    res.status(201).json({ submission: created, subscription: updatedSub });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Get submissions (optionally filtered by user_id or challenge_id)
exports.getAllSubmissions = async (req, res) => {
  try {
    const { status, user_id, challenge_id } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (user_id) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(user_id)) {
        filter.user_id = new mongoose.Types.ObjectId(user_id);
      } else {
        return res.status(400).json({ message: 'Invalid user_id format' });
      }
    }
    if (challenge_id) filter.challenge_id = challenge_id;
    const submissions = await Submission.find(filter).sort({ created_at: -1 });
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
          // Build start and end datetimes consistently in UTC
          let start = challenge.startDate ? new Date(challenge.startDate) : null;
          let end = challenge.endDate ? new Date(challenge.endDate) : null;
          // If time strings present but start/end are date-only, adjust time portion in UTC
          if (start && challenge.startTime && !isNaN(start.getTime())) {
            const [sh, sm] = challenge.startTime.split(':').map(Number);
            start = new Date(start.toISOString());
            start.setUTCHours(sh || 0, sm || 0, 0, 0);
          }
          if (end && challenge.endTime && !isNaN(end.getTime())) {
            const [eh, em] = challenge.endTime.split(':').map(Number);
            end = new Date(end.toISOString());
            end.setUTCHours(eh || 0, em || 0, 0, 0);
          }

          // Voting allowed while contest is active and before or at end time
          const endedByStatus = challenge.status === 'completed';
          const endedByTime = end ? now > end : false;
          if (endedByStatus || endedByTime) {
            return res.status(403).json({ message: 'Voting period for this contest has ended', code: 'VOTING_CLOSED' });
          }
        }
      } catch (challengeErr) {
        console.error('Error checking challenge for voting lock:', challengeErr);
        return res.status(500).json({ message: 'Unable to validate contest voting window' });
      }
    }
    // Atomic add (idempotent)
  await Submission.updateOne({ _id: submissionId }, { $addToSet: { votes: user_id } });
  const updated = await Submission.findById(submissionId).lean();
  return res.json({ success: true, votes: (updated.votes || []).length, contest_id: updated.challenge_id });
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

// GET /api/submissions/contests/:contestId/vote-counts
// Returns compact vote counts for each submission in a contest
exports.getVoteCountsForContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!contestId) return res.status(400).json({ message: 'contestId is required' });
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
      return res.status(400).json({ message: 'Invalid contestId format' });
    }
    const subs = await Submission.find({ challenge_id: contestId }, { _id: 1, votes: 1 }).lean();
    const result = subs.map(s => ({ submission_id: s._id, votes: Array.isArray(s.votes) ? s.votes.length : 0 }));
    res.json({ contest_id: contestId, submissions: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};