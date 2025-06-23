const Challenge = require('../models/Challenge');

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
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
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