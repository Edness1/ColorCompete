const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function createTestUsers() {
  try {
    console.log('Creating test users for all subscription tiers...\n');
    
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    
    // Create Pro tier user
    const proUser = new User({
      username: 'testpro',
      email: 'test.pro@colorcompete.com',
      firstName: 'Test',
      lastName: 'Pro',
      password: hashedPassword,
      subscription: {
        type: 'pro'
      },
      emailPreferences: {
        marketingEmails: true,
        contestNotifications: true,
        winnerAnnouncements: true,
        rewardNotifications: true
      }
    });
    
    // Create Champ tier user
    const champUser = new User({
      username: 'testchamp',
      email: 'test.champ@colorcompete.com',
      firstName: 'Test',
      lastName: 'Champ',
      password: hashedPassword,
      subscription: {
        type: 'champ'
      },
      emailPreferences: {
        marketingEmails: true,
        contestNotifications: true,
        winnerAnnouncements: true,
        rewardNotifications: true
      }
    });
    
    // Check if users already exist
    const existingPro = await User.findOne({ email: 'test.pro@colorcompete.com' });
    const existingChamp = await User.findOne({ email: 'test.champ@colorcompete.com' });
    
    if (!existingPro) {
      await proUser.save();
      console.log('✅ Created Pro tier test user:', proUser.email);
    } else {
      console.log('⚠️  Pro tier test user already exists');
    }
    
    if (!existingChamp) {
      await champUser.save();
      console.log('✅ Created Champ tier test user:', champUser.email);
    } else {
      console.log('⚠️  Champ tier test user already exists');
    }
    
    // Verify all tiers now have users
    const liteTierCount = await User.countDocuments({ 'subscription.type': 'lite' });
    const proTierCount = await User.countDocuments({ 'subscription.type': 'pro' });
    const champTierCount = await User.countDocuments({ 'subscription.type': 'champ' });
    
    console.log('\nUpdated tier counts:');
    console.log(`  Lite: ${liteTierCount}`);
    console.log(`  Pro: ${proTierCount}`);
    console.log(`  Champ: ${champTierCount}`);
    
  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestUsers();
