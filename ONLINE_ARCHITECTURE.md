# Online Game Architecture

## Overview
This Tile Race game is designed as a **fully online multiplayer game** where all players connect to a shared Firebase Realtime Database. There is no local storage of game data.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Player 1      │     │   Player 2      │     │   Admin         │
│   Browser       │     │   Browser       │     │   Browser       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         │    WebSocket (Real-time Sync)                 │
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │
                         ┌───────▼────────┐
                         │   Firebase     │
                         │   Realtime DB  │
                         └────────────────┘
```

## Data Flow

### 1. Game State (Server-Side - Firebase)
**All persistent data lives in Firebase:**
- Game configuration
- All teams and their state (position, inventory, cooldowns)
- All race tiles and powerup tiles
- Game logs and event history
- Admin configuration

**Path Structure:**
```
games/
  main/
    version: 3
    raceTiles: [...]
    teams: [...]
    admins: [...]
    log: [...]
```

### 2. Session State (Client-Side - sessionStorage)
**Only stores minimal session data:**
```javascript
{
  teamId: "team-123",
  timestamp: 1703012400000
}
```

**Characteristics:**
- Automatically cleared when browser/tab closes
- Expires after 24 hours
- Not shared across tabs
- Contains no passwords or sensitive data
- Only used to remember which team the player logged in as

### 3. UI State (Client-Side - React)
**Temporary UI state in React components:**
- Which powerup modal is open
- Which player names are selected for tile completion
- Form input values (team name, password fields)
- Dark mode preference (if implemented)

**Note:** This state is lost on page refresh (except session restoration)

## User Flows

### Player Flow
1. Navigate to `https://yourgame.com/`
2. Enter team name and password
3. If correct, session saved to sessionStorage
4. Player can complete tiles, use powerups
5. All actions immediately synced to Firebase
6. All other players see updates in real-time
7. On page refresh: Session restored automatically
8. On browser close: Session cleared, must login again

### Admin Flow
1. Navigate to `https://yourgame.com/`
2. Click "Admin Login" and enter admin name and password
3. Admin credentials verified against Firebase database
4. Create teams and set passwords
5. Edit tiles and game configuration
6. Changes immediately visible to all players

## Real-Time Synchronization

### Firebase Realtime Database
- Uses WebSocket connection for instant updates
- All clients subscribed to `games/main` path
- When any player makes an action:
  1. Action sent to Firebase via transaction
  2. Firebase validates and updates state
  3. Firebase broadcasts update to all clients
  4. All players' UIs update automatically

### Conflict Resolution
- Firebase transactions prevent race conditions
- If two players act simultaneously:
  - One succeeds, database updated
  - Other retries automatically with new state
  - Both players see correct final state

## Deployment for Online Access

### Development (Local Testing)
```bash
npm run dev
# Access at: http://localhost:3000
```

### Production (Online Access)

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel login
vercel --prod
# Provides URL: https://yourapp.vercel.app
```

**Option 2: Firebase Hosting**
```bash
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
# Provides URL: https://yourproject.web.app
```

**Option 3: Netlify**
```bash
npm run build
# Upload .next folder to Netlify
# Or connect GitHub repo for auto-deployment
```

### Custom Domain Setup
After deployment, configure custom domain in hosting provider:
1. Add DNS records (A/CNAME)
2. SSL certificate auto-provisioned
3. Access game at `https://yourdomain.com`

## Multi-Device Access

### Same Team, Different Devices
Players can access same team from multiple devices by logging in with team credentials:
- **Scenario**: Player starts on laptop, continues on phone
- **Process**: Login with same team name/password on new device
- **Result**: Session restored, game state synced from Firebase

**Warning**: Simultaneous access from multiple devices to same team is possible but not recommended during active gameplay (may cause confusion).

### Different Teams, Same Device
Multiple players can use same device by logging out and logging in:
1. Player 1 logs in as Team A
2. Player 1 completes actions
3. Player 1 clicks "Logout"
4. Player 2 logs in as Team B
5. Each team's progress tracked independently

## Network Requirements

### Minimum Requirements
- Internet connection (WiFi or mobile data)
- Stable connection for WebSocket
- Modern browser with JavaScript enabled

### Offline Behavior
- Game requires internet connection to function
- If connection lost:
  - Firebase SDK attempts reconnection
  - Queued actions sent when connection restored
  - UI may show loading state
- No offline mode available

### Bandwidth Usage
- Initial load: ~1-2 MB (Next.js app)
- Real-time updates: Minimal (~1-10 KB per action)
- Suitable for mobile data usage

## Security for Online Deployment

### Data Protection
- All Firebase connections use SSL/TLS
- Environment variables keep server-side secrets
- Firebase Database Rules control access
- Input validation prevents injection attacks

### Recommended Firebase Rules for Production
```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

### Rate Limiting
Consider implementing rate limiting for production:
- Firebase Quotas (free tier: 100 concurrent connections)
- Cloudflare for DDoS protection
- Custom rate limiting in Firebase Functions

## Monitoring Online Game

### Firebase Console
Monitor real-time usage:
- Database size and operations
- Concurrent connections
- Bandwidth usage
- Error logs

### Application Monitoring
Recommended tools:
- **Vercel Analytics**: Page views, performance
- **Firebase Performance Monitoring**: Load times
- **Sentry**: Error tracking
- **Custom logging**: Game events and player actions

## Scaling Considerations

### Current Architecture Limits
- Firebase free tier: 100 simultaneous connections
- Database operations: 50,000 per day (free tier)
- Storage: 1 GB (free tier)

### Scaling Strategy
For larger player base:
1. **Upgrade Firebase plan** (Blaze/pay-as-you-go)
2. **Split game instances**: Multiple game IDs for different competitions
3. **Add caching**: Redis for frequently accessed data
4. **Optimize data structure**: Reduce redundancy

### Performance Optimization
- Minimize data payload sizes
- Use Firebase indexes for queries
- Implement connection pooling
- Consider CDN for static assets

## Troubleshooting Online Access

### Players Can't Connect
- Check Firebase credentials in .env.local
- Verify Firebase Database Rules allow access
- Check internet connection
- Verify Firebase project is active

### Data Not Syncing
- Open browser console (F12) for errors
- Check Firebase usage quotas
- Verify WebSocket not blocked by firewall
- Check Firebase Real-time Database status

### Session Not Persisting
- sessionStorage may be disabled in browser
- Private/Incognito mode clears session on close
- Check browser security settings

## Summary

✅ **Fully Online**: All game data in Firebase, accessible from any device  
✅ **Real-Time**: Instant synchronization across all players  
✅ **Session Management**: Login persists across page refreshes  
✅ **Multi-Device**: Access from different devices with same credentials  
✅ **No Local Dependencies**: Works consistently across all players  
✅ **Scalable**: Can handle multiple concurrent players  
✅ **Secure**: SSL/TLS encryption, input validation, Firebase rules  
