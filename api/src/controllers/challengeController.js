const Challenge = require('../models/Challenge');
const Submission = require('../models/Submission');
const emailAutomationService = require('../services/emailAutomationService');
const BadgeService = require('../services/badgeService');

// Contest Analytics Model (create this model if it doesn't exist)
const ContestAnalytics = require('../models/ContestAnalytics');

// Create a new challenge
exports.createChallenge = async (req, res) => {
  try {
    const challenge = new Challenge(req.body);
    await challenge.save();
    // Fire contest announcement when newly created with active status
    try {
      if (challenge.status === 'active') {
        await emailAutomationService.sendContestAnnouncement({
          _id: challenge._id,
          title: challenge.title,
          description: challenge.description || '',
          prize: undefined,
          deadline: challenge.endDate,
          votingPeriod: undefined
        });
        console.log(`Contest announcement triggered for new challenge: ${challenge.title}`);
      }
    } catch (announceErr) {
      console.error('Error triggering contest announcement on create:', announceErr);
    }
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all challenges
exports.getAllChallenges = async (req, res) => {
  try {
  const challenges = await Challenge.find();
    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Explicit active challenge endpoint: returns the single most recent active challenge
exports.getCurrentActiveChallenge = async (req, res) => {
  try {
    const now = new Date();
    // Active defined by status === 'active' and current time within window if dates exist
    const active = await Challenge.find({ status: 'active' }).sort({ startDate: -1 }).lean();
    if (!active || active.length === 0) return res.status(404).json({ message: 'No active challenge' });
    // Optionally filter by time window if multiple are incorrectly flagged active
    const filtered = active.filter(c => {
      if (!c.startDate || !c.endDate) return true;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return start <= now && now <= end;
    });
    const selected = (filtered[0] || active[0]);
    res.status(200).json(selected);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a challenge by ID
exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.status(200).json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a challenge
exports.updateChallenge = async (req, res) => {
  try {
    const oldChallenge = await Challenge.findById(req.params.id);
    if (!oldChallenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('winner');
    
    // Check if a winner was just set (winner didn't exist before but does now)
    if (!oldChallenge.winner && challenge.winner && req.body.winner) {
      try {
        // Find the winning submission
        const winningSubmission = await Submission.findOne({
          challenge_id: challenge._id,
          user_id: challenge.winner._id
        });
        
        if (winningSubmission) {
          // Trigger winner reward automation
          await emailAutomationService.sendWinnerReward(
            challenge.winner._id,
            challenge.title,
            winningSubmission.imageUrl || winningSubmission.file_path
          );
          
          console.log(`Winner reward triggered for challenge: ${challenge.title}, winner: ${challenge.winner.username}`);
          
          // Check and award badges for the winner
          try {
            await BadgeService.checkAndAwardBadges(challenge.winner._id, 'contest_win', {
              contestId: challenge._id,
              submissionId: winningSubmission._id
            });
            console.log(`Badge check completed for winner: ${challenge.winner.username}`);
          } catch (badgeError) {
            console.error('Error checking badges for winner:', badgeError);
          }
          
          // Also check badges for all participants in this contest
          try {
            const allSubmissions = await Submission.find({ challenge_id: challenge._id });
            const participantIds = [...new Set(allSubmissions.map(s => s.user_id))];
            
            for (const participantId of participantIds) {
              if (participantId && participantId.toString() !== challenge.winner._id.toString()) {
                await BadgeService.checkAndAwardBadges(participantId, 'contest_end', {
                  contestId: challenge._id
                });
              }
            }
            console.log(`Badge check completed for all participants in contest: ${challenge.title}`);
          } catch (badgeError) {
            console.error('Error checking badges for participants:', badgeError);
          }
        }
      } catch (emailError) {
        console.error('Error triggering winner reward email:', emailError);
        // Don't fail the challenge update if email fails
      }

      // Additionally, send voting results emails to participants
      try {
        const subs = await Submission.find({ challenge_id: challenge._id });
        const participantIds = [...new Set(subs.map(s => s.user_id).filter(Boolean))];
        const totalSubmissions = subs.length;
        const totalVotes = subs.reduce((acc, s) => acc + (Array.isArray(s.votes) ? s.votes.length : 0), 0);
        const winners = [{
          user: challenge.winner,
          prize: undefined,
          votes: (() => {
            const w = subs.find(s => s.user_id && challenge.winner && s.user_id.toString() === challenge.winner._id.toString());
            return w && Array.isArray(w.votes) ? w.votes.length : 0;
          })(),
          imageUrl: (() => {
            const w = subs.find(s => s.user_id && challenge.winner && s.user_id.toString() === challenge.winner._id.toString());
            return (w && (w.imageUrl || w.file_path)) || undefined;
          })()
        }];

        await emailAutomationService.sendVotingResults({
          _id: challenge._id,
          title: challenge.title,
          totalSubmissions,
          totalVotes,
          participantIds
        }, winners);
        console.log(`Voting results emails triggered for challenge: ${challenge.title}`);
      } catch (vrErr) {
        console.error('Error triggering voting results emails:', vrErr);
      }
    }
    
    res.status(200).json(challenge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a challenge
exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get the currently active contest (challenge) by date and status
exports.getActiveChallenge = async (req, res) => {
  try {
    const now = req.query.now ? new Date(req.query.now) : new Date();
    const challenge = await Challenge.find({
      status: "active",
    }).sort({ start_date: -1 }); // latest active if multiple

    if (!challenge) {
      return res.status(404).json({ message: "No active contest found" });
    }
    res.status(200).json(challenge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all contest analytics
exports.getAllContestAnalytics = async (req, res) => {
  try {
    const analytics = await ContestAnalytics.find();
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Increment a specific analytics metric for a contest (atomic)
exports.incrementContestMetric = async (req, res) => {
  try {
    const id = req.params.id;
    const metric = req.params.metric;
    const allowedMetrics = ['views', 'downloads', 'submissions', 'votes'];

    if (!allowedMetrics.includes(metric)) {
      return res.status(400).json({ message: 'Invalid metric type' });
    }

    // Validate contest exists (fast path cacheable later if needed)
    const exists = await Challenge.exists({ _id: id });
    if (!exists) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Atomic upsert & increment
    const update = await ContestAnalytics.findOneAndUpdate(
      { contest_id: id },
      {
        $inc: { [metric]: 1 },
        $set: { updated_at: new Date() },
        $setOnInsert: { contest_id: id },
      },
      { new: true, upsert: true }
    );

    res.status(200).json(update);
  } catch (error) {
    console.error('Error incrementing contest metric:', error);
    res.status(500).json({ message: error.message });
  }
};