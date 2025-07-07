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
          challenge: challenge._id,
          user: challenge.winner._id
        });
        
        if (winningSubmission) {
          // Trigger winner reward automation
          await emailAutomationService.sendWinnerReward(
            challenge.winner._id,
            challenge.title,
            winningSubmission.imageUrl
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
            const allSubmissions = await Submission.find({ challenge: challenge._id });
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