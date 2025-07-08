const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const EmailLog = require('../models/EmailLog');
const tremendousService = require('./tremendousService');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@colorcompete.com';
    this.fromName = process.env.FROM_NAME || 'ColorCompete';
  }

  // Send individual email
  async sendEmail({ to, subject, htmlContent, textContent, campaignId = null, automationId = null }) {
    try {
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
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key]);
    });
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
