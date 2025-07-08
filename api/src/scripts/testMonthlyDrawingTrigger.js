const mongoose = require('mongoose');
require('dotenv').config();

// Import models and services
const User = require('../models/User');
const MonthlyDrawing = require('../models/MonthlyDrawing');
const EmailAutomation = require('../models/EmailAutomation');
const emailAutomationService = require('../services/emailAutomationService');

mongoose.connect(process.env.MONGO_URI);

async function testMonthlyDrawing() {
  try {
    console.log('🎯 Testing Monthly Drawing System...');
    
    // Check if we have eligible participants
    const eligibleUsers = await User.find({
      'subscription.type': 'lite',
      'preferences.notifications.marketing': true,
      email: { $exists: true, $ne: '' }
    });
    
    console.log(`Found ${eligibleUsers.length} eligible lite tier participants`);
    
    if (eligibleUsers.length === 0) {
      console.log('❌ No eligible participants found. Creating test user...');
      
      // Create a test user
      const testUser = new User({
        firstName: 'Test',
        lastName: 'Winner',
        username: 'testWinner' + Date.now(),
        email: 'test.winner@example.com',
        subscription: {
          type: 'lite',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        },
        preferences: {
          notifications: {
            marketing: true,
            contests: true,
            rewards: true
          }
        }
      });
      
      await testUser.save();
      console.log('✅ Test user created:', testUser.email);
      eligibleUsers.push(testUser);
    }
    
    // Check current month/year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`\n📅 Testing drawing for ${currentMonth}/${currentYear} - Lite tier`);
    
    // Check if drawing already exists for current month
    const existingDrawing = await MonthlyDrawing.findOne({
      month: currentMonth,
      year: currentYear,
      subscriptionTier: 'lite'
    });
    
    if (existingDrawing) {
      console.log('⚠️  Drawing already exists for this month:', existingDrawing._id);
      console.log('Winner:', existingDrawing.winner);
      return;
    }
    
    // Find the automation for lite tier
    const automation = await EmailAutomation.findOne({
      name: 'Monthly Drawing - Lite Winner'
    });
    
    if (!automation) {
      console.log('❌ Automation not found. Run setupMonthlyDrawings.js first');
      return;
    }
    
    console.log('✅ Found automation:', automation.name);
    
    // Create new drawing
    const drawing = new MonthlyDrawing({
      month: currentMonth,
      year: currentYear,
      subscriptionTier: 'lite',
      prizeAmount: 25,
      participants: eligibleUsers.map(user => ({
        userId: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        entryDate: new Date()
      })),
      automationId: automation._id
    });
    
    // Select random winner
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const winner = eligibleUsers[randomIndex];
    
    drawing.winner = {
      userId: winner._id,
      email: winner.email,
      name: `${winner.firstName} ${winner.lastName}`
    };
    
    drawing.drawingDate = new Date();
    
    console.log('🎉 Winner selected:', drawing.winner.name, '(' + drawing.winner.email + ')');
    
    // Save the drawing
    await drawing.save();
    console.log('✅ Drawing saved with ID:', drawing._id);
    
    // Test the automation trigger (without actually sending emails/gift cards)
    console.log('\n📧 Testing automation trigger...');
    
    try {
      // This would normally send the actual email and gift card
      // For testing, we'll just validate the logic
      const automationData = {
        drawingId: drawing._id,
        winner: drawing.winner,
        participants: drawing.participants,
        tier: 'lite',
        prizeAmount: 25,
        month: currentMonth,
        year: currentYear
      };
      
      console.log('🔍 Automation data prepared:', {
        winner: automationData.winner.name,
        participants: automationData.participants.length,
        tier: automationData.tier,
        prizeAmount: '$' + automationData.prizeAmount
      });
      
      // For actual production use, uncomment this line:
      // await emailAutomationService.triggerAutomation(automation._id, automationData);
      
      console.log('✅ Automation logic validated (emails not sent in test mode)');
      
      // Mark drawing as completed (in test mode)
      drawing.isCompleted = true;
      await drawing.save();
      
      console.log('🎯 Monthly drawing test completed successfully!');
      
    } catch (automationError) {
      console.error('❌ Error testing automation:', automationError.message);
    }
    
  } catch (error) {
    console.error('❌ Error in monthly drawing test:', error);
  } finally {
    mongoose.disconnect();
  }
}

testMonthlyDrawing();
