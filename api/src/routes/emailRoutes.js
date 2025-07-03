const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const EmailAutomation = require('../models/EmailAutomation');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const emailService = require('../services/emailService');
const emailAutomationService = require('../services/emailAutomationService');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =============== EMAIL CAMPAIGNS ===============

// Get all campaigns
router.get('/campaigns', requireAdmin, async (req, res) => {
  try {
    const campaigns = await EmailCampaign.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign by ID
router.get('/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
router.post('/campaigns', requireAdmin, async (req, res) => {
  console.log('creating campaign with data:', req.body);
  try {
    const campaign = new EmailCampaign({
      ...req.body,
      createdBy: req.user._id
    });
    
    await campaign.save();
    await campaign.populate('createdBy', 'username email');
    
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
router.put('/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/campaigns/:id', requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findByIdAndDelete(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send campaign
router.post('/campaigns/:id/send', requireAdmin, async (req, res) => {
  try {
    const campaign = await EmailCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Campaign has already been sent' });
    }
    
    // Get recipients based on target audience
    let recipients = [];
    
    if (campaign.targetAudience.allMembers) {
      recipients = await User.find({ 
        email: { $exists: true, $ne: '' }
      }).select('_id email firstName lastName');
    } else {
      const query = {};
      
      if (campaign.targetAudience.subscriptionTypes.length > 0) {
        query['subscription.type'] = { $in: campaign.targetAudience.subscriptionTypes };
      }
      
      if (campaign.targetAudience.specificUsers.length > 0) {
        query._id = { $in: campaign.targetAudience.specificUsers };
      }
      
      recipients = await User.find(query).select('_id email firstName lastName');
    }
    
    campaign.recipientCount = recipients.length;
    campaign.status = 'sending';
    await campaign.save();
    
    // Send emails (this could be moved to a background job for large lists)
    const recipientData = recipients.map(user => ({
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }));
    
    // Replace template variables for each recipient
    const results = [];
    for (const recipient of recipientData) {
      const personalizedSubject = emailService.replaceTemplateVariables(campaign.subject, {
        first_name: recipient.firstName,
        last_name: recipient.lastName
      });
      
      const personalizedContent = emailService.replaceTemplateVariables(campaign.htmlContent, {
        first_name: recipient.firstName,
        last_name: recipient.lastName
      });
      
      const result = await emailService.sendEmail({
        to: { userId: recipient.userId, email: recipient.email },
        subject: personalizedSubject,
        htmlContent: personalizedContent,
        textContent: campaign.textContent,
        campaignId: campaign._id
      });
      
      if (result.success) {
        campaign.sentCount += 1;
      }
      
      results.push(result);
    }
    
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    await campaign.save();
    
    res.json({
      message: 'Campaign sent successfully',
      sentCount: campaign.sentCount,
      totalRecipients: campaign.recipientCount,
      results
    });
    
  } catch (error) {
    // Update campaign status to failed
    const campaign = await EmailCampaign.findById(req.params.id);
    if (campaign) {
      campaign.status = 'failed';
      await campaign.save();
    }
    
    res.status(500).json({ error: error.message });
  }
});

// =============== EMAIL AUTOMATIONS ===============

// Get all automations
router.get('/automations', requireAdmin, async (req, res) => {
  try {
    const automations = await EmailAutomation.find()
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(automations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get automation by ID
router.get('/automations/:id', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    res.json(automation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new automation
router.post('/automations', requireAdmin, async (req, res) => {
  try {
    const automation = new EmailAutomation({
      ...req.body,
      createdBy: req.user._id
    });
    
    await automation.save();
    await automation.populate('createdBy', 'username email');
    
    // Schedule the automation if it's active
    if (automation.isActive) {
      emailAutomationService.scheduleAutomation(automation);
    }
    
    res.status(201).json(automation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update automation
router.put('/automations/:id', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    // Update the automation schedule
    await emailAutomationService.updateAutomation(automation._id);
    
    res.json(automation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle automation active status
router.patch('/automations/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findById(req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    automation.isActive = !automation.isActive;
    automation.updatedAt = Date.now();
    await automation.save();
    
    // Update the automation schedule
    await emailAutomationService.updateAutomation(automation._id);
    
    res.json({ 
      message: `Automation ${automation.isActive ? 'activated' : 'deactivated'}`,
      isActive: automation.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete automation
router.delete('/automations/:id', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findByIdAndDelete(req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    res.json({ message: 'Automation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== EMAIL ANALYTICS ===============

// Get campaign analytics
router.get('/campaigns/:id/analytics', requireAdmin, async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const analytics = await EmailLog.aggregate([
      { $match: { campaignId: mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalOpens = await EmailLog.countDocuments({
      campaignId,
      status: { $in: ['opened', 'clicked'] }
    });
    
    const totalClicks = await EmailLog.countDocuments({
      campaignId,
      status: 'clicked'
    });
    
    res.json({
      analytics,
      totalOpens,
      totalClicks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overall email analytics
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));
    
    const totalSent = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo }
    });
    
    const totalDelivered = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: { $in: ['delivered', 'opened', 'clicked'] }
    });
    
    const totalOpened = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: { $in: ['opened', 'clicked'] }
    });
    
    const totalClicked = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: 'clicked'
    });
    
    const totalBounced = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: 'bounced'
    });
    
    res.json({
      totalSent,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalBounced,
      deliveryRate: totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(2) : 0,
      openRate: totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(2) : 0,
      clickRate: totalOpened > 0 ? (totalClicked / totalOpened * 100).toFixed(2) : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== WEBHOOKS ===============

// SendGrid webhook endpoint
router.post('/webhook/sendgrid', async (req, res) => {
  try {
    await emailService.handleWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email endpoint
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    
    const result = await emailService.sendEmail({
      to: { userId: req.user._id, email },
      subject,
      htmlContent: content
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test gift card endpoint
router.post('/test-gift-card', requireAdmin, async (req, res) => {
  try {
    const { email, name, amount = 5, message } = req.body;
    
    const result = await emailService.sendGiftCard({
      recipientEmail: email,
      recipientName: name,
      amount,
      message: message || 'Test gift card from ColorCompete!'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test automation endpoint
router.post('/test-automation/:id', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findById(req.params.id);
    
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }
    
    // Create a test execution
    await emailAutomationService.executeAutomation(automation);
    
    res.json({ message: 'Test automation executed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
