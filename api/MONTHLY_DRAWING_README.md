# Monthly Drawing System

The Monthly Drawing System automatically conducts random prize drawings for ColorCompete subscribers on a monthly basis using the Tremendous API for gift card delivery. Each subscription tier has its own drawing with different prize amounts.

## Prize Structure

- **Lite Tier**: $25 gift card
- **Pro Tier**: $50 gift card  
- **Champ Tier**: $100 gift card

## Participant Selection

The system determines eligible participants using the **Subscription model** to ensure accurate tier information:

1. **Active Subscriptions**: Only users with active subscriptions for the current month/year are eligible
2. **Subscription Tiers**: The system queries the `Subscription` collection to find users with `lite`, `pro`, or `champ` tiers
3. **Valid Contact**: Participants must have valid email addresses
4. **Notification Preferences**: Only users who haven't opted out of reward notifications are included
5. **Remaining Submissions**: Only subscriptions with `remaining_submissions > 0` are considered active

### Subscription Model Structure
```javascript
{
  userId: String,           // Reference to User._id
  tier: String,            // 'free', 'lite', 'pro', 'champ'
  remaining_submissions: Number,  // Active if > 0
  month: Number,           // 1-12
  year: Number            // e.g., 2025
}
```

## Setup

### 1. Environment Variables

Add these environment variables to your `.env` file:

```env
# Tremendous API Configuration
TREMENDOUS_API_KEY=your_tremendous_api_key_here
TREMENDOUS_FUNDING_SOURCE_ID=your_funding_source_id
TREMENDOUS_CAMPAIGN_ID=your_campaign_id
TREMENDOUS_MESSAGE_FIELD_ID=your_message_field_id

# Email Configuration (already required for other features)
FROM_EMAIL=noreply@colorcompete.com
FROM_NAME=ColorCompete
FRONTEND_URL=https://colorcompete.com
```

### 2. Initialize Monthly Drawing Automations

Run the setup script to create the email automations:

```bash
cd api/src/scripts
node setupMonthlyDrawings.js
```

This will create:
- 3 winner notification automations (one per tier)
- Beautiful email templates with tier-specific designs

### 3. Configure Drawing Schedule

By default, drawings run on the 1st of each month at 10:00 AM EST. You can modify this by updating the automations in your database or through the admin interface.

## How It Works

### Automatic Monthly Drawings

1. **Scheduled Execution**: On the 1st of each month at 10:00 AM EST, the system automatically runs drawings for all three tiers.

2. **Participant Selection**: All active subscribers of each tier are automatically eligible. The system filters users by:
   - Active subscription (`subscription.type` matches the tier)
   - Valid email address
   - Reward notifications enabled (respects user preferences)

3. **Winner Selection**: One winner is randomly selected from each tier's eligible participants.

4. **Gift Card Delivery**: Winners receive gift cards via the Tremendous API automatically. Gift card amounts are tier-specific:
   - **Lite**: $25 gift card
   - **Pro**: $50 gift card  
   - **Champ**: $100 gift card

5. **Email Notifications**: 
   - Winners receive a congratulatory email with gift card details
   - Other participants receive a notification about the month's results

### Manual Triggering (Admin)

Admins can manually trigger drawings through the API:

```bash
POST /api/monthly-drawings/trigger
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tier": "lite"  // or "pro" or "champ"
}
```

## API Endpoints

### Get Monthly Drawing Results
```bash
GET /api/monthly-drawings?tier=lite&year=2025&month=1
```

### Get Specific Drawing Details
```bash
GET /api/monthly-drawings/:drawingId
```

### Get Drawing Statistics
```bash
GET /api/monthly-drawings/stats
```

### Trigger Manual Drawing (Admin Only)
```bash
POST /api/monthly-drawings/trigger
```

## Database Schema

### MonthlyDrawing Model

```javascript
{
  month: Number,           // 1-12
  year: Number,            // 2025, etc.
  subscriptionTier: String, // 'lite', 'pro', 'champ'
  prizeAmount: Number,     // 25, 50, 100
  winner: {
    userId: ObjectId,
    email: String,
    name: String
  },
  participants: [{
    userId: ObjectId,
    email: String,
    name: String,
    entryDate: Date
  }],
  drawingDate: Date,
  isCompleted: Boolean,
  giftCardDetails: {
    giftCardId: String,
    giftCardCode: String,
    redeemUrl: String,
    sentAt: Date
  },
  automationId: ObjectId
}
```

## Email Templates

The system uses customizable email templates with variables:

### Winner Email Variables
- `{{winner_name}}` - Winner's first name
- `{{tier_name}}` - Subscription tier (Lite, Pro, Champ)
- `{{prize_amount}}` - Prize amount (25, 50, 100)
- `{{gift_card_code}}` - Gift card redemption code
- `{{redeem_url}}` - Direct redemption URL
- `{{month_year}}` - Current month and year
- `{{dashboard_url}}` - Link to user dashboard
- `{{unsubscribe_url}}` - Unsubscribe link

### Participant Email Variables
- `{{participant_name}}` - Participant's first name
- `{{winner_name}}` - Winner's first name
- `{{total_participants}}` - Number of participants
- Plus other common variables

## Error Handling

The system includes comprehensive error handling:

- **Duplicate Prevention**: Ensures only one drawing per tier per month
- **API Failures**: Gracefully handles Giftup API failures
- **Email Failures**: Logs failed email sends for retry
- **Data Validation**: Validates all input data before processing

## Monitoring

Monitor the system through:

1. **Application Logs**: Check console output for drawing execution
2. **Database Records**: Query `MonthlyDrawing` collection for results
3. **Email Logs**: Check `EmailLog` collection for delivery status
4. **API Statistics**: Use the stats endpoint for overview

## Troubleshooting

### Common Issues

1. **No Participants Found**: Check subscription data and email preferences
2. **Gift Card API Failures**: Verify Tremendous API credentials and funding source balance
3. **Email Delivery Issues**: Check SendGrid configuration and email templates
4. **Scheduling Issues**: Verify cron job registration and timezone settings

### Manual Recovery

If a drawing fails, you can:

1. Check the `MonthlyDrawing` record for the failed drawing
2. Manually trigger the drawing again via API
3. Update the record manually if needed
4. Resend emails through the email service

## Security

- Admin authentication required for manual triggers
- User data properly sanitized in email templates
- Gift card codes securely transmitted via Tremendous API
- Audit trail maintained through database records

## Tremendous API Setup

To set up the Tremendous API integration:

1. **Create Tremendous Account**: Sign up at [tremendous.com](https://tremendous.com)
2. **Get API Key**: Generate an API key in your Tremendous dashboard
3. **Set Up Funding Source**: Add a funding source (bank account, credit card) in your dashboard
4. **Create Campaign**: Create a campaign for gift card delivery
5. **Configure Environment**: Add the required environment variables to your `.env` file

### Tremendous API Endpoints Used

- `POST /orders` - Create and send gift cards
- `GET /orders/{id}` - Get order details
- `GET /rewards/{id}` - Get reward details
- `GET /funding_sources` - Check account balance

### Gift Card Delivery Process

1. System creates order via Tremendous API
2. Tremendous sends gift card email directly to winner
3. Winner receives email with redemption instructions
4. System logs delivery status and details
5. Winner notification email sent via ColorCompete
