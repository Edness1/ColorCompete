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

// Delete a submission by ID
router.delete('/:id', submissionController.deleteSubmission);

module.exports = router;