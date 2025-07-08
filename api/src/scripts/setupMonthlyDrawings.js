const mongoose = require('mongoose');
const EmailAutomation = require('../models/EmailAutomation');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

async function createMonthlyDrawingAutomations() {
  try {
    console.log('Creating monthly drawing automations...');

    // Helper function to create winner email template
    function createWinnerTemplate(tierColor) {
      return '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<div style="background: ' + tierColor + '; color: white; padding: 40px 20px; text-align: center;">' +
        '<h1 style="margin: 0; font-size: 32px;">🎉 Congratulations!</h1>' +
        '<p style="margin: 10px 0 0; font-size: 18px;">You are this month\'s {{tier_name}} tier winner!</p>' +
        '</div>' +
        '<div style="padding: 40px 20px; background: #f8f9fa;">' +
        '<h2 style="color: #333; margin-bottom: 20px;">Hi {{winner_name}},</h2>' +
        '<p style="font-size: 16px; line-height: 1.6; color: #333;">' +
        'We are thrilled to announce that you have won the <strong>{{tier_name}} Monthly Drawing</strong> for {{month_year}}! ' +
        'You have been randomly selected from all {{tier_name}} subscribers to receive a <strong>${{prize_amount}} gift card</strong>.' +
        '</p>' +
        '<div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; text-align: center; border-left: 4px solid #28a745;">' +
        '<h3 style="color: #28a745; margin: 0 0 15px;">Your Prize Details</h3>' +
        '<p style="font-size: 18px; font-weight: bold; color: #333; margin: 0;">${{prize_amount}} Gift Card</p>' +
        '<p style="color: #666; margin: 10px 0;">Gift Card Code: <strong>{{gift_card_code}}</strong></p>' +
        '<a href="{{redeem_url}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Redeem Your Gift Card</a>' +
        '</div>' +
        '<p style="font-size: 16px; line-height: 1.6; color: #333;">' +
        'Thank you for being a valued {{tier_name}} subscriber! Keep participating in contests and stay creative.' +
        '</p>' +
        '<div style="text-align: center; margin: 30px 0;">' +
        '<a href="{{dashboard_url}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">Visit Your Dashboard</a>' +
        '</div>' +
        '</div>' +
        '<div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 12px;">' +
        '<p>© 2025 ColorCompete. All rights reserved.</p>' +
        '<p><a href="{{unsubscribe_url}}" style="color: #ccc;">Unsubscribe</a> | <a href="{{website_url}}" style="color: #ccc;">Visit Website</a></p>' +
        '</div>' +
        '</div>';
    }

    // Monthly Drawing Winner Automations
    const monthlyDrawingAutomations = [
      {
        name: 'Monthly Drawing - Lite Winner',
        description: 'Automated email sent to Lite tier monthly drawing winner with $25 gift card',
        triggerType: 'monthly_drawing_lite',
        isActive: true,
        schedule: {
          time: '10:00',
          timezone: 'America/New_York'
        },
        monthlyDrawingSettings: {
          subscriptionTier: 'lite',
          prizeAmount: 25,
          drawingDate: 1
        },
        emailTemplate: {
          subject: '🎉 Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} Monthly Drawing!',
          htmlContent: createWinnerTemplate('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        }
      },
      {
        name: 'Monthly Drawing - Pro Winner',
        description: 'Automated email sent to Pro tier monthly drawing winner with $50 gift card',
        triggerType: 'monthly_drawing_pro',
        isActive: true,
        schedule: {
          time: '10:00',
          timezone: 'America/New_York'
        },
        monthlyDrawingSettings: {
          subscriptionTier: 'pro',
          prizeAmount: 50,
          drawingDate: 1
        },
        emailTemplate: {
          subject: '🎉 Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} Monthly Drawing!',
          htmlContent: createWinnerTemplate('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')
        }
      },
      {
        name: 'Monthly Drawing - Champ Winner',
        description: 'Automated email sent to Champ tier monthly drawing winner with $100 gift card',
        triggerType: 'monthly_drawing_champ',
        isActive: true,
        schedule: {
          time: '10:00',
          timezone: 'America/New_York'
        },
        monthlyDrawingSettings: {
          subscriptionTier: 'champ',
          prizeAmount: 100,
          drawingDate: 1
        },
        emailTemplate: {
          subject: '🎉 Congratulations {{winner_name}}! You won ${{prize_amount}} in the {{tier_name}} Monthly Drawing!',
          htmlContent: createWinnerTemplate('linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)')
        }
      }
    ];

    // Create all automations
    for (const automation of monthlyDrawingAutomations) {
      const existingAutomation = await EmailAutomation.findOne({ 
        triggerType: automation.triggerType 
      });

      if (existingAutomation) {
        console.log('Automation already exists: ' + automation.name);
        continue;
      }

      // Add a dummy createdBy field (system user)
      automation.createdBy = new mongoose.Types.ObjectId();
      
      const newAutomation = new EmailAutomation(automation);
      await newAutomation.save();
      console.log('Created automation: ' + automation.name);
    }

    console.log('Monthly drawing automations setup complete!');
    
  } catch (error) {
    console.error('Error creating monthly drawing automations:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Run the setup
createMonthlyDrawingAutomations();
