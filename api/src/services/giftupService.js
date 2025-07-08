const axios = require('axios');

class TremendousService {
  constructor() {
    this.apiKey = process.env.TREMENDOUS_API_KEY;
    this.baseURL = 'https://testflight.tremendous.com/api/v2'; // Use production URL: https://www.tremendous.com/api/v2
    this.fundingSourceId = process.env.TREMENDOUS_FUNDING_SOURCE_ID;
    this.campaignId = process.env.TREMENDOUS_CAMPAIGN_ID;
  }

  // Send a gift card via Tremendous API
  async sendGiftCard({ recipientEmail, recipientName, amount, message, customMessage = null }) {
    try {
      if (!this.apiKey) {
        throw new Error('TREMENDOUS_API_KEY not configured');
      }

      if (!this.fundingSourceId) {
        throw new Error('TREMENDOUS_FUNDING_SOURCE_ID not configured');
      }

      const giftCardData = {
        external_id: `colorcompete_monthly_${Date.now()}`,
        payment: {
          funding_source_id: this.fundingSourceId
        },
        reward: {
          value: {
            denomination: amount,
            currency_code: 'USD'
          },
          campaign_id: this.campaignId,
          delivery: {
            method: 'EMAIL',
            recipient: {
              email: recipientEmail,
              name: recipientName
            }
          },
          custom_fields: [
            {
              id: process.env.TREMENDOUS_MESSAGE_FIELD_ID,
              value: customMessage || message || `Congratulations! You've won $${amount} in the ColorCompete monthly drawing!`
            }
          ]
        }
      };

      const response = await axios.post(
        `${this.baseURL}/orders`,
        giftCardData,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Gift card sent successfully via Tremendous: $${amount} to ${recipientEmail}`);
      
      return { 
        success: true, 
        orderId: response.data.order.id,
        giftCardId: response.data.order.reward.id,
        giftCardCode: response.data.order.reward.credential_identifier || response.data.order.reward.id,
        redeemUrl: response.data.order.reward.redemption_url || response.data.order.reward.redemption_link,
        details: response.data.order
      };
    } catch (error) {
      console.error('Error sending gift card via Tremendous:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data?.errors || error.response?.data?.message || error.message 
      };
    }
  }

  // Get order details
  async getOrder(orderId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return { success: true, order: response.data.order };
    } catch (error) {
      console.error('Error fetching order:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Get reward details
  async getReward(rewardId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/rewards/${rewardId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return { success: true, reward: response.data.reward };
    } catch (error) {
      console.error('Error fetching reward:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // Get account balance (optional - to check if enough funds)
  async getAccountBalance() {
    try {
      const response = await axios.get(
        `${this.baseURL}/funding_sources`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const fundingSources = response.data.funding_sources;
      const currentSource = fundingSources.find(fs => fs.id === this.fundingSourceId);
      
      return { 
        success: true, 
        balance: currentSource ? currentSource.available_balance : null,
        fundingSources: fundingSources
      };
    } catch (error) {
      console.error('Error fetching account balance:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }

  // List available products/campaigns
  async getProducts() {
    try {
      const response = await axios.get(
        `${this.baseURL}/campaigns`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return { success: true, campaigns: response.data.campaigns };
    } catch (error) {
      console.error('Error fetching campaigns:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
}

module.exports = new TremendousService();
