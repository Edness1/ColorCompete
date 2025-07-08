const express = require('express');
const router = express.Router();
const monthlyDrawingController = require('../controllers/monthlyDrawingController');

// Get monthly drawing statistics (must come before /:id route)
router.get('/stats', monthlyDrawingController.getMonthlyDrawingStats);

// Manually trigger monthly drawing (admin only)
router.post('/trigger', monthlyDrawingController.triggerMonthlyDrawing);

// Get all monthly drawing results
router.get('/', monthlyDrawingController.getMonthlyDrawings);

// Get specific monthly drawing details (must come after specific routes)
router.get('/:id', monthlyDrawingController.getMonthlyDrawing);

module.exports = router;
