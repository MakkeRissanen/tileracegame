# Tile Race Game

A real-time multiplayer tile racing game built with Next.js, Firebase, and TypeScript.

## Features

- **Real-time Multiplayer**: Multiple teams compete simultaneously with live updates via Firebase Realtime Database
- **56 Race Tiles**: Progress through tiles with different difficulty levels (Easy, Medium, Hard)
- **Powerup System**: Collect and use strategic powerups to help your team or hinder opponents
- **Admin Panel**: Comprehensive admin interface to manage teams, tiles, and game settings
- **Progressive Tile Reveal**: Tiles are revealed in chunks as teams progress
- **Player Points Tracking**: Individual player contributions are tracked and scored
- **Team Management**: Password-protected team access with inventory and progress tracking

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe code
- **Firebase** - Realtime Database for game state synchronization
- **Tailwind CSS 4** - Modern styling
- **React Hooks** - Custom hooks for game state management

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project set up

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Realtime Database
   - Copy your Firebase config to `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Admin Setup

1. Navigate to `/admin` to access the admin panel
2. Login with default password: `admin123`
3. Create teams and set passwords for each team
4. Edit tile labels and settings as needed

### Player Gameplay

1. Go to the main page (`/`)
2. Select your team and enter the team password
3. Complete tiles by:
   - Selecting player names who completed the task
   - Meeting the minimum player requirement
   - Clicking "Complete Tile"
4. Progress through tiles to reach the finish (Tile 56)

### Game Rules

- **Tile Progression**: Teams start at Tile 1 and progress towards Tile 56
- **Tile Reveal**: Tiles are revealed in chunks of 8 as teams progress
- **Difficulty Levels**:
  - Easy (E): 1 point per completion
  - Medium (M): 2 points per completion
  - Hard (H): 3 points per completion
- **Powerups**: Collect powerups from completing certain tiles
- **Winning**: First team to complete the final tile wins!

## Project Structure

```
├── app/
│   ├── admin/         # Admin panel route
│   ├── layout.tsx     # Root layout with providers
│   └── page.tsx       # Main game page
├── components/
│   ├── AdminPanel.tsx   # Admin interface
│   ├── TileRaceGame.tsx # Main game component
│   └── ui.tsx           # Reusable UI components
├── hooks/
│   └── useGameSync.ts   # Firebase sync hook
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── auth.ts          # Authentication utilities
│   ├── gameUtils.ts     # Pure game utility functions
│   └── gameEvents.ts    # Game event handlers
├── types/
│   └── game.ts          # TypeScript type definitions
└── contexts/
    └── AuthContext.tsx  # Authentication context
```

## Key Features Explained

### Real-time Synchronization

The game uses Firebase Realtime Database to sync game state across all clients. The `useGameSync` hook manages:
- Optimistic updates for instant UI feedback
- Conflict resolution
- Automatic state synchronization

### Event System

All game actions are handled through an event system:
- Events are pure functions that transform game state
- Events are persisted to Firebase for synchronization
- Easy to extend with new game mechanics

### Powerup Types

- **Skip Tiles**: Jump ahead 1-3 tiles
- **Set Back**: Move opponents backward
- **Copy-Paste**: Copy task requirements to future tiles
- **Change Tile**: Swap tile with task from difficulty pool
- **Clear Cooldown**: Remove powerup usage restrictions
- **Disable/Double Powerup**: Affect opponent/own powerup inventory
- **Double Tile**: Increase tile completion requirements

## Development

### Running Tests

```bash
npm run lint
```

### Building for Production

```bash
npm run build
npm start
```

## Configuration

### Game Settings

- `MAX_TILE = 56`: Total number of tiles in the race
- Chunk reveal size: 8 tiles
- Default admin password: `admin123` (stored in `initialGame()`)

### Customization

- Edit `POWERUP_DEFS` in `types/game.ts` to add/modify powerups
- Modify `defaultRaceTiles()` in `lib/gameUtils.ts` to change initial tile setup
- Adjust difficulty scoring in `gameEvents.ts` `COMPLETE_TILE` handler

## Troubleshooting

### Firebase Connection Issues
- Check your `.env.local` file has correct credentials
- Verify Firebase Realtime Database is enabled in Firebase Console
- Check Firebase Database Rules allow read/write access

### Teams Not Showing
- Admin must set a password for teams before they appear in team selection
- Check admin panel to verify teams are created

### Tile Not Completing
- Ensure minimum player count is met
- Check that tile is revealed (not grayed out)
- Verify team has correct permissions

## License

MIT

## Credits

Built with ❤️ using Next.js and Firebase
