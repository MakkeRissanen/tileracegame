# Quick Start Guide

## Your game is now running! 🎉

**Server**: http://localhost:3000
**Admin Panel**: http://localhost:3000/admin

## Immediate Next Steps

### 1. Set Up Firebase (Required for Full Functionality)

The game currently uses Firebase Realtime Database. To enable real-time sync:

1. Go to https://console.firebase.google.com
2. Create a new project or use existing one
3. Enable **Realtime Database** in the Firebase console
4. Copy your Firebase config
5. Create/update `.env.local` in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

6. Restart the dev server: `Ctrl+C` then `npm run dev`

### 2. Create Teams (Admin)

1. Visit http://localhost:3000/admin
2. Login with password: **admin123**
3. Click "Create Team" button
4. Enter team name (e.g., "Team Red")
5. **Important**: Click "Set Password" for each team
   - Teams won't appear in player selection until password is set!
6. Create multiple teams for competition

### 3. Play the Game (Players)

1. Visit http://localhost:3000
2. Select your team from dropdown
3. Enter team password
4. Start completing tiles!

## Testing Without Firebase

If you want to test locally without Firebase setup:

The app will still work, but won't sync between tabs/devices. Each browser tab will have its own game state.

## Common Issues

**Q: Teams don't show up in team selection**
A: Make sure admin has set a password for the team in admin panel

**Q: Tile completion doesn't work**
A: Check that you've selected the minimum required number of players

**Q: Firebase errors in console**
A: Either add Firebase credentials to `.env.local` or ignore if testing locally

## Game Features Overview

### For Admins
- Create/remove teams
- Set team passwords
- Edit tile labels
- View event log
- Reset game

### For Players
- Select team with password
- Complete tiles by selecting players
- View team progress
- See powerup inventory
- Track team standings

## File Structure

```
my-next-app/
├── app/
│   ├── admin/page.tsx       # Admin panel
│   └── page.tsx             # Main game
├── components/
│   ├── AdminPanel.tsx       # Admin interface
│   ├── TileRaceGame.tsx     # Game interface
│   └── ui.tsx               # Reusable components
├── lib/
│   ├── gameUtils.ts         # Game logic utilities
│   ├── gameEvents.ts        # Event handlers
│   └── firebase.ts          # Firebase config
├── types/
│   └── game.ts              # TypeScript definitions
└── hooks/
    └── useGameSync.ts       # Firebase sync hook
```

## What Changed from Original

✅ Converted from single HTML file to modular TypeScript
✅ Added type safety throughout
✅ Improved code organization
✅ Better error handling
✅ Optimistic UI updates
✅ Reusable components
✅ All original features preserved

## Development Commands

```bash
npm run dev   # Start development server
npm run build # Build for production
npm run lint  # Check code quality
```

## Need Help?

1. Check `GAME_README.md` for detailed documentation
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. View the original HTML file: `tile-race.html`

## Ready to Play!

Your tile-race game is now a modern, maintainable Next.js application. 
Have fun! 🏁🎮
