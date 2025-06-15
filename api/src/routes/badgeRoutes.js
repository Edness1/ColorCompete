const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');

// Route to create a new badge
router.post('/', badgeController.createBadge);

// Route to get all badges
router.get('/', badgeController.getAllBadges);

// Route to get a badge by ID
router.get('/:id', badgeController.getBadgeById);

// Route to update a badge by ID
router.put('/:id', badgeController.updateBadge);

// Route to delete a badge by ID
router.delete('/:id', badgeController.deleteBadge);

module.exports = router;