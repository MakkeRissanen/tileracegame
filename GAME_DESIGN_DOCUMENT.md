# Tile Race Game - Game Design Document

**Version:** 3.0  
**Last Updated:** December 28, 2025  
**Platform:** Web Application (Next.js)  
**Genre:** Competitive Board Game / Race Game with RPG Elements

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Core Mechanics](#core-mechanics)
3. [Win Conditions](#win-conditions)
4. [Game Board](#game-board)
5. [Teams & Players](#teams--players)
6. [Tasks & Completions](#tasks--completions)
7. [Powerup System](#powerup-system)
8. [Powerup Tiles](#powerup-tiles)
9. [Task Pools](#task-pools)
10. [Fog of War](#fog-of-war)
11. [Proof Requirements](#proof-requirements)
12. [Points System](#points-system)
13. [Admin Controls](#admin-controls)
14. [Discord Integration](#discord-integration)
15. [Technical Features](#technical-features)

---

## Game Overview

### Concept
A competitive team-based race game where players complete real-world tasks (primarily OSRS-based challenges) to advance across a 56-tile board. Teams strategically use powerups to help themselves or hinder opponents while racing to reach the final tile first.

### Target Audience
- OSRS (Old School RuneScape) players
- Competitive gaming communities
- Teams looking for long-term collaborative challenges

### Core Experience
- **Competition:** Race against other teams to reach tile 56
- **Strategy:** Choose when to use powerups for maximum impact
- **Collaboration:** Team members work together to complete tasks
- **Proof-Based:** All progress requires photographic evidence

---

## Core Mechanics

### Game Flow
1. Teams are formed with a captain and members
2. All teams start on Tile 1
3. Teams complete tasks on their current tile to advance
4. Completing a tile moves the team forward by 1 tile
5. Teams can claim powerup tiles to gain powerup items
6. Powerups can be used strategically to affect the game state
7. First team to reach and complete Tile 56 wins

### Turn Structure
- **No Turn-Based System:** All teams can act simultaneously
- **Asynchronous Gameplay:** Teams work on their current tile at their own pace
- **Real-Time Updates:** Firebase syncs all changes instantly to all players

---

## Win Conditions

### Primary Win Condition
- **Race Victory:** First team to reach and complete Tile 56 (the Final Tile)

### Secondary Win Condition
- **Individual Rankings:** Top 10 players with the most points receive rewards
- Points are earned through:
  - Completing race tiles
  - Claiming powerup tiles
  - Team progression

---

## Game Board

### Board Structure
- **Total Tiles:** 56 tiles arranged in a serpentine pattern
- **Layout:** 
  - Rows alternate direction (snake pattern)
  - Row 1: 4 tiles (left to right)
  - Row 2: 1 tile (right edge)
  - Row 3: 4 tiles (right to left)
  - Row 4: 1 tile (left edge)
  - Pattern repeats

### Tile Types
1. **Standard Tiles:** Regular task tiles that must be completed
2. **Reward Tiles:** Grant a powerup when completed
3. **Modified Tiles:** Affected by powerups (copied, changed, doubled)
4. **Final Tile (56):** Always hard difficulty, cannot be modified

### Tile Difficulties
- **Easy (1):** Green color, 1 point per completion
- **Medium (2):** Yellow color, 2 points per completion
- **Hard (3):** Purple color, 3 points per completion

### Tile Properties
- **Label:** Task name/description
- **Difficulty:** 1-3 rating
- **Instructions:** Detailed task requirements
- **Image URL:** Visual reference for the task
- **Max Completions:** Maximum number of players who can complete
- **Min Completions:** Minimum number required to advance
- **Start Proof Needed:** Flag indicating if "before" proof is required
- **Reward Powerup:** Optional powerup granted on completion

### Tile States
- **Copied:** Task was copied from another tile (📋 badge)
- **Changed:** Task was swapped with a different task (🔄 badge)
- **Doubled:** Completion requirement doubled (2× badge)
- **Start Check:** Requires proof of starting state (START CHECK badge)

---

## Teams & Players

### Team Structure
- **Team Name:** Unique identifier
- **Team Color:** Visual distinction on the board
- **Captain:** Team leader (first member listed)
- **Members:** Array of player names
- **Position:** Current tile number (1-56)
- **Inventory:** Array of powerup IDs owned by the team
- **Password:** Authentication for team login
- **Discord Webhook Slot:** Channel assignment (1-5) for notifications

### Team Progression
- Teams advance by completing their current tile
- Progress **resets** if moved by a powerup (forward or backward)
- Pre-cleared tiles (from certain powerups) can be auto-skipped

### Player Tracking
- **Player Points:** Individual point totals tracked per player
- **Completion Attribution:** Tasks are assigned to specific players
- **Cross-Team Points:** Players can be on multiple teams and accumulate points

---

## Tasks & Completions

### Task Structure
- **Difficulty Level:** Easy (1), Medium (2), Hard (3)
- **Label:** Short task name
- **Instructions:** Detailed requirements
- **Image URL:** Visual reference
- **Max/Min Completions:** Player count requirements
- **Start Proof Needed:** Special proof requirement flag

### Completion Types

#### Item-Based Tasks
- Obtaining one of the listed items counts as one completion
- Example: "Dragon Warhammer OR 60k XP Chunk" - either option counts

#### XP-Based Tasks
- Each XP chunk (e.g., 60k XP) counts as one completion
- Multiple players can each earn their own chunk

#### Group Tasks
- Each participant in the group activity counts as one completion
- Example: 5-man raid = 5 completions possible

#### Set-Based Tasks
- Each unique piece of a set counts as one completion
- Example: Oathplate set - each piece can only be used once

#### Single-Task Tiles
- One completion required (unless doubled)
- Same player can provide multiple completions (unless it's a group tile)

### Completion Process
1. Team member(s) complete the task in-game
2. Post proof picture to Discord **BEFORE** clicking "Complete Tile"
3. Click "Complete Tile" on team card
4. Select which player(s) completed the task
5. Confirm completions (must meet min/max requirements)
6. Team advances to next tile
7. Points are awarded to selected players

### Doubled Tiles
- Completion requirements are doubled (e.g., 1 → 2, 2 → 4)
- If original tile was single completion, still uses difficulty-based points
- If original tile was multi-completion, uses points-per-completion from tile

---

## Powerup System

### Powerup Categories

#### Movement Powerups (Self)
- **Skip 1 Tile:** Move forward 1 tile instantly
- **Skip 2 Tiles:** Move forward 2 tiles instantly
- **Skip 3 Tiles:** Move forward 3 tiles instantly

#### Offensive Powerups (Target Enemy)
- **Back 1 Tile:** Move target team backward 1 tile
- **Back 2 Tiles:** Move target team backward 2 tiles
- **Back 3 Tiles:** Move target team backward 3 tiles
- **Disable Powerup:** Remove one powerup from target team's inventory

#### Tile Modification Powerups
- **Copy and Paste:** Copy current tile's task to another tile
- **Change Tile:** Replace a tile's task with unused task from pool
- **Double Easy:** Double completion requirement on an easy tile
- **Double Medium:** Double completion requirement on a medium tile
- **Double Hard:** Double completion requirement on a hard tile

#### Utility Powerups
- **Clear Cooldown:** Remove powerup cooldown restriction
- **Double Powerup:** Duplicate one of your stored powerups

### Powerup Restrictions

#### Copy and Paste Rules
- **Can Target:**
  - Clean tiles (no modifications)
  - Tiles of equal or lower difficulty than current
  - Can copy FROM doubled tiles (retaliate mechanic)
- **Cannot Target:**
  - Tiles with teams on them
  - Your current tile
  - Higher difficulty tiles
  - Reward powerup tiles
  - Changed tiles
  - Doubled tiles (as paste destination)
  - Tiles already copied from
  - Tiles that were paste destinations

#### Change Tile Rules
- **Can Target:**
  - Unmodified tiles only
- **Cannot Target:**
  - Final tile (56)
  - Tiles with teams on them
  - Already changed tiles
  - Copied tiles
  - Doubled tiles

#### Double Tile Rules
- **Can Target:**
  - Tiles matching the powerup difficulty
  - Copied tiles
  - Changed tiles
- **Cannot Target:**
  - Final tile (56)
  - Already doubled tiles
  - Tiles with teams on them

### Powerup Cooldown
- Using a powerup triggers a cooldown for that team
- Team cannot use another powerup until cooldown is cleared
- "Clear Cooldown" powerup removes this restriction
- Admin can toggle cooldown on/off for any team

### Powerup Usage Effects
- **Movement:** Resets tile completion progress
- **Tile Modification:** Locked after doubling (no further modifications)
- **Stacking:** Some combinations allowed (change + double), others not (copy + change)

---

## Powerup Tiles

### Powerup Tile Structure
- Separate from race tiles
- Displayed in dedicated "Powerup Tasks" section
- Each has:
  - Task label and instructions
  - Image reference
  - Points per completion
  - Max/Min completions
  - Claim type (see below)
  - Reward powerup ID

### Claim Types

#### Each Team Once
- Every team can claim once
- After claiming, that team cannot claim again
- Other teams can still claim

#### First Team Only
- Only the first team to claim gets the powerup
- All other teams are locked out
- Most competitive claim type

#### Unlimited
- Teams can claim multiple times
- No restrictions on repeat claims

### Claiming Process
1. Team meets min/max completion requirements
2. Select player(s) who completed the task
3. Post proof to Discord
4. Claim powerup tile
5. Powerup is added to team inventory
6. Points are awarded to players

---

## Task Pools

### Pool Structure
- **Three Difficulty Pools:** Easy, Medium, Hard
- **Pool Tasks:** Pre-loaded tasks available for assignment
- **Used Flag:** Marks tasks that have been placed on the board

### Pool Usage
- **Randomize Difficulties:** Assigns random difficulties to all tiles
- **Randomize Tiles:** Assigns tasks from pools to tiles
- **Change Tile Powerup:** Swaps tile task with unused pool task
- **Import Tasks:** Bulk load tasks into pools via CSV/TSV format

### Pool Management
- Tasks marked as "used" when placed on board
- Used tasks cannot be selected again (prevents duplicates)
- Admin can clear and reimport pools
- Minimum pool reserves ensure sufficient tasks remain

### Task Distribution
- **Gradient System:** 
  - Early game (first 30% tiles): Weighted toward Easy (65% easy, 30% medium, 5% hard)
  - Late game (last 30% tiles): Weighted toward Hard (5% easy, 35% medium, 60% hard)
  - Middle game: Smooth transition between early and late weights
- **Streak Prevention:** Maximum 3 consecutive tiles of same difficulty
- **Hard Tile Minimum:** Ensures adequate hard tiles (17+ total, including fixed tiles 5 and 56)
- **Hard Tile Distribution:** Smart placement to avoid large gaps (max 7 tiles between hard tiles)

---

## Fog of War

### Vision System
- **Dynamic Vision:** Range increases as teams progress
- **Vision Ranges:**
  - Normal: 5 tiles ahead
  - Halfway point: 4 tiles ahead
  - Last 15 tiles: 3 tiles ahead
  - Last 5 tiles: 2 tiles ahead
- **Revealed Tiles:** Shown to all teams at all times
- **Hidden Tiles:** Appear as fog until revealed

### Vision Calculation
- Based on furthest team's position
- Reveals tiles progressively as any team advances
- Once revealed, tiles stay revealed for all teams

### Fog of War Modes
- **Enabled (Normal):** Standard vision rules apply
- **Disabled for Admin:** Admin sees all tiles, players see normal fog
- **Disabled for All:** All tiles visible to everyone
- **Auto-Disable:** Triggers if errors occur during randomization

---

## Proof Requirements

### Mandatory Proof
Every completion requires photographic evidence posted to Discord.

### Proof Picture Requirements
1. **Date visible on screen** (via RuneLite plugin)
2. **Player name** receiving the completion/points
3. **Evidence of task completion** (item obtained, XP gained, etc.)

### Start Check Tiles
Special tiles marked with "START CHECK" badge require:
1. **Before Picture:** Collection log showing initial quantity (if item already owned)
2. **After Picture:** Collection log showing quantity increased
3. **Purpose:** Proves low-value items that don't show in chat were actually obtained

### Proof Validation
- Admins verify proofs posted to Discord
- No proof = No completion allowed
- Must post proof **BEFORE** clicking "Complete Tile" button

---

## Points System

### Point Sources

#### Race Tile Completions
- **Difficulty-Based (Single Completion Tiles):**
  - Easy: 1 point per player
  - Medium: 2 points per player
  - Hard: 3 points per player
- **Points-Per-Completion (Multi-Completion Tiles):**
  - Uses tile's specified points value
  - Can vary based on task difficulty
- **Doubled Tiles Exception:**
  - If originally single completion (1→2), uses difficulty-based points
  - If originally multi-completion, uses points-per-completion

#### Powerup Tile Completions
- Uses tile's specified points-per-completion value
- Awarded to each player who contributed
- Independent of race tile point system

### Point Tracking
- **Individual Totals:** Each player accumulates points across all teams
- **Leaderboard:** Top 10 players displayed
- **Decimal Display:** Points shown with 2 decimal places
- **Team Attribution:** Points tied to specific team when earned

---

## Admin Controls

### Game Setup
- **Form Teams:** Create/edit teams with names, captains, members, passwords
- **Import Tasks:** Bulk load tasks from CSV/TSV format
- **Import Powerups:** Bulk load powerup tiles from CSV/TSV format
- **Randomize Difficulties:** Assign difficulty levels to all tiles
- **Randomize Tiles:** Assign tasks from pools to tiles
- **Gradient Settings:** Configure early/late game difficulty weights

### Game Management
- **Edit Teams:** Modify team properties (position, inventory, members, etc.)
- **Edit Tiles:** Modify race tile properties
- **Edit Powerup Tiles:** Modify powerup tile properties
- **Edit Pool Tasks:** Modify tasks in difficulty pools
- **Toggle Cooldown:** Enable/disable powerup cooldown for teams
- **Move Teams:** Directly change team positions
- **Grant Powerups:** Add powerups to team inventories

### Game State
- **Undo System:** Revert to previous game states (10 states stored)
- **Undo to Point:** Jump back to specific history point (reverts multiple actions)
- **Reset Game:** Clear all progress and start fresh
- **Event Log:** View last 50 game events with timestamps
- **Fog of War Toggle:** Enable/disable for admin or all players

### Admin Authentication
- **Master Admin:** Full access, cannot be removed
- **Additional Admins:** Created by master admin
- **Admin Types:**
  - Master: Full control, manages other admins
  - Regular: Game management, cannot manage admins
- **Password Protection:** Each admin has individual password

### Team Impersonation
- Admins can perform actions on behalf of teams
- Actions logged with admin name for transparency
- Used for corrections or handling technical issues

---

## Discord Integration

### Webhook System
- **Main Channel:** Global game announcements
- **Team Channels:** 5 numbered webhook slots for team-specific notifications
- **Team Assignment:** Each team assigned to a webhook slot (1-5)

### Discord Notifications

#### Tile Completions
- Team name with color badge
- Players who completed (⭐ emoji)
- Points awarded per player
- Current position with task label
- START CHECK warning if applicable
- Admin attribution if admin-triggered

#### Powerup Claims
- Team name
- Powerup gained
- Task completed
- Players and points awarded
- Admin attribution if applicable

#### Powerup Usage
- Team name
- Powerup used
- Target details (if applicable)
- Tile changes (copy/paste, change, double)
- Movement details (from/to tiles with labels)
- Admin attribution if applicable

#### Team Management
- Team added/removed
- Team updated (with change details)
- Cooldown toggled

#### Game Events
- Game reset
- Undo actions (with affected teams)

### Message Formatting
- **Multi-line:** Admin name on first line, details below
- **Emojis:** Visual indicators (✅ 🎁 ⚡ 📍 ⭐)
- **Team Colors:** Visual team identification
- **Structured Fields:** Organized information display

---

## Technical Features

### Real-Time Synchronization
- **Firebase Realtime Database:** All game state synced instantly
- **Optimistic Updates:** Immediate UI feedback before server confirmation
- **Transaction-Based:** Prevents race conditions and conflicts
- **Event Queue:** Sequential processing of simultaneous actions

### Performance Optimizations
- **Memo-ized Components:** RaceBoard, TeamsSidebar prevent unnecessary re-renders
- **Component Comparison:** Efficient props checking for updates
- **Next.js Image:** Optimized image loading with lazy loading
- **Event Log Limit:** 50 entries maximum
- **History Limit:** 10 states maximum

### Data Management
- **Event History:** Undo/redo capability with state snapshots
- **Log Entries:** Timestamped with unique IDs
- **Validation:** Client-side and server-side event validation
- **Copy Tracking:** Prevents infinite copy loops
- **Used Task Tracking:** Prevents duplicate task assignments

### UI Features
- **Dark Mode:** Consistent dark theme throughout
- **Modular Components:** Separate Button, Card, Modal, styles
- **Responsive Layout:** Adapts to different screen sizes
- **Team Colors:** Dynamic color assignment from palette
- **Badge System:** Visual indicators for tile states
- **Progress Bars:** Visual team progression tracking

### Authentication
- **Team Login:** Password-based team access
- **Admin Login:** Separate admin authentication
- **Session Persistence:** Browser storage maintains login
- **Master Admin:** Special API route for secure master admin verification

### Admin Tools
- **Undo History Modal:** Browse and restore previous states
- **Event Log Modal:** Review recent game actions
- **Task Import:** CSV/TSV bulk import with validation
- **Powerup Import:** CSV/TSV bulk import with validation
- **Team Management:** Comprehensive team editing interface
- **Gradient Settings:** Interactive difficulty weight adjustment

---

## Game Balance Considerations

### Difficulty Progression
- Early game favors easy tasks to build momentum
- Late game increases difficulty to maintain challenge
- Gradient system ensures smooth difficulty curve
- Prevents extreme difficulty spikes

### Powerup Balance
- Movement powerups (skip/back) directly impact race position
- Tile modification powerups have strategic long-term value
- Cooldown system prevents powerup spam
- Limited powerup availability creates scarcity

### Strategic Depth
- **When to use powerups:** Save for critical moments vs use early
- **Target selection:** Which team to hinder
- **Tile modification:** Help yourself vs hurt opponents
- **Risk/reward:** Speed vs safety

### Comeback Mechanics
- Back powerups allow trailing teams to slow leaders
- Copy-paste can simplify future path
- Doubling can create roadblocks for leaders
- Individual points system rewards active players even if team loses

---

## Future Expansion Ideas

### Potential Features
- **Team Chat:** In-game communication
- **Achievement System:** Badges for milestones
- **Replay System:** Review past games
- **Statistics Dashboard:** Track performance over time
- **Seasonal Leaderboards:** Recurring competitions
- **Custom Game Modes:** Different rule variants
- **Spectator Mode:** Watch without participating
- **Mobile App:** Native mobile experience

### Content Expansion
- **More Powerups:** Additional strategic options
- **Special Tiles:** Bonus tiles with unique effects
- **Dynamic Events:** Random events during gameplay
- **Quest Lines:** Connected tasks with story elements
- **Custom Themes:** Different visual styles

---

## Conclusion

This tile race game combines competitive racing with strategic powerup usage and proof-based progression. The real-world task completion requirement (primarily OSRS challenges) creates engagement beyond the digital interface, while the powerup system adds depth and strategic decision-making. The dual win conditions (race winner + top individual points) ensure multiple paths to success and maintain engagement throughout the competition.

The technical implementation leverages modern web technologies (Next.js, Firebase, TypeScript) to provide a smooth, real-time multiplayer experience with comprehensive admin controls for game management.
