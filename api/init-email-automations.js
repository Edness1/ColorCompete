const mongoose = require('mongoose');
require('dotenv').config();
const EmailAutomation = require('./src/models/EmailAutomation');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/colorcompete', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const defaultAutomations = [
  {
    name: 'Daily Winner Announcement',
    description: 'Automatically sends daily contest winner announcements to all members',
    triggerType: 'daily_winner',
    isActive: false, // Start inactive so admin can configure
    emailTemplate: {
      subject: '🎉 Daily Winner: {{winner_name}} - {{date}}',
      htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333; text-align: center;">🎨 Daily Contest Winner!</h1>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="font-size: 18px; margin: 0;">
      Congratulations to <strong style="color: #e74c3c;">{{winner_name}}</strong> 
      for winning today's ColorCompete contest!
    </p>
  </div>
  
  <h2 style="color: #555;">{{challenge_title}}</h2>
  
  <div style="text-align: center; margin: 20px 0;">
    <img src="{{submission_image}}" alt="Winning submission" 
         style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  </div>
  
  <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; text-align: center;">
      🎨 Ready to showcase your creativity? 
      <a href="https://colorcompete.com" style="color: #27ae60; text-decoration: none;">
        Join today's contest!
      </a>
    </p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="color: #666; font-size: 14px; text-align: center;">
    This is an automated message from ColorCompete. 
    <a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
      textContent: `Daily Contest Winner!

Congratulations to {{winner_name}} for winning today's ColorCompete contest!

Contest: {{challenge_title}}
Date: {{date}}

Check out the winning submission and join today's contest at colorcompete.com

---
ColorCompete - Where creativity meets competition`
    },
    schedule: {
      time: '09:00',
      timezone: 'America/New_York'
    },
    createdBy: null // Will be set by admin
  },
  
  {
    name: 'Monthly Champion Announcement',
    description: 'Automatically sends monthly contest champion announcements to all members',
    triggerType: 'monthly_winner',
    isActive: false,
    emailTemplate: {
      subject: '🏆 Monthly Champion: {{winner_name}} - {{month}}',
      htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333; text-align: center;">🏆 Monthly Contest Champion!</h1>
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center;">
    <h2 style="margin: 0; font-size: 24px;">🎉 Congratulations!</h2>
    <p style="font-size: 20px; margin: 10px 0;">
      <strong>{{winner_name}}</strong>
    </p>
    <p style="margin: 0; opacity: 0.9;">
      Monthly Champion for {{month}}
    </p>
  </div>
  
  <h2 style="color: #555; text-align: center;">{{challenge_title}}</h2>
  
  <div style="text-align: center; margin: 30px 0;">
    <img src="{{submission_image}}" alt="Champion submission" 
         style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
  </div>
  
  <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; text-align: center; color: #856404;">
      <strong>🎨 This masterpiece stood out among all entries this month!</strong><br>
      Congratulations to {{winner_name}} for this incredible achievement!
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://colorcompete.com" 
       style="background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      🎯 Join This Month's Contest
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="color: #666; font-size: 14px; text-align: center;">
    This is an automated message from ColorCompete. 
    <a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
      textContent: `Monthly Contest Champion!

🏆 Congratulations to {{winner_name}} for being our monthly champion for {{month}}!

Contest: {{challenge_title}}

This masterpiece stood out among all entries this month. Incredible work!

Join this month's contest at colorcompete.com

---
ColorCompete - Where creativity meets competition`
    },
    schedule: {
      time: '10:00',
      dayOfMonth: 1,
      timezone: 'America/New_York'
    },
    createdBy: null
  },
  
  {
    name: 'Winner Gift Card Reward',
    description: 'Automatically sends gift cards to contest winners via Tremendous API',
    triggerType: 'winner_reward',
    isActive: false,
    emailTemplate: {
      subject: '🎁 Your ${{reward_amount}} Gift Card is Here!',
      htmlContent: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px; border-radius: 12px; margin: 20px 0; text-align: center;">
    <h1 style="margin: 0; font-size: 32px;">🎁 Congratulations!</h1>
    <p style="font-size: 24px; margin: 15px 0;">
      <strong>{{winner_name}}</strong>
    </p>
    <p style="margin: 0; font-size: 18px; opacity: 0.9;">
      You've won a ${{reward_amount}} gift card!
    </p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <h2 style="color: #333; margin-bottom: 10px;">Your Winning Entry</h2>
    <h3 style="color: #666; margin-bottom: 20px;">{{challenge_title}}</h3>
    <img src="{{submission_image}}" alt="Your winning submission" 
         style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
  </div>
  
  <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #155724;">🎉 Your Reward is On Its Way!</h3>
    <p style="margin-bottom: 0; color: #155724;">
      Your ${{reward_amount}} gift card has been sent to your email address. 
      Please check your inbox and spam folder. The gift card should arrive within a few minutes.
    </p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h4 style="margin-top: 0; color: #333;">What's Next?</h4>
    <ul style="color: #666; margin-bottom: 0;">
      <li>Check your email for the gift card</li>
      <li>Follow the instructions to redeem your reward</li>
      <li>Share your winning artwork on social media</li>
      <li>Join our next contest for another chance to win!</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://colorcompete.com" 
       style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      🎨 Join Next Contest
    </a>
  </div>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
  
  <p style="color: #666; font-size: 14px; text-align: center;">
    Questions about your reward? Contact us at support@colorcompete.com<br>
    <a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a>
  </p>
</div>`,
      textContent: `🎁 Congratulations {{winner_name}}!

You've won a ${{reward_amount}} gift card for your winning entry in the "{{challenge_title}}" contest!

Your gift card has been sent to your email address. Please check your inbox and spam folder.

What's Next:
- Check your email for the gift card
- Follow the instructions to redeem your reward  
- Share your winning artwork on social media
- Join our next contest for another chance to win!

Questions? Contact us at support@colorcompete.com

---
ColorCompete - Where creativity meets competition`
    },
    rewardSettings: {
      giftCardAmount: 25,
      giftCardMessage: 'Congratulations on winning the ColorCompete contest! Your creativity and talent have earned you this reward. Keep creating amazing art!'
    },
    createdBy: null
  }
];

async function initializeAutomations() {
  try {
    console.log('🚀 Initializing default email automations...');
    
    for (const automation of defaultAutomations) {
      // Check if automation already exists
      const existing = await EmailAutomation.findOne({ 
        triggerType: automation.triggerType 
      });
      
      if (!existing) {
        const newAutomation = new EmailAutomation(automation);
        await newAutomation.save();
        console.log(`✅ Created automation: ${automation.name}`);
      } else {
        console.log(`⏭️  Automation already exists: ${automation.name}`);
      }
    }
    
    console.log('\n📧 Email automation setup complete!');
    console.log('\nNext steps:');
    console.log('1. Set up your SendGrid API key in .env');
    console.log('2. Set up your Tremendous API credentials in .env');
    console.log('3. Go to Admin Dashboard → Email Marketing → Automations');
    console.log('4. Configure and activate the automations you want to use');
    console.log('5. Test with a small audience first');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing automations:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeAutomations();
