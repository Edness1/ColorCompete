require('dotenv').config();
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const MonthlyDrawing = require('../models/MonthlyDrawing');

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function testTierDrawing(tier) {
  try {
    console.log(`\n🎯 Testing ${tier.toUpperCase()} tier drawing...`);
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get the automation for this tier
    const automation = await EmailAutomation.findOne({
      triggerType: `monthly_drawing_${tier}`,
      isActive: true
    });

    if (!automation) {
      console.log(`❌ No active ${tier} tier automation found`);
      return;
    }

    console.log(`✅ Found automation: ${automation.name}`);

    // Get current active subscriptions for this tier
    const activeSubscriptions = await Subscription.find({
      tier: tier,
      month: currentMonth,
      year: currentYear,
      remaining_submissions: { $gt: 0 }
    });

    console.log(`📊 Found ${activeSubscriptions.length} active ${tier} subscriptions for ${currentMonth}/${currentYear}`);

    if (activeSubscriptions.length === 0) {
      console.log(`❌ No active ${tier} subscriptions found`);
      return;
    }

    // Get user details for participants
    const userIds = activeSubscriptions.map(sub => sub.userId);
    const participants = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: '' },
      'emailPreferences.rewardNotifications': { $ne: false }
    });

    console.log(`📊 Found ${participants.length} eligible participants (with valid emails and notifications enabled)`);

    if (participants.length === 0) {
      console.log(`❌ No eligible participants found for ${tier} tier`);
      return;
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    console.log(`🎉 Selected winner: ${winner.firstName} ${winner.lastName} (${winner.email})`);

    // Determine prize amount
    const prizeAmounts = { lite: 25, pro: 50, champ: 100 };
    const prizeAmount = automation.monthlyDrawingSettings?.prizeAmount || prizeAmounts[tier];

    console.log(`💰 Prize Amount: $${prizeAmount}`);

    // Check if drawing already exists for this month
    const existingDrawing = await MonthlyDrawing.findOne({
      month: currentMonth,
      year: currentYear,
      subscriptionTier: tier
    });

    if (existingDrawing) {
      console.log(`⚠️ Drawing already exists for ${tier} tier this month`);
      console.log(`   Winner: ${existingDrawing.winner.name}`);
      console.log(`   Completed: ${existingDrawing.isCompleted}`);
    } else {
      console.log(`✅ No existing drawing found - would create new drawing record`);
    }

    console.log(`📅 Month/Year: ${currentMonth}/${currentYear}`);

    console.log(`\n🔍 Drawing Details:`);
    console.log(`- Tier: ${tier.charAt(0).toUpperCase() + tier.slice(1)}`);
    console.log(`- Prize: $${prizeAmount}`);
    console.log(`- Participants: ${participants.length}`);
    console.log(`- Winner: ${winner.username}`);
    console.log(`- Winner Email: ${winner.email}`);

    console.log(`✅ ${tier.toUpperCase()} tier drawing test completed successfully!`);

  } catch (error) {
    console.error(`❌ Error testing ${tier} tier drawing:`, error);
  }
}

async function testAllTierDrawings() {
  try {
    console.log('🎲 Testing Monthly Drawing System for All Tiers...\n');
    
    const tiers = ['lite', 'pro', 'champ'];
    
    for (const tier of tiers) {
      await testTierDrawing(tier);
    }

    console.log('\n🎊 All tier drawing tests completed!');
    console.log('Note: No actual gift cards were sent or database records created in these tests.');
    
  } catch (error) {
    console.error('❌ Error in overall test:', error);
  } finally {
    mongoose.disconnect();
  }
}

testAllTierDrawings();
