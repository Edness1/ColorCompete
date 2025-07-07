const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

// Route to create a new badge
router.post('/', badgeController.createBadge);

// Route to get all badges
router.get('/', badgeController.getAllBadges);

// Route to initialize default badges
router.post('/initialize', badgeController.initializeDefaultBadges);

// Route to get badges for a specific user
router.get('/user/:userId', badgeController.getUserBadges);

// Route to check and award badges for a user
router.post('/user/:userId/check', badgeController.checkUserBadges);

// Route to toggle badge visibility for a user
router.put('/user/:userId/badge/:badgeId/visibility', badgeController.toggleBadgeVisibility);

// Route to get a badge by ID
router.get('/:id', badgeController.getBadgeById);

// Route to update a badge by ID
router.put('/:id', badgeController.updateBadge);

// Route to delete a badge by ID
router.delete('/:id', badgeController.deleteBadge);

module.exports = router;