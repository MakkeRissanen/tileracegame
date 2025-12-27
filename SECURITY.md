# Security Guidelines

## Overview
This document outlines the security measures implemented in the Tile Race game and recommendations for production deployment.

## Data Storage Architecture (Online Game)

### Server-Side Storage (Firebase Realtime Database)
**All game state is stored in Firebase** - no local storage dependencies:
- ✅ Game state (tiles, teams, scores, powerups)
- ✅ Team configurations and passwords
- ✅ Game logs and history
- ✅ Real-time synchronization across all players

### Client-Side Storage (Browser)
**Minimal client-side storage for session management only:**
- ✅ **sessionStorage**: Team login session (cleared on browser/tab close)
  - Stores only team ID and login timestamp
  - Auto-expires after 24 hours
  - Not shared across browser tabs
  - Automatically cleared on logout
- ❌ **localStorage**: Not used (permanent storage avoided)
- ❌ **cookies**: Not used
- ❌ **IndexedDB**: Not used

### Why sessionStorage?
- **Online-first design**: All game data lives in Firebase
- **Session persistence**: Players stay logged in during page refreshes
- **Privacy**: Session data cleared when browser/tab closes
- **Security**: Only stores team ID (no passwords, no sensitive data)
- **Multi-device**: Users can play from different devices by logging in

## Current Security Measures

### 1. Input Validation
All user inputs are validated:
- **Team names**: Max 50 characters, alphanumeric with spaces/hyphens/underscores only
- **Passwords**: Min 4 characters, max 50 characters, trimmed of whitespace
- **Player names**: Validated before tile completion
- **Admin inputs**: All administrative actions validated

### 2. Firebase Security
- **Database Rules**: Must be configured in Firebase Console (see below)
- **Environment Variables**: Firebase credentials stored in `.env.local`
- **Connection Security**: All Firebase connections use SSL/TLS

### 3. Admin Authentication
- **Database-stored**: Admin accounts (name/password) stored in Firebase database
- **Multiple admins**: Supports multiple admin accounts with individual credentials
- **Master admin**: One admin can be designated as master with full privileges
- **Same as teams**: Uses the same authentication pattern as team login

### 4. Concurrency Control
- **Firebase Transactions**: Prevents race conditions and data corruption
- **Event Queue**: FIFO processing ensures atomic operations
- **Validation Layer**: Checks preconditions before state changes

## Important Security Considerations

### Configure Admin Accounts
**IMPORTANT**: Set up admin accounts in the game after initialization:

1. Start the game and click "Admin Options" → "Manage Admins"
2. Add admin accounts with secure passwords
3. Designate at least one as "Master Admin" for full privileges
4. Each admin can have their own credentials

### Firebase Database Rules
Apply these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**For Production**: Implement more restrictive rules:
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

### Environment Variables
Ensure `.env.local` contains:
- ✅ `NEXT_PUBLIC_FIREBASE_*` - Firebase config (client-side)
- ✅ `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` - Discord integration (optional)

**Never commit** `.env.local` to version control.

### Password Security Notes
- Team and admin passwords stored in plain text in Firebase (suitable for casual games)
- For production games with sensitive data, implement:
  - Password hashing (bcrypt/argon2)
  - Firebase Authentication for user management
  - Rate limiting on login attempts
  - Session management with timeouts

### API Keys
- Firebase API keys are safe to expose in client-side code
- Security is enforced through Firebase Database Rules
- Admin credentials stored in database, not environment variables

## Production Checklist

Before deploying to production:

- [ ] Set up admin accounts with strong, unique passwords
- [ ] Configure restrictive Firebase Database Rules
- [ ] Enable Firebase Authentication if handling sensitive data
- [ ] Set up monitoring/logging for suspicious activity
- [ ] Configure CORS policies appropriately
- [ ] Enable rate limiting if needed
- [ ] Review all environment variables
- [ ] Test security measures in staging environment
- [ ] Set up SSL/TLS for custom domains

## Online Deployment Considerations

### Hosting Recommendations
- **Vercel** (recommended): Automatic deployments, edge network, zero config
- **Netlify**: Similar features to Vercel
- **Firebase Hosting**: Integrates well with Firebase services
- **Custom VPS**: Requires manual SSL setup and deployment configuration

### Environment Variables in Production
When deploying online, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
# ... add all NEXT_PUBLIC_FIREBASE_* variables
```

**Netlify:**
Add in Site Settings → Environment Variables

**Firebase Hosting:**
Use Firebase Functions with environment config

### URL Access Patterns
For online multiplayer game:
- **Player URL**: `https://yourdomain.com/` (main game)
- **Admin URL**: `https://yourdomain.com/admin` (protected)
- **Each player accesses from their own device/browser**
- **All players see real-time updates via Firebase**

### Cross-Browser/Device Access
- Players can switch devices by logging in again
- No data stored locally except current session
- Game progress tracked per team, not per device
- Multiple players can log into same team from different devices (not recommended during gameplay)

### Network Requirements
- Stable internet connection required
- Firebase uses WebSocket for real-time updates
- Works on mobile data and WiFi
- Reconnection handled automatically by Firebase SDK

## Reporting Security Issues
If you discover a security vulnerability, please report it responsibly.
