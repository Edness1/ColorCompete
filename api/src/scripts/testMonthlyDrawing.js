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

async function testMonthlyDrawing() {
  try {
    console.log('Testing Monthly Drawing System...');
    
    // Get the automation
    const automation = await EmailAutomation.findOne({
      triggerType: 'monthly_drawing_lite',
      isActive: true
    });

    if (!automation) {
      console.log('❌ No active Lite tier automation found');
      return;
    }

    console.log('✅ Found automation:', automation.name);

    // Get eligible participants using Subscription model
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // First get current active subscriptions for lite tier
    const activeSubscriptions = await Subscription.find({
      tier: 'lite',
      month: currentMonth,
      year: currentYear,
      remaining_submissions: { $gt: 0 }
    });

    console.log('📊 Found', activeSubscriptions.length, 'active lite subscriptions for', currentMonth + '/' + currentYear);

    if (activeSubscriptions.length === 0) {
      console.log('❌ No active lite subscriptions found');
      return;
    }

    // Get user details for participants
    const userIds = activeSubscriptions.map(sub => sub.userId);
    const participants = await User.find({
      _id: { $in: userIds },
      email: { $exists: true, $ne: '' },
      'emailPreferences.rewardNotifications': { $ne: false }
    });

    console.log('📊 Found', participants.length, 'eligible participants (with valid emails and notifications enabled)');

    if (participants.length === 0) {
      console.log('❌ No eligible participants found');
      return;
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    console.log('🎉 Selected winner:', winner.firstName, winner.lastName, '(' + winner.email + ')');

    // Check if drawing already exists for this month
    const existingDrawing = await MonthlyDrawing.findOne({
      month: currentMonth,
      year: currentYear,
      subscriptionTier: 'lite'
    });

    if (existingDrawing) {
      console.log('⚠️ Drawing already exists for this month');
      console.log('Winner:', existingDrawing.winner.name);
      console.log('Completed:', existingDrawing.isCompleted);
    } else {
      console.log('✅ No existing drawing found - would create new drawing record');
      console.log('📅 Month/Year:', currentMonth + '/' + currentYear);
      console.log('💰 Prize Amount: $' + automation.monthlyDrawingSettings.prizeAmount);
    }

    console.log('\n🔍 Drawing Details:');
    console.log('- Tier: Lite');
    console.log('- Prize: $25');
    console.log('- Participants:', participants.length);
    console.log('- Winner:', winner.username);
    console.log('- Winner Email:', winner.email);

    console.log('\n✅ Monthly drawing test completed successfully!');
    console.log('Note: No actual gift cards were sent or database records created in this test.');

  } catch (error) {
    console.error('❌ Error testing monthly drawing:', error);
  } finally {
    mongoose.disconnect();
  }
}

testMonthlyDrawing();
