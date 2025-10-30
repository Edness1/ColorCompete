const mongoose = require('mongoose');
require('dotenv').config();

const EmailAutomation = require('../models/EmailAutomation');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/colorcompete';

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const winnerAutomations = [
  {
    name: 'Daily Contest Winner Notification',
    description: 'Automatically send winner rewards when contests are completed',
    isActive: true,
    triggerType: 'daily_winner',
    createdBy: new mongoose.Types.ObjectId(),
    emailTemplate: {
      subject: '🏆 Contest Winner Notification: {{challenge_title}}',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745; text-align: center;">🏆 Congratulations!</h1>
          <p>A contest winner has been selected and rewarded!</p>
          
          <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin-top: 0; color: #28a745;">Contest: {{challenge_title}}</h2>
            <p>Winner reward has been automatically processed.</p>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            This is an automated notification for daily contest winner processing.
          </p>
        </div>
      `,
      textContent: 'Daily contest winner notification: {{challenge_title}}'
    },
    schedule: {
      time: '12:00',
      timezone: 'America/New_York'
    }
  },
  {
    name: 'Monthly Winner Processing',
    description: 'Trigger monthly drawing processing for all tiers',
    isActive: true,
    triggerType: 'monthly_winner',
    createdBy: new mongoose.Types.ObjectId(),
    emailTemplate: {
      subject: '🎁 Monthly Winner Processing Complete',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #007bff; text-align: center;">🎁 Monthly Drawing Complete</h1>
          <p>Monthly winner processing has been completed for all subscription tiers.</p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0;">
            <p>All eligible subscribers have been included in their respective tier drawings.</p>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 14px;">
            This is an automated notification for monthly winner processing.
          </p>
        </div>
      `,
      textContent: 'Monthly winner processing complete'
    },
    schedule: {
      time: '10:00',
      timezone: 'America/New_York'
    }
  }
];

async function setupWinnerAutomations() {
  try {
    console.log('Connected to MongoDB');
    
    for (const automation of winnerAutomations) {
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
      triggerType: { $in: ['daily_winner', 'monthly_winner'] }
    });
    
    console.log(`\nTotal winner automations: ${count}`);
    
    const all = await EmailAutomation.find({}, { name: 1, triggerType: 1, isActive: 1, schedule: 1 }).lean();
    console.table(all);
    
    console.log('\n🎉 Winner automation setup complete!');
  } catch (error) {
    console.error('Error setting up winner automations:', error);
  } finally {
    await mongoose.connection.close();
  }
}

setupWinnerAutomations();