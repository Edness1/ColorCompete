const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const BadgeService = require('../services/badgeService');

// Create a new badge
exports.createBadge = async (req, res) => {
  try {
    const badge = new Badge(req.body);
    await badge.save();
    res.status(201).json(badge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Retrieve all badges
exports.getAllBadges = async (req, res) => {
  try {
    const badges = await Badge.find();
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve a badge by ID
exports.getBadgeById = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(200).json(badge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a badge by ID
exports.updateBadge = async (req, res) => {
  try {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(200).json(badge);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a badge by ID
exports.deleteBadge = async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get badges earned by a specific user
exports.getUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    const badges = await BadgeService.getUserBadges(userId);
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check and award badges for a user (useful for manual triggers)
exports.checkUserBadges = async (req, res) => {
  try {
    const { userId } = req.params;
    await BadgeService.checkAndAwardBadges(userId);
    const badges = await BadgeService.getUserBadges(userId);
    res.status(200).json({ 
      message: 'Badge check completed',
      badges 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initialize default badges (admin only)
exports.initializeDefaultBadges = async (req, res) => {
  try {
    await BadgeService.initializeDefaultBadges();
    res.status(200).json({ message: 'Default badges initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle badge visibility for a user
exports.toggleBadgeVisibility = async (req, res) => {
  try {
    const { userId, badgeId } = req.params;
    const { isVisible } = req.body;
    
    const userBadge = await UserBadge.findOneAndUpdate(
      { userId, badgeId },
      { isVisible },
      { new: true }
    );
    
    if (!userBadge) {
      return res.status(404).json({ message: 'User badge not found' });
    }
    
    res.status(200).json(userBadge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};