const mongoose = require('mongoose');
const BadgeService = require('../services/badgeService');
const User = require('../models/User');
require('dotenv').config();

// Script to check badges for all existing users
async function checkBadgesForAllUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colorcompete', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to database');

    // Initialize default badges first
    await BadgeService.initializeDefaultBadges();
    console.log('Default badges initialized');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    // Check badges for each user
    for (const user of users) {
      console.log(`Checking badges for user: ${user.username} (${user._id})`);
      try {
        await BadgeService.checkAndAwardBadges(user._id);
        const userBadges = await BadgeService.getUserBadges(user._id);
        console.log(`  - Awarded ${userBadges.length} badges`);
      } catch (error) {
        console.error(`  - Error checking badges for user ${user._id}:`, error.message);
      }
    }

    console.log('Badge checking completed for all users');
    process.exit(0);
  } catch (error) {
    console.error('Error in badge checking script:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  checkBadgesForAllUsers();
}

module.exports = checkBadgesForAllUsers;
