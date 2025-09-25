# Email Marketing Platform for ColorCompete

This email marketing platform allows administrators to send email blasts to members and set up automated emails for contest winners and rewards.

## Features

### 1. Email Campaigns
- Create and send email blast campaigns to all members
- Target specific user segments (subscription types, user groups)
- Rich HTML email templates with variable substitution
- Campaign analytics and performance tracking

### 2. Email Automations
- **Daily Winner Announcements**: Automatically notify all members about daily contest winners
- **Monthly Winner Announcements**: Send monthly champion notifications
- **Winner Rewards**: Automatically send gift cards to contest winners via Tremendous API

### 3. Analytics & Tracking
- Email delivery, open, and click rates
- Bounce rate monitoring
- Campaign performance comparison
- Performance insights and recommendations

## Setup Instructions

### 1. Environment Variables

Add the following to your API `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@colorcompete.com
FROM_NAME=ColorCompete

# Tremendous Gift Card API Configuration  
TREMENDOUS_API_KEY=your_tremendous_api_key_here
TREMENDOUS_FUNDING_SOURCE_ID=your_funding_source_id
TREMENDOUS_CAMPAIGN_ID=your_campaign_id
TREMENDOUS_MESSAGE_FIELD_ID=your_message_field_id
```

### 2. SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with full access
3. Add your domain and verify it
4. Set up event webhooks pointing to `/api/email/webhook/sendgrid`
5. Enable click and open tracking

### 3. Tremendous API Setup

1. Create an account at https://tremendous.com
2. Get your API key from the developer settings
3. Set up a funding source (bank account or card)
4. Create a campaign for gift cards
5. Configure custom fields for gift card messages

### 4. Database Migration

The following new models will be automatically created:
- `EmailCampaign` - Stores email campaigns
- `EmailAutomation` - Stores automation rules
- `EmailLog` - Tracks email deliveries and interactions

### 5. Admin Access

Only users with `isAdmin: true` in their user record can access the email marketing features.

## API Endpoints

### Campaigns
- `GET /api/email/campaigns` - List all campaigns
- `POST /api/email/campaigns` - Create new campaign
- `PUT /api/email/campaigns/:id` - Update campaign
- `DELETE /api/email/campaigns/:id` - Delete campaign
- `POST /api/email/campaigns/:id/send` - Send campaign

### Automations
- `GET /api/email/automations` - List all automations
- `POST /api/email/automations` - Create new automation
- `PUT /api/email/automations/:id` - Update automation
- `PATCH /api/email/automations/:id/toggle` - Toggle automation on/off
- `DELETE /api/email/automations/:id` - Delete automation
 - `POST /api/email/automations/:id/test-send-all` - Send a test email for a specific automation to all users (admin only)
 - `POST /api/email/automations/test-send-all` - Send test emails for all automations to all users (admin only)

### Analytics
- `GET /api/email/analytics` - Get overall email statistics
- `GET /api/email/campaigns/:id/analytics` - Get campaign-specific analytics

### Webhooks
- `POST /api/email/webhook/sendgrid` - SendGrid event webhook

## Email Templates

### Variable Substitution

Use double curly braces for template variables:

**Available Variables:**
- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{winner_name}}` - Contest winner's name
- `{{winner_username}}` - Contest winner's username
- `{{challenge_title}}` - Contest/challenge title
- `{{submission_image}}` - URL to winning submission image
- `{{date}}` - Current date or contest date
- `{{month}}` - Month name for monthly contests
- `{{reward_amount}}` - Gift card amount for rewards

### Example Templates

**Daily Winner Email:**
```html
<h1>🎨 Daily Contest Winner!</h1>
<p>Congratulations to <strong>{{winner_name}}</strong> for winning today's ColorCompete contest!</p>
<h2>{{challenge_title}}</h2>
<img src="{{submission_image}}" alt="Winning submission" style="max-width: 400px;" />
<p>Check out more amazing artwork on ColorCompete!</p>
```

**Winner Reward Email:**
```html
<h1>🎁 Congratulations {{winner_name}}!</h1>
<p>You've won the contest and earned a ${{reward_amount}} gift card!</p>
<h2>{{challenge_title}}</h2>
<img src="{{submission_image}}" alt="Your winning submission" style="max-width: 400px;" />
<p>Your gift card has been sent to your email. Check your inbox!</p>
```

## Automation Schedule

### Daily Winner Automation
- Runs daily at specified time (e.g., 9:00 AM)
- Finds yesterday's winning submission
- Sends announcement email to all members

### Monthly Winner Automation  
- Runs monthly on specified day (e.g., 1st of month)
- Finds last month's winning submission
- Sends champion announcement to all members

### Winner Reward Automation
- Triggered when a contest ends with a winner
- Sends gift card via Tremendous API
- Sends notification email to winner

## Usage

### Creating Email Campaigns

1. Go to Admin Dashboard → Email Marketing → Campaigns
2. Click "New Campaign"
3. Fill in campaign details:
   - Name and subject line
   - HTML content with variables
   - Target audience selection
4. Send immediately or save as draft

### Setting Up Automations

1. Go to Admin Dashboard → Email Marketing → Automations
2. Click "New Automation"
3. Select automation type:
   - Daily winner announcement
   - Monthly winner announcement  
   - Winner gift card reward
4. Configure schedule and email template
5. Toggle automation active

### Viewing Analytics

1. Go to Admin Dashboard → Email Marketing → Analytics
2. Select timeframe (7, 30, 90 days, or 1 year)
3. View overall performance metrics
4. See individual campaign performance
5. Review performance insights and recommendations

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check SendGrid API key and account status
   - Ensure `SENDGRID_API_KEY` is set in `api/.env`
   - Verify domain is verified in SendGrid and sender identity approved
   - For local testing without real sends, start the API with `DEV_BYPASS_ADMIN=true` to access admin endpoints, and consider using SendGrid sandbox mode or test endpoints above which do not mutate totals
2. **High bounce rate**: Clean email list and verify addresses  
3. **Low open rates**: Improve subject lines and send times
4. **Gift cards not sending**: Verify Tremendous API credentials and funding

### Monitoring

- Check email logs in the database for delivery status
- Monitor SendGrid dashboard for account health
- Review automation execution logs in server console
- Use analytics to track performance trends

## Security

- All email marketing endpoints require admin authentication
- For local testing only, you can set `DEV_BYPASS_ADMIN=true` in the environment to bypass admin checks. Do not use in production.
- API keys should be kept secure and rotated regularly
- Use HTTPS for all webhook endpoints
- Monitor for unusual activity in email sending patterns
