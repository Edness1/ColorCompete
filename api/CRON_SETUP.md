# Automated Email Statistics Sync Setup

## Overview
Since SendPulse SMTP doesn't provide webhooks, we need to periodically fetch email statistics from their API and sync them to our database.

## Setup Instructions

### 1. Set CRON_SECRET in .env
Add this to your `api/.env` file:
```env
CRON_SECRET=your-secure-random-string-here
```
Generate a secure secret: `openssl rand -hex 32`

### 2. Setup Cron Job

#### Option A: Using cron-job.org (Recommended for hosted apps)
1. Go to https://cron-job.org
2. Create a free account
3. Add a new cron job:
   - **Title**: Sync Email Statistics
   - **URL**: `https://api.colorcompete.com/api/email/cron/sync-stats?secret=YOUR_CRON_SECRET`
   - **Schedule**: Every 1 hour (or your preferred frequency)
   - **Request Method**: POST
   - **Headers**: Add `x-cron-secret: YOUR_CRON_SECRET`

#### Option B: Using Server Crontab (if you have server access)
1. SSH into your server
2. Edit crontab: `crontab -e`
3. Add this line to run every hour:
```bash
0 * * * * curl -X POST -H "x-cron-secret: YOUR_CRON_SECRET" https://api.colorcompete.com/api/email/cron/sync-stats
```

#### Option C: Using Vercel Cron (if deployed on Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/email/cron/sync-stats",
    "schedule": "0 * * * *"
  }]
}
```

### 3. Manual Sync
You can also trigger a manual sync from the Email Marketing admin panel by clicking the "Sync Stats" button.

## How It Works
1. The cron job calls `/api/email/cron/sync-stats` every hour
2. The endpoint fetches recent email statistics from SendPulse API
3. It matches emails by message ID and updates the EmailLog records
4. Updates statuses: sent → delivered → opened → clicked
5. Your analytics dashboard will show updated delivery rates, open rates, and click rates

## Testing
Test the endpoint manually:
```bash
curl -X POST \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  https://api.colorcompete.com/api/email/cron/sync-stats
```

Expected response:
```json
{
  "message": "Automated statistics sync completed",
  "timestamp": "2025-11-19T...",
  "synced": 50,
  "errors": 0,
  "total": 191
}
```
