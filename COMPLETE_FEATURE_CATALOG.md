# Complete Feature Catalog - Tile Race Game

## Table of Contents
1. [Game Actions & Mechanics](#1-game-actionsmechanics)
2. [Modals & Views](#2-modalsviews)
3. [Button Interactions](#3-button-interactions)
4. [Powerup Mechanics](#4-powerup-mechanics)
5. [Admin Features](#5-admin-features)
6. [Special Tile Mechanics](#6-special-tile-mechanics)
7. [UI Toggles & Filters](#7-ui-toggles--filters)
8. [Team Management](#8-team-management)
9. [Player Points System](#9-player-points-system)
10. [Authentication System](#10-authentication-system)
11. [Firebase Real-time Sync](#11-firebase-real-time-sync)
12. [Additional Interactive Features](#12-additional-interactive-features)

---

## 1. Game Actions/Mechanics

### 1.1 Complete Tile
- **What it does**: Advances a team's position on the board by 1 tile
- **How triggered**: "Complete tile" button in team card
- **UI Elements**: Player selection modal (multi-select or single based on maxCompletions)
- **State Changes**:
  - Team position increments
  - Clears powerup cooldown
  - Awards points to selected players
  - Grants tile reward (if any)
  - Updates revealed tiles (fog of war)
  - Adds entry to event log
- **Special Rules**:
  - Requires min player selections (minCompletions)
  - Completing tile 55 reveals final tile
  - Skips pre-cleared tiles automatically
  - Points awarded based on difficulty (1/2/3) or 1 for multi-completion tiles
  - Doubled tiles require 2x completions

### 1.2 Use Copy-Choice
- **What it does**: Allows immediate completion of a tile that was copied earlier
- **How triggered**: "Use copy-choice" button (appears when team is on a copy-choice tile)
- **UI Elements**: Button in team card (conditional)
- **State Changes**:
  - Removes copy-choice stamp from tile
  - Advances team position by 1
  - Grants tile reward
  - Clears powerup cooldown
  - Adds log entry

### 1.3 Claim Powerup Tile
- **What it does**: Completes a powerup board task and adds powerup to team inventory
- **How triggered**: "Claim powerup" button → select powerup → player selection
- **UI Elements**: 
  - Claim powerup modal (table view)
  - Player selection modal
  - Confirmation modal
- **State Changes**:
  - Adds powerup to team inventory
  - Marks powerup as claimed (based on claimType)
  - Awards points to players
  - Adds log entry
- **Claim Types**:
  - **eachTeam**: Each team can claim once
  - **firstTeam**: Only one team globally can claim
  - **unlimited**: No restrictions

### 1.4 Use Powerup
- **What it does**: Consumes a powerup and applies its effect
- **How triggered**: "Use powerup" button → select powerup → configure → confirm
- **UI Elements**: Use powerup modal with powerup-specific inputs
- **State Changes**: Varies by powerup type (see section 4)
- **Restrictions**: Cannot use while on cooldown (except clearCooldown)

---

## 2. Modals/Views

### 2.1 Main Tile Details Modal
- **Opens when**: Clicking any revealed tile on main board
- **Content**:
  - Tile number, label, difficulty
  - Reward powerup (if any)
  - Image (if set)
  - Instructions
  - Max/min completions (for admins)
- **Admin Features**:
  - Edit tile label
  - Change difficulty (1-3)
  - Set reward powerup
  - Add image URL
  - Edit instructions
  - Set max/min completions

### 2.2 Powerup Tile Details Modal
- **Opens when**: Clicking powerup tile on powerup board
- **Content**:
  - Task label
  - Reward powerup
  - Instructions
  - Image
  - Points per completion
  - Max completions
  - Min completions
  - Claim type
- **Admin Features**:
  - Edit all fields
  - Change claim type

### 2.3 Player Selection Modal (Complete Tile)
- **Opens when**: Clicking "Complete tile" button
- **Content**:
  - Tile being completed
  - Team members list
  - Selection method:
    - **Single select** (maxCompletions = 1): Radio buttons
    - **Multi-select** (maxCompletions > 1): Increment/decrement buttons per player
- **Validation**: Enforces min/max completions
- **Confirm button**: Shows count of selections

### 2.4 Player Selection Modal (Powerup Claim)
- **Opens when**: Selecting powerup in claim modal
- **Content**: Similar to complete tile modal but for powerup tasks
- **Shows**: Task name, instructions, image, claim type

### 2.5 Claim Powerup Modal
- **Opens when**: Clicking "Claim powerup" button
- **Content**: Table of all powerup tiles showing:
  - Image
  - Task name (clickable to open details)
  - Reward
  - Claim type
  - Status (Available/Claimed/Unavailable)
  - Select button
- **Filter**: Shows which team claimed what (colored dots)

### 2.6 Use Powerup Modal
- **Opens when**: Clicking "Use powerup" button
- **Content**:
  - Powerup selector dropdown (with counts)
  - Conditional inputs based on powerup type:
    - Target team dropdown (for back/disable powerups)
    - Tile selector grid (for copypaste/changeTile/double powerups)
    - Task replacement dropdown (for changeTile)
    - Powerup selector (for disablePowerup/doublePowerup)
- **Dynamic UI**: Shows only relevant inputs per powerup

### 2.7 Edit Team Modal (Admin)
- **Opens when**: Admin clicks "Edit" on team card
- **Content**:
  - Current tile input
  - Captain input
  - Members textarea (one per line)
  - Player points editor (per player)
  - Stored powerups textarea (IDs, one per line)
- **Saves**: Updates all team state

### 2.8 Create Powerup Modal (Admin)
- **Opens when**: Admin clicks "Create a powerup"
- **Content**:
  - Task label (required)
  - Reward powerup dropdown (required)
  - Image URL
  - Points per completion
  - Max completions
  - Min completions
  - Claim type selector
  - Instructions textarea

### 2.9 Import Tasks Modal (Admin)
- **Opens when**: Admin → Options → Import tasks
- **Content**:
  - Format instructions (CSV/TSV)
  - Large textarea for paste
  - Format: Label, Difficulty, MaxComp, MinComp, Instructions, ImageURL
- **Action**: Parses and adds tasks to task pools

### 2.10 Import Powerups Modal (Admin)
- **Opens when**: Admin → Options → Import powerups
- **Content**: Similar to import tasks but for powerup tiles
- **Format**: RewardID, Label, Points, MaxComp, MinComp, ClaimType, Instructions, ImageURL

### 2.11 Draft/Form Teams Modal (Admin)
- **Opens when**: Admin → Options → Form teams
- **Phases**:
  1. **Setup**: Enter players (one per line), teams, assign captains
  2. **Picking**: Draft style - teams alternate picking players
  3. **Stealing**: Each team can steal one non-captain from another team
  4. **Summary**: Review and apply to game
- **Apply button**: Creates/updates teams in game state

### 2.12 Login Modal
- **Opens when**: Clicking "Login" button
- **Modes**:
  - Team login: Select team + password
  - Admin login: Select admin + password
  - Toggle between modes
- **Shows**: Password requirement status

### 2.13 Team Password Setup Modal (Admin)
- **Opens when**: Admin → Options → Set Team Passwords
- **Content**: List of teams with password inputs
- **Actions**: Set/change password for each team

### 2.14 Admin Management Modal (Master Admin Only)
- **Opens when**: Admin → Options → Manage Admins
- **Content**:
  - Create new admin form (name + password)
  - List of existing admins
  - Change password button (for own account)
  - Delete button (for non-master admins)

### 2.15 Change Password Modal (Admin)
- **Opens when**: Admin → Options → Change Password
- **Content**:
  - Current password input
  - New password input
  - Confirm password input

### 2.16 Gradient Settings Modal (Admin)
- **Opens when**: Admin → Options → Gradient settings
- **Content**:
  - Toggle for gradient mode
  - Early tiles weights (Easy/Medium/Hard)
  - Late tiles weights (Easy/Medium/Hard)
  - OR Global weights (if gradient disabled)

---

## 3. Button Interactions

### 3.1 Team Card Buttons

#### Complete Tile Button
- **Who sees it**: Team members (when logged in as that team) or admin
- **Effect**: Opens player selection modal
- **Disabled when**: n/a (always available)

#### Claim Powerup Button
- **Who sees it**: Team members or admin
- **Effect**: Opens claim powerup modal
- **Disabled when**: No powerup tiles exist

#### Use Powerup Button
- **Who sees it**: Team members or admin
- **Effect**: Opens use powerup modal
- **Disabled when**: Team has no powerups OR team is on cooldown

#### Cooldown Clear Button
- **Who sees it**: Appears IN cooldown indicator when team has clearCooldown powerup
- **Effect**: Immediately uses clearCooldown powerup and removes cooldown
- **Shows**: Inside red cooldown box

#### Use Copy-Choice Button
- **Who sees it**: When team is standing on a tile with copy-choice stamp
- **Effect**: Completes current tile immediately (no player selection needed)

#### Edit Team Button (Admin)
- **Who sees it**: Admin only
- **Effect**: Opens edit team modal

#### Remove Team Button (Admin)
- **Who sees it**: Admin only
- **Effect**: Deletes team from game (with confirmation)

### 3.2 Header Buttons

#### Toggle Player Points Button (📊)
- **Effect**: Shows/hides player points sidebar
- **Icon**: 📊

#### Theme Toggle Button (☀️/🌙)
- **Effect**: Toggles dark/light mode (persisted)
- **Icon**: Changes based on current theme

#### Login/Logout Button
- **Login**: Opens login modal
- **Logout**: Logs out current user/admin

#### Options Menu Button (Admin)
- **Opens dropdown with**:
  - Form teams
  - Import tasks
  - Import powerups
  - Gradient settings
  - Randomize difficulties
  - Randomize tiles
  - Disable Fog of War (master admin)
  - Download Game Backup (master admin)
  - Restore Game Backup (master admin)
  - Manage Admins (master admin)
  - Change Password
  - Set Team Passwords
  - Undo (if history available)
  - Reset all

### 3.3 Board Buttons

#### Main Race Tile Button
- **Effect**: Opens main tile details modal
- **Disabled when**: Tile not revealed (fog of war) AND not master admin
- **Shows**: 
  - Tile number (top-left)
  - Image (if set)
  - Label
  - Difficulty badge (top-right)
  - PWR badge (if has reward)
  - Team markers (bottom-left)
  - Status badges (bottom-right): pre-cleared, copy-choice, changed, doubled

#### Powerup Tile Button
- **Effect**: Opens powerup tile details modal
- **Shows**:
  - Image (if set)
  - Label
  - PWR badge
  - Reward powerup
  - Points per completion
  - Max completions
  - Claim type
  - Instructions preview
  - Team claim indicators (colored dots)

### 3.4 Admin Panel Buttons

#### Add Team Button
- **Input**: Team name field
- **Effect**: Creates new team with default state

#### Add Task to Pool Button (per difficulty)
- **Input**: Task label field per difficulty
- **Effect**: Adds task to that difficulty's pool

#### Edit Pool Task Button
- **Effect**: Expands inline editor for that task
- **Fields**: Label, instructions, image

#### Remove Pool Task Button
- **Effect**: Deletes task from pool

#### Create Powerup Button
- **Effect**: Opens create powerup modal

#### Clear Powerup Board Button
- **Effect**: Removes all powerup tiles and resets claims (with confirmation)

#### Clear Task Pools Button
- **Effect**: Removes all tasks from all pools (with confirmation)

#### Randomize Difficulties Button
- **Effect**: Reassigns difficulties to tiles based on gradient/global weights
- **Rules**:
  - First 5 tiles: E, E, M, M, H
  - Final tile: Always H
  - Max 2 same difficulty in a row
  - Minimum 17 hard tiles
  - No hard in first 10 tiles in a row

#### Randomize Tiles Button
- **Effect**: Assigns tasks from pools to tiles (respects difficulty)
- **Algorithm**: Serpentine assignment with shuffle
- **Marks**: Tasks as used after assignment

#### Rebuild Used Markers Button
- **Effect**: Scans board and rebuilds usedPoolTaskIds array

---

## 4. Powerup Mechanics

### 4.1 Movement Powerups

#### skip1, skip2, skip3
- **Effect**: Move forward 1/2/3 tiles
- **Target**: Self
- **Input**: None
- **Restrictions**: 
  - Cannot skip to or past final tile (must complete normally)
  - Skips pre-cleared tiles
  - Sets cooldown

#### back1, back2, back3
- **Effect**: Move target team backward 1/2/3 tiles
- **Target**: Other team
- **Input**: Team selector dropdown
- **Restrictions**: 
  - Cannot target self
  - Sets cooldown on user AND target

### 4.2 Tile Modification Powerups

#### copypaste (Ctrl + C, Ctrl + V)
- **Effect**: Copies current tile to a future tile
- **Target**: Future tile
- **Input**: Tile selector grid
- **Restrictions**:
  - Cannot copy to current tile
  - Cannot copy to tiles with reward powerups
  - Cannot copy to tiles with teams on them
  - Can only overwrite equal or lower difficulty tiles
  - Creates "copy-choice" stamp on target tile
- **Result**: Target tile inherits label, instructions, image, maxCompletions, difficulty

#### changeTile
- **Effect**: Replaces a tile's task with an unused task from the pool
- **Target**: Any tile (except final)
- **Input**: 
  - Tile selector grid
  - Task dropdown (filtered to same difficulty, unused only)
- **Restrictions**:
  - Each tile can only be changed once
  - Cannot change final tile
  - Cannot change tiles with teams on them
  - Marks both old and new tasks as used
- **Result**: Tile gets new label, instructions, image (keeps reward)

#### doubleEasy, doubleMedium, doubleHard
- **Effect**: Doubles the max and min completions for a tile
- **Target**: Tile matching powerup difficulty
- **Input**: Tile selector grid
- **Restrictions**:
  - Must target correct difficulty tile
  - Cannot double final tile
  - Cannot double already-doubled tiles
  - Cannot double tiles with teams on them
- **Result**: 
  - maxCompletions and minCompletions doubled
  - Tile marked as doubled
  - If original maxCompletions was 1, keeps difficulty-based points
  - Otherwise uses 1 point per completion

### 4.3 Utility Powerups

#### clearCooldown
- **Effect**: Removes powerup cooldown
- **Target**: Self
- **Input**: None
- **Special**: Can be used WHILE on cooldown
- **Result**: Team can use another powerup immediately

### 4.4 Offensive Powerups

#### disablePowerup
- **Effect**: Removes a powerup from target team's inventory
- **Target**: Other team + their powerup
- **Input**: 
  - Team selector
  - Powerup selector (shows target's inventory)
- **Restrictions**: Cannot target self

#### doublePowerup
- **Effect**: Duplicates a powerup in own inventory
- **Target**: Self (own powerup)
- **Input**: Powerup selector (own inventory, excluding the doublePowerup itself)
- **Result**: Adds second copy of chosen powerup

---

## 5. Admin Features

### 5.1 Team Management

#### Create Team
- **Input**: Team name
- **Creates**: Team with default values (pos 1, no members, no password)
- **Auto-assigns**: Unique color

#### Edit Team
- **Can modify**:
  - Current position
  - Captain name
  - Members list
  - Player points (per player)
  - Stored powerups
- **Does NOT modify**: Team name, color, creation date

#### Remove Team
- **Effect**: Completely deletes team from game
- **Requires**: Confirmation

#### Set Team Password
- **Access**: Via password setup modal
- **Effect**: Teams cannot login without correct password
- **Can be**: Left blank for no password

### 5.2 Tile Management

#### Edit Main Tile
- **Can modify**:
  - Label
  - Difficulty (1-3, but final tile forced to 3)
  - Reward powerup
  - Image URL
  - Instructions
  - Max completions
  - Min completions

#### Edit Powerup Tile
- **Can modify**:
  - Label
  - Reward powerup
  - Image URL
  - Instructions
  - Points per completion
  - Max completions
  - Min completions
  - Claim type

#### Create Powerup Tile
- **All fields**: Same as edit, but starts empty

#### Delete Powerup Tile
- **Effect**: Removes from powerup board
- **Note**: Use "Clear Powerup Board" to delete all

### 5.3 Task Pool Management

#### Add Task to Pool
- **Input**: Label, difficulty level
- **Creates**: New task in that difficulty's pool
- **Initially**: Only has label (instructions/image added via edit)

#### Edit Pool Task
- **Can modify**:
  - Label
  - Instructions
  - Image URL

#### Remove Pool Task
- **Effect**: Deletes task from pool
- **Also**: Removes from usedPoolTaskIds

#### Clear All Pools
- **Effect**: Removes all tasks from all difficulties
- **Clears**: usedPoolTaskIds array

### 5.4 Import/Export

#### Import Tasks
- **Format**: CSV or TSV
- **Columns**: Label, Difficulty, MaxCompletions, MinCompletions, Instructions, ImageURL
- **Effect**: Adds tasks to pools (doesn't assign to board)
- **Auto-detects**: Comma or tab separation

#### Import Powerups
- **Format**: CSV or TSV
- **Columns**: RewardPowerupId, Label, PointsPerCompletion, MaxCompletions, MinCompletions, ClaimType, Instructions, ImageURL
- **Effect**: Creates powerup tiles

#### Download Backup (Master Admin)
- **Format**: JSON file
- **Contains**: Complete game state (tiles, teams, pools, points, log)
- **Filename**: `tile-race-backup-{timestamp}.json`
- **Rate limit**: 10 per day

#### Restore Backup (Master Admin)
- **Input**: JSON file upload
- **Effect**: Completely replaces current game state
- **Warning**: Multiple confirmations required

### 5.5 Board Randomization

#### Randomize Difficulties
- **Uses**: Gradient weights or global weights
- **Rules**:
  - First 5 tiles: E, E, M, M, H
  - Final tile: Always H
  - Max 2 same difficulty in a row
  - First 10 tiles: No 2 hards in a row
  - Minimum 17 hard tiles enforced
  - Checks pool sizes to avoid assignment issues
- **Clears**: usedPoolTaskIds (since tiles will be reassigned)

#### Randomize Tiles
- **Effect**: Assigns tasks from pools to tiles
- **Algorithm**: 
  - Shuffles tiles and pools
  - Assigns tasks matching difficulty
  - Marks assigned tasks as used
- **Warning**: Shows alert if not enough tasks in pool

### 5.6 Fog of War Control (Master Admin Only)

#### Disable Fog of War Toggle
- **Effect**: Master admin can see all tiles regardless of reveal status
- **Purpose**: Testing/debugging
- **Does NOT**: Affect other players' view

### 5.7 Admin Management (Master Admin Only)

#### Create Admin
- **Input**: Name, password
- **Creates**: New admin account (non-master)

#### Change Admin Password
- **For self**: Via "Change Password" option
- **For others**: Via admin management modal (master only)

#### Delete Admin
- **Restriction**: Cannot delete master admin
- **Effect**: Removes admin account

### 5.8 Undo System

#### Undo Last Action
- **Stores**: Last 50 game states
- **Access**: Options → Undo
- **Disabled**: When no history available
- **Note**: In Firebase mode, only affects local view

### 5.9 Reset Game

#### Reset All
- **Effect**: 
  - Deletes all teams, tiles, events
  - Clears Firebase data (if enabled)
  - Resets to initial game state
- **Requires**: Double confirmation
- **Auto-reloads**: Page after reset

---

## 6. Special Tile Mechanics

### 6.1 Pre-Cleared Tiles
- **Created by**: markFuture powerup (not in current POWERUP_DEFS but referenced in code)
- **Effect**: When team reaches this tile, automatically skips to next
- **Visual**: "pre-cleared" badge on tile
- **Who sees badge**: Everyone (shows team color dot)

### 6.2 Copy-Choice Tiles
- **Created by**: copypaste powerup
- **Effect**: 
  - Tile inherits task from source tile
  - Team can use "Use copy-choice" button when on this tile
  - Counts as tile completion (awards reward)
- **Visual**: "copy-choice" badge with team color dot
- **Stamp data**: Stores tile number and source tile number

### 6.3 Changed Tiles
- **Created by**: changeTile powerup
- **Effect**: Task replaced with different one from same difficulty pool
- **Visual**: "changed" badge
- **Restriction**: Can only be changed once per tile

### 6.4 Doubled Tiles
- **Created by**: doubleEasy/Medium/Hard powerups
- **Effect**: 
  - maxCompletions and minCompletions doubled
  - Points calculation changes:
    - If original maxCompletions was 1: use difficulty-based points
    - Otherwise: use 1 point per completion
- **Visual**: "doubled" badge in orange
- **Restriction**: Cannot be doubled again

### 6.5 Final Tile (Tile 56)
- **Properties**:
  - Always difficulty 3 (hard)
  - Cannot be changed
  - Cannot be doubled
  - Cannot be skipped to/past with powerups
  - Must be completed normally
- **Special behavior**:
  - Only revealed when tile 55 is completed
  - Completing it shows winner popup
  - Adds special "WINNERS" log entry

### 6.6 Fog of War / Revealed Tiles
- **Initially revealed**: Tiles 1-8
- **Reveal mechanism**: Completing a tile reveals next 8 tiles
- **Chunks**: 8-tile chunks (tiles 1-8, 9-16, 17-24, etc.)
- **Final tile**: Revealed only when tile 55 completed
- **Visual**: Hidden tiles show large "?" and cannot be clicked (except by master admin)
- **Stored in**: revealedTiles array

---

## 7. UI Toggles & Filters

### 7.1 Theme Toggle
- **Options**: Light mode, Dark mode
- **Persistence**: Saved to localStorage
- **Affects**: Entire app styling
- **Button**: ☀️/🌙 icon in header

### 7.2 Player Points Sidebar Toggle
- **Button**: 📊 icon in header
- **Effect**: Shows/hides player points sidebar
- **Sidebar content**:
  - All players sorted by points (high to low)
  - Player name
  - Point total
  - Team affiliations

### 7.3 Options Menu (Admin)
- **Trigger**: Click "Options" button
- **Behavior**: Dropdown menu
- **Auto-close**: Clicks outside menu
- **Contains**: All admin action buttons

### 7.4 Admin Mode Toggle
- **Access**: Login as admin
- **Effects when active**:
  - Shows admin UI elements
  - Enables editing
  - Shows Options menu
  - Can bypass authentication checks

---

## 8. Team Management

### 8.1 Team Creation
- **Who can**: Admin only
- **Process**:
  1. Enter team name
  2. Click "Add Team"
  3. Team created with defaults:
     - Position 1
     - Empty inventory
     - No members/captain
     - No password
     - Unique color from palette
- **Auto-assigned color**: Cycles through 10 colors

### 8.2 Team Properties

#### Basic Properties
- **id**: Unique identifier (generated)
- **name**: Display name
- **color**: CSS class for visual identification
- **pos**: Current tile position (1-56)
- **createdAt**: Timestamp

#### Member Management
- **members**: Array of player names
- **captain**: Captain name (displayed with special badge)
- **password**: Login password (set by admin)

#### Game State
- **inventory**: Array of powerup IDs
- **preCleared**: Array of pre-cleared tile numbers
- **copyChoice**: Array of {tile, fromTile} objects
- **claimedRaceTileRewards**: Array of tile numbers (reward already claimed)
- **claimedPowerupTiles**: Array of powerup tile IDs
- **powerupCooldown**: Boolean (true = cannot use powerups)

#### Player Points (Team-specific, legacy)
- **playerPoints**: Object mapping player name → points
- **Note**: Global playerPoints object is the main source of truth

### 8.3 Team Editing (Admin)
- **Access**: Edit button on team card
- **Can modify**:
  - Current position (1-56)
  - Inventory (list of powerup IDs)
  - Members list
  - Captain
  - Player points per player
- **Cannot modify**: Name, color, creation date, claimed rewards

### 8.4 Team Authentication
- **Password required**: If team password is set
- **Login process**:
  1. Select team from dropdown
  2. Enter password
  3. If correct, grants team access
- **Permissions when logged in as team**:
  - Complete tile
  - Claim powerups
  - Use powerups
  - Use copy-choice
- **Logout**: Clears team authentication

### 8.5 Team Display

#### Team Card Content
- Team name
- Color indicator bar
- Current tile # badge (top-right)
- Captain and members badges
- Current tile label
- Progress bar (% to finish)
- Action buttons (if authenticated)
- Powerups stored count
- Cooldown indicator (if active)

#### Team Markers on Board
- **Position**: Bottom-left of tile
- **Appearance**: Colored pill with team name
- **Stacking**: 
  - 1-2 teams: Vertical stack, normal size
  - 3 teams: Pyramid layout (1 on top, 2 below), smaller size
- **Responsive**: Font size and spacing scale with team count

---

## 9. Player Points System

### 9.1 Point Awards

#### Main Tile Completion
- **Difficulty-based points**:
  - Easy (1): 1 point
  - Medium (2): 2 points
  - Hard (3): 3 points
- **Multi-completion tiles**: 1 point per completion (unless doubled from maxCompletions=1)
- **Doubled tiles**: 
  - If original maxCompletions was 1: use difficulty points
  - Otherwise: 1 point per completion
- **Awarded to**: Selected players in completion modal
- **Multiple players**: Each gets points independently

#### Powerup Tile Completion
- **Points**: Set per powerup tile (pointsPerCompletion field)
- **Default**: 1 point
- **Awarded to**: Selected players in claim modal

### 9.2 Point Storage
- **Primary**: game.playerPoints object (global)
- **Format**: `{ "PlayerName": totalPoints }`
- **Legacy**: team.playerPoints (per-team tracking, less used)

### 9.3 Point Display

#### Player Points Sidebar
- **Toggle**: 📊 button in header
- **Sort**: Descending by points (highest first)
- **Shows per player**:
  - Player name
  - Total points (rounded to 2 decimals)
  - Team affiliations (comma-separated)
- **Source**: Combines data from:
  - game.playerPoints (points)
  - team.members + team.captain (team affiliations)

#### Admin Edit
- **Access**: Edit team modal
- **Shows**: All team members with point input fields
- **Can modify**: Point totals per player

### 9.4 Points in Event Log
- **Format**: "+X pts each, Y total"
- **Example**: "Alice, Bob completed Tile 10 (+2 pts each, 4 total)"

---

## 10. Authentication System

### 10.1 User Roles

#### Team Member
- **Login**: Team name + password
- **Permissions**:
  - Complete tiles for their team
  - Claim powerups for their team
  - Use powerups for their team
  - View all visible content
- **Restrictions**: Cannot edit game state, cannot see other team passwords

#### Admin
- **Login**: Admin name + password
- **Permissions**: All team permissions PLUS:
  - Create/edit/delete teams
  - Edit all tiles
  - Manage task pools
  - Import data
  - Randomize board
  - Set team passwords
  - Access all modals
- **Cannot**: View other admin passwords (except via admin management)

#### Master Admin
- **Special admin**: id = "master"
- **Default password**: "admin123"
- **Additional permissions**:
  - Create/delete other admins
  - Change other admin passwords
  - Disable fog of war
  - Download/restore backups
  - Manage admins
- **Cannot be deleted**

### 10.2 Authentication State
- **Stored in**: localStorage as 'tileRaceAuth'
- **Fields**:
  - **loggedInAs**: Team ID (or null)
  - **isAdmin**: Boolean
  - **adminId**: Admin ID (or null)
  - **adminName**: Admin name (or null)

### 10.3 Login Flow

#### Team Login
1. Click "Login" button
2. Select "Login as Team" mode (default)
3. Choose team from dropdown
4. Enter password
5. Click "Login"
6. Validates password against team.password
7. If correct, sets auth state and closes modal

#### Admin Login
1. Click "Login" button
2. Click "or login as admin"
3. Select admin from dropdown
4. Enter password
5. Click "Login"
6. Validates password against admin.password
7. If correct, sets auth state and closes modal

### 10.4 Password Management

#### Team Passwords
- **Set by**: Admin via password setup modal
- **Can be**: Blank (no password required)
- **Validation**: String comparison (team.password === input)
- **Change**: Admin can change anytime

#### Admin Passwords
- **Set by**: Master admin (for others) or self (change password)
- **Required**: Cannot be blank
- **Master admin password**: Can be changed by master admin
- **Change**: Requires current password verification

### 10.5 Authorization Checks
- **checkTeamAuth(teamId)**: Returns true if admin OR logged in as that team
- **checkAdminAuth()**: Returns true if admin
- **checkMasterAdmin()**: Returns true if admin AND id === "master"

---

## 11. Firebase Real-time Sync

### 11.1 Firebase Configuration
- **Mode detection**: Checks if apiKey !== "YOUR_API_KEY"
- **Fallback**: localStorage if Firebase not configured or fails
- **Banner**: Shows connection status (green = online, orange = offline)

### 11.2 Event Sourcing Architecture

#### Event Queue
- **Location**: Firebase path: `/events`
- **Structure**: Push-based (auto-generated keys)
- **Event format**:
  ```javascript
  {
    event: { type: "...", ...data },
    timestamp: Date.now()
  }
  ```

#### Game State Snapshots
- **Location**: Firebase path: `/gameState`
- **Purpose**: Faster initial load (don't replay all events)
- **Updated**: On every change
- **Contains**: Full game state + `_snapshotTimestamp`

### 11.3 Real-time Sync Flow

#### Initial Load
1. Load gameState snapshot
2. Load all events
3. Find last processed event ID from snapshot timestamp
4. Apply game state to UI
5. Start listening for new events

#### Live Updates
1. User dispatches action
2. Push event to `/events`
3. Optimistically apply locally
4. Firebase listener triggers for all clients
5. All clients apply event to their state
6. Update snapshot periodically

### 11.4 Conflict Resolution
- **Event order**: Guaranteed by Firebase (FIFO)
- **Consistency**: All clients replay same events in same order
- **No merge conflicts**: Event sourcing ensures deterministic results

### 11.5 Undo in Firebase Mode
- **Local only**: Changes local view only
- **Not synced**: Other users keep their state
- **Warning**: Shows alert explaining limitation

---

## 12. Additional Interactive Features

### 12.1 Responsive Layout
- **Breakpoints**:
  - Mobile: 2-column board
  - Tablet: 3-column board
  - Desktop: 4-column board
- **Layout**: Serpentine (S-pattern) with turn tiles
- **Final tile**: Full-width (col-span-4)

### 12.2 Draft System (Testing Feature)
- **Access**: Admin → Options → Form teams
- **Purpose**: Team formation with draft-style picking
- **Phases**:
  1. Setup: Define players and teams, assign captains
  2. Picking: Teams alternate picking from available players
  3. Stealing: Each team can steal one player (not captain)
  4. Summary: Review and apply
- **Rules**:
  - Captains automatically added to teams
  - Cannot steal captains
  - Cannot steal back from team that just stole from you
  - Can skip steal

### 12.3 Event Log
- **Location**: Bottom-right panel
- **Content**: Chronological list of all game actions
- **Format**: Timestamp + message
- **Features**:
  - Team names highlighted with team colors
  - Auto-scrolling
  - Max 200 entries (FIFO)
  - Color-coded entries by team

### 12.4 Image Handling
- **Image fields**: Main tiles, powerup tiles, pool tasks
- **Fallback**: Placeholder SVG with "No image" text
- **Error handling**: imageOnError function replaces broken images
- **Preview**: Shows image in edit modals

### 12.5 Keyboard Shortcuts
- **Enter key**: Triggers primary action in modals
  - Add team name
  - Add pool task
  - Login modal
  - Pool task editor

### 12.6 Visual Indicators

#### Tile Badges
- **Difficulty badge**: E/M/H on top-left of tile
- **PWR badge**: "PWR" on top-right if tile has reward
- **Status badges**: Bottom-right corner
  - Pre-cleared (with team dot)
  - Copy-choice (with team dot)
  - Changed (gray dot)
  - Doubled (orange dot)

#### Team Indicators
- **Progress bar**: Shows % completion (0-100%)
- **Current tile #**: Badge on top-right of team card
- **Color bar**: Thin bar under team name
- **Cooldown**: Red box with "⚠ Cooldown" text

### 12.7 Confirmation Dialogs
- **Reset game**: Double confirmation
- **Delete team**: Single confirmation
- **Clear pools**: Single confirmation
- **Clear powerup board**: Single confirmation
- **Use powerup**: No confirmation (modal is the confirmation)
- **Claim powerup**: Separate confirmation modal
- **Randomize**: Single confirmation with context

### 12.8 Validation Messages
- **Min/max completions**: Alert if not enough players selected
- **Powerup restrictions**: Alert explaining why action failed
- **Tile restrictions**: Disabled buttons with title tooltips
- **Password errors**: Alert for incorrect password

### 12.9 History/Undo System
- **Storage**: Last 50 game states in memory
- **Trigger**: Options → Undo
- **Limitation**: Firebase mode only affects local view
- **Visual**: Button disabled when no history

### 12.10 Data Persistence
- **localStorage**: Key = "tile_race_game_state_v2_instructions_draft"
- **Firebase**: Paths = `/events` and `/gameState`
- **Auto-save**: Every state change
- **Theme**: Separate key = "tileRaceTheme"
- **Auth**: Separate key = "tileRaceAuth"

---

## Summary of ALL Interactive Elements

### Modals (16 total)
1. Main Tile Details
2. Powerup Tile Details  
3. Player Selection (Complete)
4. Player Selection (Powerup Claim)
5. Claim Powerup
6. Use Powerup
7. Edit Team (Admin)
8. Create Powerup (Admin)
9. Import Tasks (Admin)
10. Import Powerups (Admin)
11. Draft/Form Teams (Admin)
12. Login
13. Team Password Setup (Admin)
14. Admin Management (Master Admin)
15. Change Password (Admin)
16. Gradient Settings (Admin)

### Button Types (30+ distinct)
1. Complete tile
2. Claim powerup
3. Use powerup
4. Use copy-choice
5. Clear cooldown
6. Edit team (admin)
7. Remove team (admin)
8. Add team (admin)
9. Toggle player points
10. Toggle theme
11. Login/Logout
12. Options menu (admin)
13. Main tile (board)
14. Powerup tile (board)
15. Add pool task (admin)
16. Edit pool task (admin)
17. Remove pool task (admin)
18. Create powerup (admin)
19. Clear powerup board (admin)
20. Clear task pools (admin)
21. Randomize difficulties (admin)
22. Randomize tiles (admin)
23. Undo (admin)
24. Reset all (admin)
25. Form teams (admin)
26. Import tasks (admin)
27. Import powerups (admin)
28. Gradient settings (admin)
29. Download backup (master admin)
30. Restore backup (master admin)
31. Manage admins (master admin)
32. Disable fog of war (master admin)

### Game Mechanics (25+)
1. Complete tile (normal)
2. Complete tile (multi-selection)
3. Complete tile (doubled)
4. Use copy-choice
5. Claim powerup tile
6. Use skip powerup (3 types)
7. Use back powerup (3 types)
8. Use copypaste
9. Use changeTile
10. Use clearCooldown
11. Use disablePowerup
12. Use doublePowerup
13. Use doubleTile (3 types)
14. Pre-clear mechanic
15. Copy-choice mechanic
16. Tile changing
17. Tile doubling
18. Powerup cooldown
19. Fog of war reveals
20. Reward claiming
21. Point awarding
22. Team position tracking
23. Event logging
24. History/undo
25. Real-time sync

This represents a fully-featured, multi-modal game with comprehensive admin controls, real-time collaboration, authentication, and complex game mechanics!
