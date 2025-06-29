const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Create a new submission
router.post('/', submissionController.createSubmission);

// Get all submissions
router.get('/', submissionController.getAllSubmissions);

// Get a submission by ID
router.get('/:id', submissionController.getSubmissionById);

// Update a submission by ID
router.put('/:id', submissionController.updateSubmission);
router.patch('/:id', submissionController.updateSubmission);

// Delete a submission by ID
router.delete('/:id', submissionController.deleteSubmission);

// Get submissions by challenge
router.get("/by-challenge/search", submissionController.getSubmissionsByChallenge);

// Vote on a submission
router.get('/submissions/:submissionId/vote', submissionController.checkUserVote);
router.post('/submissions/:submissionId/vote', submissionController.addVote);
router.delete('/submissions/:submissionId/vote', submissionController.removeVote);

// Get leaderboards
router.get('/submissions/current/now', submissionController.getCurrentLeaderboard);
router.get('/submissions/weekly/now', submissionController.getWeeklyLeaderboard);
router.get('/submissions/monthly/now', submissionController.getMonthlyLeaderboard);
router.get('/submissions/all-time/now', submissionController.getAllTimeLeaderboard);

module.exports = router;