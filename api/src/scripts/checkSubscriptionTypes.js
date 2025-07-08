const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function checkSubscriptionTypes() {
  try {
    console.log('Checking subscription types in database...\n');
    
    // Get all users with subscription data
    const usersWithSubscriptions = await User.find({ 
      'subscription.type': { $exists: true, $ne: null } 
    }).select('firstName lastName email subscription');
    
    console.log('Users with subscription types:');
    if (usersWithSubscriptions.length === 0) {
      console.log('❌ No users found with subscription.type');
    } else {
      usersWithSubscriptions.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.email}): ${user.subscription.type}`);
      });
    }
    
    // Get unique subscription types
    const uniqueTypes = await User.distinct('subscription.type');
    console.log('\nUnique subscription types found:', uniqueTypes);
    
    // Count by tier
    const liteTierCount = await User.countDocuments({ 'subscription.type': 'lite' });
    const proTierCount = await User.countDocuments({ 'subscription.type': 'pro' });
    const champTierCount = await User.countDocuments({ 'subscription.type': 'champ' });
    
    console.log('\nTier counts:');
    console.log(`  Lite: ${liteTierCount}`);
    console.log(`  Pro: ${proTierCount}`);
    console.log(`  Champ: ${champTierCount}`);
    
    // Test with all users to see the subscription field structure
    const allUsers = await User.find({}).select('firstName lastName email subscription');
    console.log('\nAll users and their subscription data:');
    allUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}):`, JSON.stringify(user.subscription));
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSubscriptionTypes();
