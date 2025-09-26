let sgMail = null;
try {
  sgMail = require('@sendgrid/mail');
} catch (e) {
  console.warn('SendGrid library not available:', e?.message || e);
}
const axios = require('axios');
const EmailLog = require('../models/EmailLog');
const tremendousService = require('./tremendousService');

// Initialize SendGrid if configured
if (sgMail) {
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } else {
    console.warn('SendGrid not configured: SENDGRID_API_KEY is missing');
  }
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@colorcompete.com';
    this.fromName = process.env.FROM_NAME || 'ColorCompete';
  }

  // Send individual email
  async sendEmail({ to, subject, htmlContent, textContent, campaignId = null, automationId = null }) {
    try {
      if (!sgMail || !process.env.SENDGRID_API_KEY) {
        return { success: false, error: 'Email service is not configured' };
      }
      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent),
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true }
        }
      };

      const response = await sgMail.send(msg);
      
      // Log the email
      const emailLog = new EmailLog({
        recipient: to.userId,
        recipientEmail: to.email,
        campaignId,
        automationId,
        subject,
        status: 'sent',
        sendGridMessageId: response[0].headers['x-message-id']
      });
      
      await emailLog.save();
      
      return { success: true, messageId: response[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log the failure
      const emailLog = new EmailLog({
        recipient: to.userId,
        recipientEmail: to.email,
        campaignId,
        automationId,
        subject,
        status: 'failed',
        failureReason: error.message
      });
      
      await emailLog.save();
      
      return { success: false, error: error.message };
    }
  }

  // Send bulk emails
  async sendBulkEmails({ recipients, subject, htmlContent, textContent, campaignId = null }) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendEmail({
        to: recipient,
        subject,
        htmlContent,
        textContent,
        campaignId
      });
      
      results.push({ recipient: recipient.email, ...result });
      
      // Add delay to respect rate limits
      await this.delay(100);
    }
    
    return results;
  }

  // Send gift card via Tremendous API
  async sendGiftCard({ recipientEmail, recipientName, amount, message, campaignId = null, automationId = null }) {
    try {
      const result = await tremendousService.sendGiftCard({
        recipientEmail,
        recipientName,
        amount,
        message
      });

      // Log the gift card delivery
      const emailLog = new EmailLog({
        recipient: null, // We might not have user ID here
        recipientEmail,
        campaignId,
        automationId,
        subject: `Gift Card Reward - $${amount}`,
        status: result.success ? 'sent' : 'failed',
        failureReason: result.success ? null : result.error
      });
      
      await emailLog.save();

      return result;
    } catch (error) {
      console.error('Error sending gift card:', error);
      
      // Log the failure
      const emailLog = new EmailLog({
        recipient: null,
        recipientEmail,
        campaignId,
        automationId,
        subject: `Gift Card Reward - $${amount}`,
        status: 'failed',
        failureReason: error.message
      });
      
      await emailLog.save();
      
      return { success: false, error: error.message };
    }
  }

  // Template helper functions
  htmlToText(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Replace template variables
  replaceTemplateVariables(template, variables) {
    if (!template || !variables) return template;

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const toSnake = (s) => String(s)
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
    const toCamel = (s) => String(s)
      .toLowerCase()
      .replace(/[_-](\w)/g, (_, c) => c.toUpperCase());

    // Synonym groups: any provided key in a group will satisfy all others
    const KEY_GROUPS = [
      // Names
      ['user_name', 'first_name', 'userName', 'firstName'],
      ['last_name', 'lastName'],
      ['full_name', 'fullName'],
      // Contest fields
      ['challenge_title', 'contest_title', 'contestTitle'],
      ['challenge_description', 'contest_description', 'contestDescription'],
      ['end_date', 'contest_end_date', 'contestDeadline'],
      ['prize_amount', 'contest_prize', 'contestPrize'],
      ['contest_url', 'contestUrl'],
      ['results_url', 'contestResultsUrl'],
      // User metrics
      ['submissions_count', 'user_submissions_count', 'submission_count', 'submissionsCount', 'submissionCount'],
      ['wins_count', 'user_wins_count', 'win_count', 'winsCount', 'winCount'],
      ['votes_count', 'user_total_votes', 'vote_count', 'votesCount', 'voteCount'],
      // Totals
      ['total_submissions', 'total_submissions_count', 'totalSubmissions', 'totalSubmissionsCount'],
      ['total_votes', 'total_votes_count', 'totalVotes', 'totalVotesCount'],
      ['total_participants', 'total_participants_count', 'totalParticipants', 'totalParticipantsCount'],
      // URLs
      ['dashboard_url', 'dashboardUrl'],
      ['unsubscribe_url', 'unsubscribeUrl'],
      ['website_url', 'websiteUrl']
    ];

    let result = template;

    // Build a map of key variants to maximize match likelihood
    const variantsMap = new Map();
    for (const [key, val] of Object.entries(variables)) {
      const snake = toSnake(key);
      const camel = toCamel(key);
      [key, snake, camel].forEach((k) => { if (k) variantsMap.set(k, val); });

      // Also add synonyms from groups for this key
      for (const group of KEY_GROUPS) {
        const normalizedGroup = group.map(toSnake);
        if (normalizedGroup.includes(snake)) {
          for (const alias of group) {
            const aliasSnake = toSnake(alias);
            const aliasCamel = toCamel(alias);
            [alias, aliasSnake, aliasCamel].forEach((k) => { if (k) variantsMap.set(k, val); });
          }
        }
      }
    }

    // Replace {{ key }} allowing optional whitespace and case-insensitive key match
    for (const [vKey, vVal] of variantsMap.entries()) {
      const regex = new RegExp(`{{\\s*${esc(vKey)}\\s*}}`, 'gi');
      result = result.replace(regex, String(vVal ?? ''));
    }

    return result;
  }

  // Helper function to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Handle SendGrid webhooks for tracking
  async handleWebhook(events) {
    for (const event of events) {
      try {
        const emailLog = await EmailLog.findOne({ 
          sendGridMessageId: event.sg_message_id 
        });
        
        if (emailLog) {
          switch (event.event) {
            case 'delivered':
              emailLog.status = 'delivered';
              emailLog.deliveredAt = new Date(event.timestamp * 1000);
              break;
            case 'open':
              emailLog.status = 'opened';
              emailLog.openedAt = new Date(event.timestamp * 1000);
              emailLog.opens.push({
                timestamp: new Date(event.timestamp * 1000),
                userAgent: event.useragent,
                ip: event.ip
              });
              break;
            case 'click':
              emailLog.status = 'clicked';
              emailLog.clickedAt = new Date(event.timestamp * 1000);
              emailLog.clicks.push({
                timestamp: new Date(event.timestamp * 1000),
                url: event.url,
                userAgent: event.useragent,
                ip: event.ip
              });
              break;
            case 'bounce':
              emailLog.status = 'bounced';
              emailLog.bouncedAt = new Date(event.timestamp * 1000);
              emailLog.failureReason = event.reason;
              break;
          }
          
          await emailLog.save();
        }
      } catch (error) {
        console.error('Error processing webhook event:', error);
      }
    }
  }
}

module.exports = new EmailService();
