require('dotenv').config();
const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
const MonthlyDrawing = require('../models/MonthlyDrawing');
const emailAutomationService = require('../services/emailAutomationService');

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function executeMonthlyDrawing(tier) {
  try {
    console.log(`\n🎯 Executing ${tier.toUpperCase()} tier monthly drawing...`);
    
    // Find the automation for this tier
    const automation = await EmailAutomation.findOne({
      triggerType: `monthly_drawing_${tier}`,
      isActive: true
    });

    if (!automation) {
      console.log(`❌ No active ${tier} tier automation found`);
      return;
    }

    console.log(`✅ Found automation: ${automation.name}`);

    // Execute the drawing
    console.log(`🎲 Executing monthly drawing...`);
    await emailAutomationService.runMonthlyDrawing(automation, tier);

    // Check the result
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const result = await MonthlyDrawing.findOne({
      month: currentMonth,
      year: currentYear,
      subscriptionTier: tier
    });

    if (result) {
      console.log(`🎊 Drawing completed successfully!`);
      console.log(`   Winner: ${result.winner.name} (${result.winner.email})`);
      console.log(`   Prize: $${result.prizeAmount}`);
      console.log(`   Participants: ${result.participants.length}`);
      console.log(`   Gift Card Sent: ${result.giftCardDetails ? 'Yes' : 'No'}`);
      console.log(`   Completed: ${result.isCompleted}`);
      
      if (result.giftCardDetails) {
        console.log(`   Gift Card ID: ${result.giftCardDetails.giftCardId || 'N/A'}`);
        console.log(`   Redeem URL: ${result.giftCardDetails.redeemUrl || 'N/A'}`);
      }
    } else {
      console.log(`❌ No drawing result found`);
    }

  } catch (error) {
    console.error(`❌ Error executing ${tier} tier drawing:`, error);
  }
}

async function testLiveDrawing() {
  try {
    console.log('🚀 Testing LIVE Monthly Drawing Execution...\n');
    
    // Test with lite tier first
    await executeMonthlyDrawing('lite');

    console.log('\n🏁 Live drawing test completed!');
    console.log('⚠️  Note: This test may have sent actual emails and created real database records.');
    
  } catch (error) {
    console.error('❌ Error in live drawing test:', error);
  } finally {
    mongoose.disconnect();
  }
}

testLiveDrawing();
