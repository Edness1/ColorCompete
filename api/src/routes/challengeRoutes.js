const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

// Place this BEFORE any route with :id
router.get('/active', challengeController.getActiveChallenge);

// Create a new challenge
router.post('/', challengeController.createChallenge);

// Get all challenges
router.get('/', challengeController.getAllChallenges);

// Get a specific challenge by ID
router.get('/:id', challengeController.getChallengeById);

// Update a challenge by ID
router.put('/:id', challengeController.updateChallenge);

// Delete a challenge by ID
router.delete('/:id', challengeController.deleteChallenge);

module.exports = router;