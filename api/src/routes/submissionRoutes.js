const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');

// Create a new submission
router.post('/', submissionController.createSubmission);

// Get all submissions
router.get('/', submissionController.getAllSubmissions);

// Explicit: GET /api/submissions/user/:userId
router.get('/user/:userId', async (req, res) => {
	const mongoose = require('mongoose');
	const { userId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		return res.status(400).json({ message: 'Invalid userId' });
	}
	try {
		const submissions = await require('../models/Submission').find({ user_id: new mongoose.Types.ObjectId(userId) }).sort({ created_at: -1 });
		res.json(submissions);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Get a submission by ID
router.get('/:id', submissionController.getSubmissionById);

// Update a submission by ID
router.put('/:id', submissionController.updateSubmission);
router.patch('/:id', submissionController.updateSubmission);

// Delete a submission by ID
router.delete('/:id', submissionController.deleteSubmission);

// Get submissions by challenge
router.get("/by-challenge/search", submissionController.getSubmissionsByChallenge);

// Vote on a submission (router mounted at /api/submissions)
router.get('/:submissionId/vote', submissionController.checkUserVote);
router.post('/:submissionId/vote', submissionController.addVote);
router.delete('/:submissionId/vote', submissionController.removeVote);

// Get leaderboards
router.get('/current/now', submissionController.getCurrentLeaderboard);
router.get('/weekly/now', submissionController.getWeeklyLeaderboard);
router.get('/monthly/now', submissionController.getMonthlyLeaderboard);
router.get('/all-time/now', submissionController.getAllTimeLeaderboard);

// Vote counts per contest
router.get('/contests/:contestId/vote-counts', submissionController.getVoteCountsForContest);

module.exports = router;