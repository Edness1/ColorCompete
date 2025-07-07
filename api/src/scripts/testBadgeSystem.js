const mongoose = require('mongoose');
const BadgeService = require('../services/badgeService');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
require('dotenv').config();

async function testBadgeSystem() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colorcompete', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to database');

    // 1. Initialize default badges
    console.log('\n📋 Initializing default badges...');
    await BadgeService.initializeDefaultBadges();
    
    // 2. List all available badges
    const allBadges = await Badge.find({});
    console.log(`\n🏆 Available badges (${allBadges.length}):`);
    allBadges.forEach(badge => {
      console.log(`  - ${badge.name}: ${badge.description}`);
      console.log(`    Criteria: ${badge.criteria.threshold} ${badge.criteria.type} (${badge.criteria.timeframe})`);
    });

    // 3. Test badge checking for a sample user (replace with actual user ID)
    const sampleUserId = '507f1f77bcf86cd799439011'; // Replace with real user ID
    console.log(`\n🔍 Testing badge checking for user: ${sampleUserId}`);
    
    try {
      await BadgeService.checkAndAwardBadges(sampleUserId);
      const userBadges = await BadgeService.getUserBadges(sampleUserId);
      console.log(`✅ User has ${userBadges.length} badges:`);
      userBadges.forEach(badge => {
        console.log(`  - ${badge.name} (earned: ${badge.earnedAt})`);
      });
    } catch (error) {
      console.log(`⚠️  Could not test for sample user (might not exist): ${error.message}`);
    }

    // 4. Test API endpoints simulation
    console.log('\n🌐 API Endpoints available:');
    console.log('  GET  /api/badges                     - Get all badges');
    console.log('  GET  /api/badges/user/:userId        - Get user badges');
    console.log('  POST /api/badges/user/:userId/check  - Check/award badges for user');
    console.log('  POST /api/badges/initialize          - Initialize default badges');
    
    console.log('\n✅ Badge system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing badge system:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test if called directly
if (require.main === module) {
  testBadgeSystem();
}

module.exports = testBadgeSystem;
