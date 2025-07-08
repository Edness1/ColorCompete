const MonthlyDrawing = require('../models/MonthlyDrawing');
const EmailAutomation = require('../models/EmailAutomation');
const emailAutomationService = require('../services/emailAutomationService');
const User = require('../models/User');

// Get all monthly drawing results
exports.getMonthlyDrawings = async (req, res) => {
  try {
    const { tier, year, month } = req.query;
    
    let query = {};
    if (tier) query.subscriptionTier = tier;
    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const drawings = await MonthlyDrawing.find(query)
      .populate('winner.userId', 'firstName lastName username email')
      .sort({ year: -1, month: -1, subscriptionTier: 1 });

    res.json({
      success: true,
      drawings: drawings.map(drawing => ({
        id: drawing._id,
        month: drawing.month,
        year: drawing.year,
        subscriptionTier: drawing.subscriptionTier,
        prizeAmount: drawing.prizeAmount,
        winner: drawing.winner,
        participantCount: drawing.participants.length,
        drawingDate: drawing.drawingDate,
        isCompleted: drawing.isCompleted,
        giftCardSent: !!drawing.giftCardDetails?.sentAt
      }))
    });
  } catch (error) {
    console.error('Error fetching monthly drawings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get specific monthly drawing details
exports.getMonthlyDrawing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const drawing = await MonthlyDrawing.findById(id)
      .populate('winner.userId', 'firstName lastName username email')
      .populate('participants.userId', 'firstName lastName username email');

    if (!drawing) {
      return res.status(404).json({ success: false, error: 'Drawing not found' });
    }

    res.json({
      success: true,
      drawing
    });
  } catch (error) {
    console.error('Error fetching monthly drawing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Manually trigger monthly drawing (for testing/admin use)
exports.triggerMonthlyDrawing = async (req, res) => {
  try {
    const { tier } = req.body;
    
    if (!['lite', 'pro', 'champ'].includes(tier)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid tier. Must be one of: lite, pro, champ' 
      });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    // Find the automation for this tier
    const automation = await EmailAutomation.findOne({
      triggerType: `monthly_drawing_${tier}`,
      isActive: true
    });

    if (!automation) {
      return res.status(404).json({ 
        success: false, 
        error: `No active monthly drawing automation found for ${tier} tier` 
      });
    }

    // Trigger the drawing
    await emailAutomationService.runMonthlyDrawing(automation, tier);

    // Get the result
    const now = new Date();
    const result = await MonthlyDrawing.findOne({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      subscriptionTier: tier
    }).populate('winner.userId', 'firstName lastName username email');

    res.json({
      success: true,
      message: `Monthly drawing for ${tier} tier completed successfully`,
      result: result ? {
        winner: result.winner,
        participantCount: result.participants.length,
        prizeAmount: result.prizeAmount,
        isCompleted: result.isCompleted
      } : null
    });
  } catch (error) {
    console.error('Error triggering monthly drawing:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get monthly drawing statistics
exports.getMonthlyDrawingStats = async (req, res) => {
  try {
    // For now, allow anyone to view stats (you can add auth later)
    const stats = await MonthlyDrawing.aggregate([
      {
        $group: {
          _id: '$subscriptionTier',
          totalDrawings: { $sum: 1 },
          completedDrawings: { 
            $sum: { $cond: ['$isCompleted', 1, 0] } 
          },
          totalPrizeMoney: { $sum: '$prizeAmount' },
          averageParticipants: { 
            $avg: { $size: '$participants' } 
          }
        }
      }
    ]);

    const tierStats = {
      lite: { totalDrawings: 0, completedDrawings: 0, totalPrizeMoney: 0, averageParticipants: 0 },
      pro: { totalDrawings: 0, completedDrawings: 0, totalPrizeMoney: 0, averageParticipants: 0 },
      champ: { totalDrawings: 0, completedDrawings: 0, totalPrizeMoney: 0, averageParticipants: 0 }
    };

    stats.forEach(stat => {
      tierStats[stat._id] = {
        totalDrawings: stat.totalDrawings,
        completedDrawings: stat.completedDrawings,
        totalPrizeMoney: stat.totalPrizeMoney,
        averageParticipants: Math.round(stat.averageParticipants)
      };
    });

    // Get current month eligible participants
    const currentParticipants = await Promise.all([
      User.countDocuments({ 'subscription.type': 'lite' }),
      User.countDocuments({ 'subscription.type': 'pro' }),
      User.countDocuments({ 'subscription.type': 'champ' })
    ]);

    tierStats.lite.currentParticipants = currentParticipants[0];
    tierStats.pro.currentParticipants = currentParticipants[1];
    tierStats.champ.currentParticipants = currentParticipants[2];

    res.json({
      success: true,
      stats: tierStats
    });
  } catch (error) {
    console.error('Error fetching monthly drawing stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = exports;
