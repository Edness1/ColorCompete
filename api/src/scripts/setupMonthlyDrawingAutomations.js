const mongoose = require('mongoose');
require('dotenv').config();

const EmailAutomation = require('../models/EmailAutomation');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/colorcompete';

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const monthlyDrawingAutomations = [
  {
    name: 'Monthly Drawing - Lite Tier',
    description: 'Monthly $25 gift card drawing for Lite subscribers',
    isActive: true,
    triggerType: 'monthly_drawing_lite',
    createdBy: new mongoose.Types.ObjectId(),
    emailTemplate: {
      subject: '🎁 Congratulations! You won the Lite Monthly Drawing - $25 Gift Card!',
      htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1 style="color: #28a745; text-align: center;">🎁 You\'re a Winner!</h1><p>Congratulations {{winner_name}}! You\'ve won the {{tier_name}} tier monthly drawing for {{month_year}}!</p><div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;"><h2 style="margin-top: 0; color: #28a745;">Prize: ${{prize_amount}} Gift Card</h2><p><strong>Gift Card Code:</strong> {{gift_card_code}}</p><p><a href="{{redeem_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redeem Your Gift Card</a></p></div><p style="text-align: center; color: #666; font-size: 14px;">Thank you for being a valued ColorCompete subscriber! Keep creating amazing art.</p><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Dashboard</a></div></div>',
      textContent: 'Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} monthly drawing. Gift card code: {{gift_card_code}}'
    },
    schedule: {
      time: '11:00',
      timezone: 'America/New_York'
    },
    monthlyDrawingSettings: {
      subscriptionTier: 'lite',
      prizeAmount: 25,
      drawingDate: 1
    }
  },
  {
    name: 'Monthly Drawing - Pro Tier',
    description: 'Monthly $50 gift card drawing for Pro subscribers',
    isActive: true,
    triggerType: 'monthly_drawing_pro',
    createdBy: new mongoose.Types.ObjectId(),
    emailTemplate: {
      subject: '🎁 Congratulations! You won the Pro Monthly Drawing - $50 Gift Card!',
      htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1 style="color: #28a745; text-align: center;">🎁 You\'re a Winner!</h1><p>Congratulations {{winner_name}}! You\'ve won the {{tier_name}} tier monthly drawing for {{month_year}}!</p><div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;"><h2 style="margin-top: 0; color: #28a745;">Prize: ${{prize_amount}} Gift Card</h2><p><strong>Gift Card Code:</strong> {{gift_card_code}}</p><p><a href="{{redeem_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redeem Your Gift Card</a></p></div><p style="text-align: center; color: #666; font-size: 14px;">Thank you for being a valued ColorCompete Pro subscriber! Keep creating amazing art.</p><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Dashboard</a></div></div>',
      textContent: 'Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} monthly drawing. Gift card code: {{gift_card_code}}'
    },
    schedule: {
      time: '11:00',
      timezone: 'America/New_York'
    },
    monthlyDrawingSettings: {
      subscriptionTier: 'pro',
      prizeAmount: 50,
      drawingDate: 1
    }
  },
  {
    name: 'Monthly Drawing - Champion Tier',
    description: 'Monthly $100 gift card drawing for Champion subscribers',
    isActive: true,
    triggerType: 'monthly_drawing_champ',
    createdBy: new mongoose.Types.ObjectId(),
    emailTemplate: {
      subject: '🎁 Congratulations! You won the Champion Monthly Drawing - $100 Gift Card!',
      htmlContent: '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h1 style="color: #28a745; text-align: center;">🎁 You\'re a Winner!</h1><p>Congratulations {{winner_name}}! You\'ve won the {{tier_name}} tier monthly drawing for {{month_year}}!</p><div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;"><h2 style="margin-top: 0; color: #28a745;">Prize: ${{prize_amount}} Gift Card</h2><p><strong>Gift Card Code:</strong> {{gift_card_code}}</p><p><a href="{{redeem_url}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Redeem Your Gift Card</a></p></div><p style="text-align: center; color: #666; font-size: 14px;">Thank you for being a valued ColorCompete Champion subscriber! Keep creating amazing art.</p><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Dashboard</a></div></div>',
      textContent: 'Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} monthly drawing. Gift card code: {{gift_card_code}}'
    },
    schedule: {
      time: '11:00',
      timezone: 'America/New_York'
    },
    monthlyDrawingSettings: {
      subscriptionTier: 'champ',
      prizeAmount: 100,
      drawingDate: 1
    }
  }
];

async function setupMonthlyDrawingAutomations() {
  try {
    console.log('Connected to MongoDB');
    
    for (const automation of monthlyDrawingAutomations) {
      const existing = await EmailAutomation.findOne({ triggerType: automation.triggerType });
      
      if (existing) {
        console.log(`✓ Automation already exists: ${automation.name} (${automation.triggerType})`);
        // Update if needed
        await EmailAutomation.findByIdAndUpdate(existing._id, automation);
        console.log(`✓ Updated automation: ${automation.name}`);
      } else {
        const newAutomation = await EmailAutomation.create(automation);
        console.log(`✓ Created automation: ${newAutomation.name} (${newAutomation.triggerType})`);
      }
    }
    
    const count = await EmailAutomation.countDocuments({
      triggerType: { $in: ['monthly_drawing_lite', 'monthly_drawing_pro', 'monthly_drawing_champ'] }
    });
    
    console.log(`\nTotal monthly drawing automations: ${count}`);
    
    console.log('\n🎉 Monthly drawing automation setup complete!');
  } catch (error) {
    console.error('Error setting up monthly drawing automations:', error);
  } finally {
    await mongoose.connection.close();
  }
}

setupMonthlyDrawingAutomations();