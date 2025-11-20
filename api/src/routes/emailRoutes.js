const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const EmailCampaign = require('../models/EmailCampaign');
const EmailAutomation = require('../models/EmailAutomation');
const EmailLog = require('../models/EmailLog');
const User = require('../models/User');
const emailService = require('../services/emailService');
const emailAutomationService = require('../services/emailAutomationService');
const emailTemplateService = require('../services/emailTemplateService');
const emailSvc = require('../services/emailService');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Local/dev bypass: allow admin routes when explicitly enabled
    if (process.env.DEV_BYPASS_ADMIN === 'true') {
      return next();
    }
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

// Preview a template render (debug): body { templateName, variables }
router.post('/preview', requireAdmin, async (req, res) => {
  try {
    const { templateName = 'admin_broadcast', variables = {} } = req.body || {};
    const rendered = emailTemplateService.render(templateName, variables);
    const html = rendered.html;
    // Extract body inner HTML for the text preview to match sending path
    const m = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const inner = m && m[1] ? m[1] : html;
    const text = emailSvc.htmlToText(inner);
    res.json({ subject: rendered.subject, html, text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed default automations (contest_announcement, voting_results, weekly_summary) and admin_broadcast
router.post('/automations/seed-defaults', requireAdmin, async (req, res) => {
  try {
    const {
      time = process.env.DEFAULT_AUTOMATION_TIME || '09:00',
      dayOfWeek = 1, // Monday by default for weekly_summary
      timezone = process.env.DEFAULT_AUTOMATION_TZ || 'America/New_York'
    } = req.body || {};

    const upserts = [];

    const ensureAutomation = async ({ name, triggerType, templateName }) => {
      const tpl = emailTemplateService.render(templateName, {});
      const update = {
        name,
        isActive: true,
        triggerType,
        emailTemplate: { subject: tpl.subject, htmlContent: tpl.html },
        schedule: { time, timezone, ...(triggerType === 'weekly_summary' ? { dayOfWeek } : {}) }
      };
      const doc = await EmailAutomation.findOneAndUpdate(
        { triggerType },
        update,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      // schedule or reschedule
      emailAutomationService.scheduleAutomation(doc);
      upserts.push({ triggerType, id: doc._id });
    };

    await ensureAutomation({ name: 'Contest Announcement', triggerType: 'contest_announcement', templateName: 'contest_announcement' });
    await ensureAutomation({ name: 'Voting Results', triggerType: 'voting_results', templateName: 'voting_results' });
    await ensureAutomation({ name: 'Weekly Summary', triggerType: 'weekly_summary', templateName: 'weekly_summary' });

    // Admin broadcast is event-based, no schedule
    const adminTpl = emailTemplateService.render('admin_broadcast', { subject: 'Admin Broadcast', bodyHtml: 'Hello {{userName}},<br/>This is a test broadcast.' });
    const adminDoc = await EmailAutomation.findOneAndUpdate(
      { triggerType: 'admin_broadcast' },
      { name: 'Admin Broadcast', isActive: true, triggerType: 'admin_broadcast', emailTemplate: { subject: adminTpl.subject, htmlContent: adminTpl.html } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Defaults seeded', upserts: [...upserts, { triggerType: 'admin_broadcast', id: adminDoc._id }] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin broadcast send: body { subject, bodyHtml, audience?: 'all'|'subscribers'|'specific', userIds?: [] }
router.post('/automations/admin-broadcast/send', requireAdmin, async (req, res) => {
  try {
    const { subject, bodyHtml, audience = 'all', userIds = [] } = req.body;
    if (!subject || !bodyHtml) return res.status(400).json({ error: 'subject and bodyHtml are required' });

    // Ensure automation exists for logging/template
    const automation = await EmailAutomation.findOne({ triggerType: 'admin_broadcast' });
    if (!automation) return res.status(400).json({ error: 'admin_broadcast automation not seeded' });

    let usersQuery = { email: { $exists: true, $ne: '' } };
    if (audience === 'specific' && Array.isArray(userIds) && userIds.length) {
      usersQuery._id = { $in: userIds };
    }
    // future: add subscribers filter
    const users = await User.find(usersQuery).select('_id email firstName lastName username');

    let sent = 0;
    const results = [];
    for (const u of users) {
      const userName = u.firstName || u.username || 'ColorCompeter';
      // Normalize body to preserve line breaks in email clients
      const normalizedBody = String(bodyHtml)
        .replace(/\r\n/g, '\n')
        // Split paragraphs on double newline and wrap with <p>
        .split(/\n{2,}/)
        .map(block => block.trim().length ? `<p style="margin:0 0 12px 0;">${block.replace(/\n/g, '<br/>')}</p>` : '')
        .join('');
      // render admin template with provided content
      const tpl = emailTemplateService.render('admin_broadcast', {
        subject,
        bodyHtml: normalizedBody,
        userName,
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/unsubscribe?userId=${u._id}`
      });

      const result = await emailService.sendEmail({
        to: { userId: u._id, email: u.email },
        subject: subject,
        htmlContent: tpl.html,
        automationId: automation._id
      });
      results.push({ email: u.email, ...result });
      if (result.success) sent += 1;
      await emailService.delay(75);
    }

    res.json({ message: 'Broadcast attempted', attempted: users.length, sent, results });
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
    
    // First check if there are ANY email logs at all
    const totalLogsEver = await EmailLog.countDocuments();
    console.log(`Total email logs in database: ${totalLogsEver}`);
    
    const totalSent = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo }
    });
    
    const totalDelivered = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: 'delivered'
    });
    
    const totalBounced = await EmailLog.countDocuments({
      sentAt: { $gte: daysAgo },
      status: { $in: ['bounced', 'failed'] }
    });
    
    // Calculate rates with proper string formatting
    const deliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(2) : '0.00';
    const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(2) : '0.00';
    
    res.json({
      totalSent,
      totalDelivered,
      totalBounced,
      deliveryRate,
      bounceRate
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check email logs and ID matching
router.get('/analytics/debug', requireAdmin, async (req, res) => {
  try {
    const totalLogs = await EmailLog.countDocuments();
    const recentLogs = await EmailLog.find()
      .sort({ sentAt: -1 })
      .limit(10)
      .select('recipientEmail subject status sentAt deliveredAt openedAt clickedAt sendGridMessageId')
      .lean();
    
    const statusBreakdown = await EmailLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get sample of message IDs from database
    const sampleIds = await EmailLog.find({ sendGridMessageId: { $exists: true, $ne: null } })
      .limit(5)
      .select('sendGridMessageId recipientEmail')
      .lean();
    
    // Try to fetch SendPulse data to compare
    let sendPulsePreview = null;
    try {
      const spData = await emailService.fetchEmailStatistics();
      if (spData) {
        const emails = Array.isArray(spData) ? spData : spData.data || spData.emails || [];
        sendPulsePreview = {
          count: Array.isArray(emails) ? emails.length : 0,
          structure: emails.length > 0 ? Object.keys(emails[0]) : [],
          sampleIds: emails.slice(0, 3).map(e => ({
            id: e.id || e.smtp_id || e.email_id || e.message_id,
            email: e.email || e.recipient || e.to,
            status: e.status || e.email_status
          }))
        };
      }
    } catch (e) {
      sendPulsePreview = { error: e.message };
    }
    
    res.json({
      database: {
        totalLogs,
        statusBreakdown,
        recentLogs,
        sampleMessageIds: sampleIds
      },
      sendPulse: sendPulsePreview,
      note: totalLogs === 0 
        ? 'No email logs found. Send a campaign first.'
        : 'Compare message IDs between database and SendPulse to diagnose matching issues.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync statistics from SendPulse API
router.post('/analytics/sync', requireAdmin, async (req, res) => {
  try {
    const result = await emailService.syncStatisticsFromSendPulse();
    res.json({
      message: 'Statistics synced successfully',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Workaround: Mark all 'sent' emails as 'delivered' (use when SendPulse API matching fails)
router.post('/analytics/mark-delivered', requireAdmin, async (req, res) => {
  try {
    // Fetch emails with 'sent' status and update them individually
    const sentEmails = await EmailLog.find({ status: 'sent' });
    
    let modifiedCount = 0;
    for (const email of sentEmails) {
      await EmailLog.updateOne(
        { _id: email._id },
        { 
          $set: { 
            status: 'delivered',
            deliveredAt: email.sentAt || new Date()
          } 
        }
      );
      modifiedCount++;
    }
    
    res.json({
      message: 'Marked sent emails as delivered',
      modified: modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== WEBHOOKS ===============

// SendPulse webhook endpoint (primary)
router.post('/webhook/sendpulse', async (req, res) => {
  try {
    await emailService.handleSendPulseWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('SendPulse webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Backward compatible: legacy SendGrid webhook path now routed to the new handler
router.post('/webhook/sendgrid', async (req, res) => {
  try {
    await emailService.handleSendPulseWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Legacy webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email endpoint
router.post('/test', requireAdmin, async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    // When DEV_BYPASS_ADMIN is true, req.user may be undefined; provide a fallback ObjectId for logging
    const fallbackUserId = new mongoose.Types.ObjectId();
    const result = await emailService.sendEmail({
      to: { userId: (req.user && req.user._id) ? req.user._id : fallbackUserId, email },
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

// Send a test email to all users for a specific automation (bypasses business conditions)
router.post('/automations/:id/test-send-all', requireAdmin, async (req, res) => {
  try {
    const automation = await EmailAutomation.findById(req.params.id);
    if (!automation) {
      return res.status(404).json({ error: 'Automation not found' });
    }

    // Load recipients: all users with email
    const users = await User.find({ email: { $exists: true, $ne: '' } }).select('_id email firstName lastName username');

    // Build a broad set of test variables to maximize template replacement coverage
    const commonData = {
      // snake_case variables (used by some UI defaults)
      challenge_title: 'Test Contest Title',
      challenge_description: 'This is a test description for the latest ColorCompete contest.',
      end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString(),
      prize_amount: '$25 Gift Card',
      contest_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
      winner_name: 'Alex Artist',
      winning_submission: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/images/winning-submission.png`,
      total_votes: '123',
      results_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/results`,
      user_name: 'ColorCompeter',
      user_submissions_count: '3',
      user_wins_count: '1',
      user_total_votes: '42',
      dashboard_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/`,
      active_contests: '4',
      new_members: '25',
      total_submissions: '87',

      // camelCase variables (used by service-side templates)
      contestTitle: 'Test Contest Title',
      contestDescription: 'This is a test description for the latest ColorCompete contest.',
      contestPrize: '$25 Gift Card',
      contestDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString(),
      votingPeriod: `${new Date().toLocaleDateString()} - ${new Date(Date.now() + 2 * 24 * 3600 * 1000).toLocaleDateString()}`,
      contestUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
      totalSubmissions: '87',
      totalParticipants: '54',
      totalVotes: '123',
      winners: [
        { rank: '1st', winnerName: 'Alex Artist', prize: '$25', voteCount: 45, submissionImage: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/win1.png` },
        { rank: '2nd', winnerName: 'Pat Painter', prize: '$10', voteCount: 30, submissionImage: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/win2.png` }
      ],
      dashboardUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
      unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/unsubscribe`,
      websiteUrl: process.env.FRONTEND_URL || 'https://colorcompete.com'
    };

    let sent = 0;
    const results = [];
    for (const u of users) {
      const firstName = u.firstName || u.username || 'ColorCompeter';
      const lastName = u.lastName || '';
      const perUserData = {
        ...commonData,
        // Common name variants
        user_name: firstName,
        userName: firstName,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName}${lastName ? ' ' + lastName : ''}`,

        // Metric synonyms: include both user_* and generic forms
        submissions_count: commonData.user_submissions_count || commonData.submissions_count || '0',
        wins_count: commonData.user_wins_count || commonData.wins_count || '0',
        votes_count: commonData.user_total_votes || commonData.total_votes || '0',

        // Also expose total_* synonyms
        total_submissions_count: commonData.total_submissions || commonData.total_submissions_count || '0',
        total_votes_count: commonData.total_votes || commonData.total_votes_count || '0',
        total_participants_count: commonData.total_participants || commonData.total_participants_count || '0',

        unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/unsubscribe?userId=${u._id}`
      };

      const subject = emailService.replaceTemplateVariables(automation.emailTemplate.subject, perUserData);
      const htmlContent = emailService.replaceTemplateVariables(automation.emailTemplate.htmlContent, perUserData);

      const result = await emailService.sendEmail({
        to: { userId: u._id, email: u.email },
        subject,
        htmlContent,
        automationId: automation._id
      });
      results.push({ email: u.email, ...result });
      if (result.success) sent += 1;

      // brief delay to avoid rate limit bursts
      await emailService.delay(75);
    }

    // Do not mutate totals on test runs, just return a summary
    return res.json({
      message: 'Test emails attempted for automation',
      automationId: automation._id,
      attempted: users.length,
      sent,
      results
    });
  } catch (error) {
    console.error('Error in test-send-all:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send test emails for all automations to all users
router.post('/automations/test-send-all', requireAdmin, async (req, res) => {
  try {
    const automations = await EmailAutomation.find();
    const summary = [];
    for (const a of automations) {
      // Reuse the endpoint logic by simulating an internal call
      const users = await User.find({ email: { $exists: true, $ne: '' } }).select('_id email firstName lastName username');

      const commonData = {
        challenge_title: 'Test Contest Title',
        challenge_description: 'This is a test description for the latest ColorCompete contest.',
        end_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString(),
        prize_amount: '$25 Gift Card',
        contest_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
        winner_name: 'Alex Artist',
        winning_submission: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/images/winning.png`,
        total_votes: '123',
        results_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/results`,
        user_name: 'ColorCompeter',
        user_submissions_count: '3',
        user_wins_count: '1',
        user_total_votes: '42',
        dashboard_url: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
        active_contests: '4',
        new_members: '25',
        total_submissions: '87',

        contestTitle: 'Test Contest Title',
        contestDescription: 'This is a test description for the latest ColorCompete contest.',
        contestPrize: '$25 Gift Card',
        contestDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString(),
        votingPeriod: `${new Date().toLocaleDateString()} - ${new Date(Date.now() + 2 * 24 * 3600 * 1000).toLocaleDateString()}`,
        contestUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
        totalSubmissions: '87',
        totalParticipants: '54',
        totalVotes: '123',
        winners: [
          { rank: '1st', winnerName: 'Alex Artist', prize: '$25', voteCount: 45, submissionImage: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/win1.png` },
          { rank: '2nd', winnerName: 'Pat Painter', prize: '$10', voteCount: 30, submissionImage: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/images/win2.png` }
        ],
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}`,
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/unsubscribe`,
        websiteUrl: process.env.FRONTEND_URL || 'https://colorcompete.com'
      };

      let sent = 0;
      for (const u of users) {
        const firstName = u.firstName || u.username || 'ColorCompeter';
        const lastName = u.lastName || '';
        const perUserData = {
          ...commonData,
          user_name: firstName,
          userName: firstName,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
          unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://colorcompete.com'}/unsubscribe?userId=${u._id}`
        };
        const subject = emailService.replaceTemplateVariables(a.emailTemplate.subject, perUserData);
        const htmlContent = emailService.replaceTemplateVariables(a.emailTemplate.htmlContent, perUserData);
        const result = await emailService.sendEmail({
          to: { userId: u._id, email: u.email },
          subject,
          htmlContent,
          automationId: a._id
        });
        if (result.success) {
          sent += 1;
        } else {
          // Log failure details to server console for debugging
          console.warn('[automations/test-send-all] send failed', { email: u.email, error: result.error });
        }
        await emailService.delay(75);
      }
      summary.push({ automationId: a._id, name: a.name, attempted: users.length, sent });
    }

    return res.json({ message: 'Test emails attempted for all automations', summary });
  } catch (error) {
    console.error('Error in automations test-send-all:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
 
// Admin-only: trigger a contest announcement for a specific challenge now
router.post('/automations/contest-announcement/execute', requireAdmin, async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId required' });
    const challenge = await require('../models/Challenge').findById(challengeId);
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    await emailAutomationService.sendContestAnnouncement({
      _id: challenge._id,
      title: challenge.title,
      description: challenge.description || '',
      prize: undefined,
      deadline: challenge.endDate,
      votingPeriod: undefined
    });
    res.json({ message: 'Contest announcement triggered', challengeId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin-only: trigger a voting results send for a specific challenge now
router.post('/automations/voting-results/execute', requireAdmin, async (req, res) => {
  try {
    const { challengeId } = req.body;
    if (!challengeId) return res.status(400).json({ error: 'challengeId required' });
    const Challenge = require('../models/Challenge');
    const Submission = require('../models/Submission');
    const challenge = await Challenge.findById(challengeId).populate('winner');
    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
    if (!challenge.winner) return res.status(400).json({ error: 'Challenge has no winner set' });

    const subs = await Submission.find({ challenge_id: challenge._id });
    const participantIds = [...new Set(subs.map(s => s.user_id).filter(Boolean))];
    const totalSubmissions = subs.length;
    const totalVotes = subs.reduce((acc, s) => acc + (Array.isArray(s.votes) ? s.votes.length : 0), 0);
    const winnerSubmission = subs.find(s => s.user_id && s.user_id.toString() === challenge.winner._id.toString());
    const winners = [{
      user: challenge.winner,
      prize: undefined,
      votes: winnerSubmission && Array.isArray(winnerSubmission.votes) ? winnerSubmission.votes.length : 0,
      imageUrl: (winnerSubmission && (winnerSubmission.imageUrl || winnerSubmission.file_path)) || undefined
    }];

    await emailAutomationService.sendVotingResults({
      _id: challenge._id,
      title: challenge.title,
      totalSubmissions,
      totalVotes,
      participantIds
    }, winners);

    res.json({ message: 'Voting results triggered', challengeId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== CONTACT FORM ===============

// Handle contact form submissions
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        error: 'All fields are required (name, email, subject, message)' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Please provide a valid email address' 
      });
    }
    
    // Create HTML content for the email
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .content { padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
              <p>You have received a new message through the ColorCompete contact form.</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Create plain text version
    const textContent = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
    `.trim();
    
    // Send email to colorcompete@gmail.com
    await emailService.sendEmail({
      to: { 
        email: 'colorcompete@gmail.com',
        userId: null // No user ID for contact form submissions
      },
      subject: `Contact Form: ${subject}`,
      htmlContent,
      textContent
    });
    
    // Log the contact form submission
    console.log(`Contact form submission from ${name} (${email}): ${subject}`);
    
    res.json({ 
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.' 
    });
    
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      error: 'Failed to send message. Please try again later.' 
    });
  }
});

// =============== CRON JOBS / AUTOMATED TASKS ===============

// Automated statistics sync endpoint (call this from a cron job)
// No authentication required - use a secret token instead for security
router.post('/cron/sync-stats', async (req, res) => {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    const expectedSecret = process.env.CRON_SECRET || 'change-me-in-production';
    
    if (cronSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Starting automated statistics sync...');
    const result = await emailService.syncStatisticsFromSendPulse();
    console.log('Statistics sync completed:', result);
    
    res.json({
      message: 'Automated statistics sync completed',
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Cron sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
