# Digital Achievement Badge System

This system implements the digital achievement badges displayed on the `/rewards` page of the ColorCompete application.

## Features

### 6 Digital Achievement Badges

1. **First Win** - Awarded for your first contest victory
2. **Hat Trick** - Win 3 contests in a row  
3. **People's Choice** - Receive the most community votes in a contest
4. **Consistency King** - Submit to 30 consecutive daily contests
5. **Master Artist** - Win 10 total contests
6. **Community Favorite** - Accumulate 1000 total votes

## API Endpoints

### Badge Management
- `GET /api/badges` - Get all available badges
- `POST /api/badges` - Create a new badge (admin)
- `GET /api/badges/:id` - Get badge by ID
- `PUT /api/badges/:id` - Update badge (admin)
- `DELETE /api/badges/:id` - Delete badge (admin)

### User Badge Management
- `GET /api/badges/user/:userId` - Get all badges earned by a user
- `POST /api/badges/user/:userId/check` - Manually trigger badge checking for a user
- `PUT /api/badges/user/:userId/badge/:badgeId/visibility` - Toggle badge visibility

### System Management
- `POST /api/badges/initialize` - Initialize default badges in database

## Automatic Badge Checking

Badges are automatically checked and awarded in the following scenarios:

1. **When a user submits to a contest** - Checks submission-based badges
2. **When a contest winner is announced** - Checks win-based badges for all participants
3. **Manual trigger** - Admin can manually trigger badge checking

## Database Models

### Badge Model
```javascript
{
  name: String,           // Badge name
  description: String,    // Badge description  
  icon: String,          // Lucide icon name
  iconColor: String,     // CSS color class
  type: String,          // 'win', 'participation', 'milestone', 'achievement'
  criteria: {
    type: String,        // 'wins', 'consecutive_wins', 'votes', 'submissions', 'consecutive_submissions'
    threshold: Number,   // Required amount
    timeframe: String    // 'all_time' or 'consecutive'
  },
  isActive: Boolean,     // Whether badge is active
  createdAt: Date
}
```

### UserBadge Model
```javascript
{
  userId: ObjectId,      // Reference to User
  badgeId: ObjectId,     // Reference to Badge
  earnedAt: Date,        // When badge was earned
  isVisible: Boolean,    // User can hide badges
  metadata: {
    contestId: ObjectId,    // Contest where earned (if applicable)
    submissionId: ObjectId, // Submission that triggered badge
    value: Number          // Actual value that triggered badge
  }
}
```

## Usage Examples

### Initialize Badge System
```bash
# Run initialization script
node src/scripts/testBadgeSystem.js

# Or via API
POST /api/badges/initialize
```

### Check Badges for All Users  
```bash
node src/scripts/checkAllUserBadges.js
```

### Get User Badges
```javascript
// GET /api/badges/user/507f1f77bcf86cd799439011
[
  {
    "id": "...",
    "name": "First Win",
    "description": "Awarded for your first contest victory",
    "icon": "Medal",
    "iconColor": "text-yellow-500",
    "type": "win",
    "earnedAt": "2023-07-06T12:00:00.000Z",
    "isVisible": true,
    "metadata": {
      "contestId": "...",
      "submissionId": "...",
      "value": 1
    }
  }
]
```

## Integration with Frontend

The UserProfile component automatically fetches and displays user badges from the API:

```typescript
// Fetches user badges on component mount
useEffect(() => {
  const fetchUserBadges = async () => {
    const res = await fetch(`${API_URL}/api/badges/user/${user._id}`);
    const badges = await res.json();
    setUserAchievements(badges);
  };
  fetchUserBadges();
}, [user]);
```

## Badge Criteria Logic

### Win-based Badges
- **First Win**: User has >= 1 total wins
- **Master Artist**: User has >= 10 total wins  
- **Hat Trick**: User has >= 3 consecutive wins

### Vote-based Badges
- **Community Favorite**: User has >= 1000 total votes across all submissions
- **People's Choice**: User won a contest by having the most votes

### Participation Badges
- **Consistency King**: User submitted to >= 30 consecutive daily contests

## Maintenance

### Adding New Badges
1. Add badge definition to `BadgeService.initializeDefaultBadges()`
2. Add criteria checking logic to `BadgeService.checkBadgeCriteria()`
3. Update frontend badge icons in UserProfile component if needed

### Monitoring
- Check server logs for badge award notifications
- Use `/api/badges/user/:userId/check` endpoint to manually verify badge logic
- Monitor database for UserBadge collection growth

## Testing

```bash
# Test the complete badge system
node src/scripts/testBadgeSystem.js

# Check badges for all existing users
node src/scripts/checkAllUserBadges.js
```
