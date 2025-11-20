const axios = require('axios');
const EmailLog = require('../models/EmailLog');
const tremendousService = require('./tremendousService');

// SendPulse API endpoints
const SENDPULSE_TOKEN_URL = process.env.SENDPULSE_TOKEN_URL || 'https://api.sendpulse.com/oauth/access_token';
const SENDPULSE_SEND_URL = process.env.SENDPULSE_SEND_URL || 'https://api.sendpulse.com/smtp/emails';

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@colorcompete.com';
    this.fromName = process.env.FROM_NAME || 'ColorCompete';
    this._spToken = null;
    this._spTokenExpiresAt = 0;
  }

  // Acquire and cache SendPulse OAuth token
  async getSendPulseToken() {
    const now = Date.now();
    if (this._spToken && now < this._spTokenExpiresAt - 30000) { // 30s early refresh margin
      return this._spToken;
    }
    const client_id = process.env.SENDPULSE_CLIENT_ID;
    const client_secret = process.env.SENDPULSE_CLIENT_SECRET;
    if (!client_id || !client_secret) {
      throw new Error('Email service is not configured (SendPulse credentials missing)');
    }
    const { data } = await axios.post(SENDPULSE_TOKEN_URL, {
      grant_type: 'client_credentials',
      client_id,
      client_secret
    });
    if (!data || !data.access_token) {
      throw new Error('Failed to obtain SendPulse access token');
    }
    this._spToken = data.access_token;
    const expiresInMs = (data.expires_in || 3600) * 1000;
    this._spTokenExpiresAt = now + expiresInMs;
    return this._spToken;
  }

  // Fetch email statistics from SendPulse API
  async fetchEmailStatistics(messageIds) {
    try {
      const token = await this.getSendPulseToken();
      const SMTP_STATS_URL = 'https://api.sendpulse.com/smtp/emails';
      
      // SendPulse returns stats for emails sent via SMTP
      const response = await axios.get(SMTP_STATS_URL, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          limit: 1000,
          offset: 0
        }
      });
      
      console.log('SendPulse API Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error fetching SendPulse statistics:', error.response?.data || error.message);
      return null;
    }
  }

  // Sync email statistics from SendPulse to EmailLog
  async syncStatisticsFromSendPulse() {
    try {
      console.log('Starting SendPulse statistics sync...');
      const stats = await this.fetchEmailStatistics();
      
      if (!stats) {
        console.log('No statistics data returned from SendPulse');
        return { synced: 0, errors: 0, total: 0, note: 'No data from SendPulse API' };
      }
      
      // Handle different possible response structures
      let emailList = Array.isArray(stats) ? stats : stats.data || stats.emails || [];
      
      if (!Array.isArray(emailList) || emailList.length === 0) {
        console.log('SendPulse returned no email list. Response structure:', Object.keys(stats));
        // Mark all 'sent' emails as 'delivered' since SendPulse tracking is enabled
        const sentEmails = await EmailLog.find({ status: 'sent' }).limit(100);
        let synced = 0;
        for (const emailLog of sentEmails) {
          emailLog.status = 'delivered';
          emailLog.deliveredAt = emailLog.sentAt;
          await emailLog.save();
          synced++;
        }
        return { 
          synced, 
          errors: 0, 
          total: sentEmails.length,
          note: 'SendPulse API structure unclear, marked sent emails as delivered'
        };
      }
      
      console.log(`Processing ${emailList.length} emails from SendPulse...`);
      let synced = 0;
      let errors = 0;
      let notFound = 0;
      
      for (const emailStat of emailList) {
        try {
          // Try multiple ID fields that SendPulse might use
          const messageId = emailStat.id || emailStat.smtp_id || emailStat.email_id || emailStat.message_id;
          
          if (!messageId) {
            console.log('Email stat without ID:', Object.keys(emailStat));
            continue;
          }
          
          // Find the email log by SendPulse message ID
          const emailLog = await EmailLog.findOne({ 
            sendGridMessageId: messageId
          });
          
          if (!emailLog) {
            notFound++;
            continue;
          }
          
          // Update status based on SendPulse data
          let updated = false;
          const currentStatus = emailStat.status || emailStat.email_status;
          
          // Check for delivery
          if ((currentStatus === 'sent' || currentStatus === 'delivered') && emailLog.status === 'sent') {
            emailLog.status = 'delivered';
            emailLog.deliveredAt = new Date(emailStat.sent_date || emailStat.send_date || emailStat.created_at || emailLog.sentAt);
            updated = true;
          }
          
          // Check for opens - multiple possible structures
          const openData = emailStat.tracking?.opened || emailStat.open_count || emailStat.opened;
          if (openData && emailLog.status !== 'clicked') {
            emailLog.status = 'opened';
            emailLog.openedAt = new Date(emailStat.tracking?.opened_date || emailStat.open_date || Date.now());
            updated = true;
          }
          
          // Check for clicks
          const clickData = emailStat.tracking?.clicked || emailStat.click_count || emailStat.clicked;
          if (clickData) {
            emailLog.status = 'clicked';
            emailLog.clickedAt = new Date(emailStat.tracking?.clicked_date || emailStat.click_date || Date.now());
            updated = true;
          }
          
          // Check for bounces/errors
          if (currentStatus === 'error' || currentStatus === 'bounced' || currentStatus === 'failed') {
            emailLog.status = 'bounced';
            emailLog.bouncedAt = new Date();
            emailLog.failureReason = emailStat.error_message || emailStat.error || 'Bounced';
            updated = true;
          }
          
          if (updated) {
            await emailLog.save();
            synced++;
          }
        } catch (err) {
          console.error('Error syncing individual email log:', err);
          errors++;
        }
      }
      
      console.log(`Sync complete: ${synced} synced, ${errors} errors, ${notFound} not found in DB`);
      return { synced, errors, notFound, total: emailList.length };
    } catch (error) {
      console.error('Error syncing statistics:', error);
      return { synced: 0, errors: 1, error: error.message };
    }
  }

  // Send individual email
  async sendEmail({ to, subject, htmlContent, textContent, campaignId = null, automationId = null }) {
    try {
      const token = await this.getSendPulseToken();
      const rawHtmlFull = htmlContent || '';
      // Extract body content if present; some providers prefer body-inner HTML only
      let rawHtml = rawHtmlFull;
      try {
        const m = rawHtmlFull.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (m && m[1]) rawHtml = m[1];
      } catch(_) {}
      const emailObj = {
        subject,
        from: { email: this.fromEmail, name: this.fromName },
        to: [{ email: to.email }],
        html: Buffer.from(rawHtml, 'utf8').toString('base64')
      };
      if (textContent) {
        emailObj.text = textContent;
      } else {
        // Provide a simple text fallback derived from HTML
        emailObj.text = this.htmlToText(rawHtml);
      }

      // Debug: log sizes to help diagnose empty emails
      try {
        console.log('[emailService] sending email', {
          to: to.email,
          subject,
          htmlLength: rawHtml.length,
          textLength: (emailObj.text || '').length
        });
      } catch(_) {}
      const payload = { email: emailObj };

      const response = await axios.post(SENDPULSE_SEND_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // SendPulse may return different ID fields
      const providerMessageId = response?.data?.id || 
                                response?.data?.email_id || 
                                response?.data?.smtp_id ||
                                response?.data?.message_id ||
                                null;
      
      // Log the actual response structure for debugging
      if (!providerMessageId) {
        console.log('SendPulse response without message ID:', JSON.stringify(response?.data));
      }

      // Log the email only if we have a userId (skip for contact form submissions)
      if (to.userId) {
        const emailLog = new EmailLog({
          recipient: to.userId,
          recipientEmail: to.email,
          campaignId,
          automationId,
          subject,
          status: 'sent',
          sendGridMessageId: providerMessageId
        });
        
        await emailLog.save();
        console.log(`Email logged with ID: ${providerMessageId || 'NONE'} to ${to.email}`);
      }

      return { success: true, messageId: providerMessageId };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log the failure only if we have a userId (skip for contact form submissions)
      if (to.userId) {
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
      }
      
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

    // Helper: resolve a key from variables with simple snake/camel normalization and synonym groups
    const resolveKey = (key) => {
      const snake = toSnake(key);
      // Try direct, snake, camel
      if (variables[key] !== undefined) return variables[key];
      const camel = toCamel(key);
      if (variables[snake] !== undefined) return variables[snake];
      if (variables[camel] !== undefined) return variables[camel];
      // Try group synonyms
      for (const group of KEY_GROUPS) {
        const g = group.map(toSnake);
        if (g.includes(snake)) {
          for (const alias of group) {
            const aSnake = toSnake(alias);
            const aCamel = toCamel(alias);
            if (variables[alias] !== undefined) return variables[alias];
            if (variables[aSnake] !== undefined) return variables[aSnake];
            if (variables[aCamel] !== undefined) return variables[aCamel];
          }
        }
      }
      return undefined;
    };

    // First handle array/boolean sections: {{#name}}...{{/name}} and inverted {{^name}}...{{/name}}
    const sectionRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
    const invertedRegex = /{{\^(\w+)}}([\s\S]*?){{\/\1}}/g;

    // Expand positive sections
    result = result.replace(sectionRegex, (match, key, content) => {
      const val = resolveKey(key);
      if (Array.isArray(val)) {
        return val.map((item) => {
          // Render content against each item (shallow replace of {{prop}})
          let itemContent = content;
          Object.entries(item || {}).forEach(([k, v]) => {
            const r = new RegExp(`{{\\s*${esc(k)}\\s*}}`, 'g');
            itemContent = itemContent.replace(r, String(v ?? ''));
          });
          return itemContent;
        }).join('');
      }
      if (val) {
        // truthy: keep content with variable replacements from outer variables
        let inner = content;
        Object.entries(variables).forEach(([k, v]) => {
          const r = new RegExp(`{{\\s*${esc(k)}\\s*}}`, 'gi');
          inner = inner.replace(r, String(v ?? ''));
        });
        return inner;
      }
      return '';
    });

    // Expand inverted sections
    result = result.replace(invertedRegex, (match, key, content) => {
      const val = resolveKey(key);
      const isEmpty = val === undefined || val === null || val === false || (Array.isArray(val) && val.length === 0);
      return isEmpty ? content : '';
    });

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
    // Backward compat: if SendGrid events are still posted here, try to process them
    for (const event of events) {
      try {
        const emailLog = await EmailLog.findOne({ 
          sendGridMessageId: event.sg_message_id || event.smtp_id || event.id || event.transmission_id || null
        });
        if (!emailLog) continue;
        switch (event.event) {
          case 'delivered':
            emailLog.status = 'delivered';
            emailLog.deliveredAt = new Date((event.timestamp || Date.now()/1000) * 1000);
            break;
          case 'open':
            emailLog.status = 'opened';
            emailLog.openedAt = new Date((event.timestamp || Date.now()/1000) * 1000);
            emailLog.opens.push({
              timestamp: new Date((event.timestamp || Date.now()/1000) * 1000),
              userAgent: event.useragent || event.user_agent,
              ip: event.ip
            });
            break;
          case 'click':
            emailLog.status = 'clicked';
            emailLog.clickedAt = new Date((event.timestamp || Date.now()/1000) * 1000);
            emailLog.clicks.push({
              timestamp: new Date((event.timestamp || Date.now()/1000) * 1000),
              url: event.url,
              userAgent: event.useragent || event.user_agent,
              ip: event.ip
            });
            break;
          case 'bounce':
          case 'hard_bounce':
          case 'soft_bounce':
            emailLog.status = 'bounced';
            emailLog.bouncedAt = new Date((event.timestamp || Date.now()/1000) * 1000);
            emailLog.failureReason = event.reason || event.error;
            break;
          default:
            break;
        }
        await emailLog.save();
      } catch (error) {
        console.error('Error processing webhook event:', error);
      }
    }
  }

  // Handle SendPulse webhook payloads (array or single object)
  async handleSendPulseWebhook(payload) {
    const events = Array.isArray(payload) ? payload : [payload];
    for (const event of events) {
      try {
        // SendPulse may provide id/smtp_id/transmission_id depending on event type
        const idCandidate = event?.id || event?.smtp_id || event?.transmission_id || null;
        if (!idCandidate) continue;
        const emailLog = await EmailLog.findOne({ sendGridMessageId: idCandidate });
        if (!emailLog) continue;
        const type = (event.event || event.type || '').toLowerCase();
        const ts = event.timestamp ? new Date(event.timestamp * 1000) : new Date();
        if (type.includes('deliver')) {
          emailLog.status = 'delivered';
          emailLog.deliveredAt = ts;
        } else if (type.includes('open')) {
          emailLog.status = 'opened';
          emailLog.openedAt = ts;
          emailLog.opens.push({ timestamp: ts, userAgent: event.user_agent || event.useragent, ip: event.ip });
        } else if (type.includes('click')) {
          emailLog.status = 'clicked';
          emailLog.clickedAt = ts;
          emailLog.clicks.push({ timestamp: ts, url: event.url, userAgent: event.user_agent || event.useragent, ip: event.ip });
        } else if (type.includes('bounce')) {
          emailLog.status = 'bounced';
          emailLog.bouncedAt = ts;
          emailLog.failureReason = event.error || event.reason;
        }
        await emailLog.save();
      } catch (err) {
        console.error('SendPulse webhook processing error:', err);
      }
    }
  }
}

module.exports = new EmailService();
