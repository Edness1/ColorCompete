const Badge = require('../models/Badge');

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