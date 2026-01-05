// Game Types
export const MAX_TILE = 56;

export interface RaceTile {
  n: number;
  label: string;
  difficulty: 1 | 2 | 3;
  rewardPowerupId: string | null;
  instructions: string;
  image: string;
  maxCompletions: number;
  minCompletions: number;
  startProofNeeded?: boolean;
}

export interface PowerupTile {
  id: number;
  label: string;
  rewardPowerupId: string;
  instructions: string;
  image: string;
  link?: string;
  pointsPerCompletion: number;
  maxCompletions: number;
  minCompletions: number;
  claimType: "eachTeam" | "firstTeam" | "unlimited";
}

export interface PoolTask {
  id: string;
  label: string;
  instructions: string;
  image: string;
  maxCompletions?: number;
  minCompletions?: number;
  used: boolean;
  startProofNeeded?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  pos: number;
  createdAt: number;
  inventory: string[];
  preCleared: number[];
  copyChoice: Array<{ tile: number; fromTile?: number }>;
  claimedRaceTileRewards: number[];
  claimedPowerupTiles: number[];
  members: string[];
  captain: string;
  playerPoints: Record<string, number>;
  powerupCooldown: number; // Number of tiles until cooldown clears (0 = no cooldown)
  password: string | null;
  discordWebhookSlot?: number | null; // 1-5 for numbered webhook slots
  discordRoleId?: string | null; // Discord role ID for @mentions (format: <@&ID>)
  insuredPowerups?: number[]; // Array of inventory indices that are insured
}

export interface Admin {
  id: string;
  name: string;
  password: string;
  isMaster: boolean;
}

export interface LogEntry {
  id: string;
  ts: number;
  message: string;
  isTimeBombSecret?: boolean;
}

export interface GameState {
  version: number;
  raceTiles: RaceTile[];
  powerupTiles: PowerupTile[];
  taskPools: Record<string, PoolTask[]>;
  usedPoolTaskIds: string[];
  changedTiles: number[];
  copyPasteTiles: number[];
  copiedFromTiles: number[];
  doubledTiles: number[];
  doubledTilesInfo: Record<number, { useDifficultyPoints: boolean }>;
  revealedTiles: number[];
  timeBombTiles: Record<number, string>; // tileNumber -> teamId who placed it
  lastBombTrigger?: { bombPlacer: string; victim: string; tile: number; pushedTo: number; timestamp: number }; // Latest bomb trigger for Discord
  fogOfWarDisabled?: "none" | "admin" | "all";
  playerPoints: Record<string, number>;
  teams: Team[];
  admins: Admin[];
  log: LogEntry[];
  eventHistory?: GameState[];
  gradientSettings?: {
    weights: { easy: number; medium: number; hard: number };
    gradient: boolean;
    early?: { easy: number; medium: number; hard: number };
    late?: { easy: number; medium: number; hard: number };
  };
}

export interface PowerupDef {
  id: string;
  name: string;
  kind: "self" | "target" | "future" | "change" | "targetPowerup" | "selfPowerup" | "doubleTile";
  description?: string;
}

export const POWERUP_DEFS: PowerupDef[] = [
  { id: "skip1", name: "Skip 1 tile", kind: "self", description: "Instantly move your team forward by 1 tile without completing any tasks." },
  { id: "skip2", name: "Skip 2 tiles", kind: "self", description: "Instantly move your team forward by 2 tiles without completing any tasks." },
  { id: "skip3", name: "Skip 3 tiles", kind: "self", description: "Instantly move your team forward by 3 tiles without completing any tasks." },
  { id: "back1", name: "Make other team go backward 1 tile", kind: "target", description: "Choose another team and move them backward by 1 tile." },
  { id: "back2", name: "Make other team go backward 2 tiles", kind: "target", description: "Choose another team and move them backward by 2 tiles." },
  { id: "back3", name: "Make other team go backward 3 tiles", kind: "target", description: "Choose another team and move them backward by 3 tiles." },
  { id: "copypaste", name: "Copy and Paste Current Tile", kind: "future", description: "Copy the task from your current tile to a tile of equal or lower difficulty (the target tile will rise in difficulty or stay the same)." },
  { id: "changeTile", name: "Change tile (same difficulty pool)", kind: "change", description: "Replace a tile's task with a different one from the same difficulty pool." },
  { id: "clearCooldown", name: "Clear powerup cooldown", kind: "self", description: "Remove the powerup cooldown restriction, allowing you to use another powerup immediately." },
  { id: "disablePowerup", name: "Disable a stored powerup from target team", kind: "targetPowerup", description: "Choose another team and disable one of their stored powerups, removing it from their inventory." },
  { id: "doublePowerup", name: "Double a stored powerup", kind: "selfPowerup", description: "Duplicate one of your stored powerups, giving you two of the same powerup." },
  { id: "doubleEasy", name: "Double requirement on an easy tile", kind: "doubleTile", description: "Make an easy tile require twice as many completions." },
  { id: "doubleMedium", name: "Double requirement on a medium tile", kind: "doubleTile", description: "Make a medium tile require twice as many completions." },
  { id: "doubleHard", name: "Double requirement on a hard tile", kind: "doubleTile", description: "Make a hard tile require twice as many completions." },
  
  // New powerups - mechanics to be implemented
  { id: "powerupInsurance", name: "Powerup Insurance", kind: "selfPowerup", description: "Protects one of your powerups from being disabled or stolen. Select a powerup to insure it." },
  { id: "timeBomb", name: "Time Bomb", kind: "self", description: "Mark your current tile with a time bomb. The next team to land on it gets pushed back 2 tiles. Cannot trigger on yourself." },
  { id: "stealPowerup", name: "Steal Powerup", kind: "targetPowerup", description: "Steal a powerup from another team's inventory. Insured powerups cannot be stolen." },
  { id: "cooldownLock", name: "Cooldown Lock", kind: "target", description: "Lock a team's powerup cooldown for an additional 2 tiles. They must complete 2 extra tiles before using powerups again." },
  { id: "randomizeRandomTile", name: "Randomize Random Tile", kind: "change", description: "Randomly selects a tile on the board and changes it to a random task from ANY difficulty pool. The tile's difficulty can change! Can use any task (even if already used elsewhere). Cannot target tiles behind the farthest team, altered tiles (changed/doubled/copied), the final tile, tiles where teams are standing, or tiles hidden by fog of war." },
  { id: "mysteryPowerup", name: "Mystery Powerup", kind: "self", description: "Opens a lootbox that gives you a random powerup. Possible rewards: Skip 1 tile, Make other team go backward 1 tile, Powerup Insurance, Steal Powerup, Cooldown Lock, Randomize Random Tile, or Clear powerup cooldown." },
];

// Game Events
export type GameEvent =
  | { type: "RESET_ALL"; adminName?: string }
  | { type: "ADD_TEAM"; name: string; adminName?: string }
  | { type: "REMOVE_TEAM"; teamId: string; adminName?: string }
  | { type: "COMPLETE_TILE"; teamId: string; playerNames: string[]; adminName?: string }
  | { type: "USE_COPY_CHOICE"; teamId: string }
  | {
      type: "CLAIM_POWERUP_TILE";
      teamId: string;
      powerTileId: number;
      playerNames: string[];
      adminName?: string;
    }
  | {
      type: "USE_POWERUP";
      teamId: string;
      powerupId: string;
      targetId?: string;
      futureTile?: number;
      changeTaskId?: string;
      targetPowerupId?: string;
      insurePowerupIndex?: number;
      adminName?: string;
      oldTaskLabel?: string;
      newTaskLabel?: string;
      fromTileNumber?: number;
      toTileNumber?: number;
    }
  | {
      type: "ADMIN_EDIT_RACE_TILE";
      n: number;
      label: string;
      difficulty: number;
      rewardPowerupId: string | null;
      instructions: string;
      image: string;
      maxCompletions: number;
      minCompletions: number;
    }
  | {
      type: "ADMIN_CREATE_POWERUP_TILE";
      label: string;
      rewardPowerupId: string;
      instructions: string;
      image: string;
      pointsPerCompletion: number;
      maxCompletions: number;
      minCompletions: number;
      claimType: "eachTeam" | "firstTeam" | "unlimited";
    }
  | {
      type: "ADMIN_EDIT_POWERUP_TILE";
      id: number;
      label: string;
      rewardPowerupId: string | null;
      instructions: string;
      image: string;
      pointsPerCompletion: number;
      maxCompletions: number;
      minCompletions: number;
      claimType: "eachTeam" | "firstTeam" | "unlimited";
    }
  | {
      type: "ADMIN_ADD_POOL_TASK";
      diff: number;
      label: string;
    }
  | {
      type: "ADMIN_EDIT_POOL_TASK";
      diff: number;
      id: string;
      label: string;
      instructions: string;
      image: string;
    }
  | { type: "ADMIN_REMOVE_POOL_TASK"; diff: number; taskId: string }
  | { type: "ADMIN_CLEAR_TASK_POOLS" }
  | { type: "ADMIN_CLEAR_POWERUP_TILES" }
  | { type: "ADMIN_IMPORT_TASKS"; data: string }
  | { type: "ADMIN_IMPORT_TILES"; tiles: RaceTile[] }
  | { type: "ADMIN_IMPORT_POOL_TASKS"; tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string; startProofNeeded?: boolean }[] }
  | { type: "ADMIN_IMPORT_POWERUPS"; powerups: Array<{ powerupType: string; label: string; pointsPerCompletion: number; maxCompletions: number; minCompletions: number; claimType: "eachTeam" | "firstTeam" | "unlimited"; instructions: string; image: string }> }
  | { type: "ADMIN_RANDOMIZE_BOARD" }
  | { type: "ADMIN_RANDOMIZE_TILES" }
  | { type: "ADMIN_SET_FOG_OF_WAR"; mode: "none" | "admin" | "all"; adminName?: string }
  | { type: "ADMIN_RECALCULATE_FOG"; adminName?: string }
  | { type: "ADMIN_LOG_EVENT"; message: string; adminName?: string }
  | { type: "ADMIN_RANDOMIZE_DIFFICULTIES"; weights?: { easy: number; medium: number; hard: number }; gradient?: boolean; early?: { easy: number; medium: number; hard: number }; late?: { easy: number; medium: number; hard: number } }
  | { type: "ADMIN_SAVE_GRADIENT_SETTINGS"; weights: { easy: number; medium: number; hard: number }; gradient: boolean; early?: { easy: number; medium: number; hard: number }; late?: { easy: number; medium: number; hard: number } }
  | { type: "SET_TEAM_PASSWORD"; teamId: string; password: string; adminName?: string }
  | { type: "ADMIN_ADD_ADMIN"; name: string; password: string; isMaster: boolean }
  | { type: "ADMIN_REMOVE_ADMIN"; adminId: string }
  | { type: "ADMIN_CHANGE_PASSWORD"; oldPassword: string; newPassword: string }
  | { type: "ADMIN_SET_ALL_TEAM_PASSWORDS"; password: string }
  | { type: "ADMIN_UNDO"; adminName?: string; undoneMessage?: string; affectedTeamIds?: string[]; targetHistoryIndex?: number }
  | { type: "ADMIN_APPLY_DRAFT_TEAMS"; teams: Array<{ name: string; captain: string; members: string[] }>; adminName?: string }
  | { type: "ADMIN_UPDATE_TEAM"; teamId: string; updates: Partial<Team>; adminName?: string; changes?: string[] }
  | { type: "ADMIN_UPDATE_POWERUP_TILE"; tileId: number; updates: Partial<PowerupTile>; teamClaims?: Array<{ teamId: string; claimed: boolean }> }
  | { type: "ADMIN_UPDATE_POOL_TASK"; taskId: string; updates: Partial<PoolTask> }
  | { type: "ADMIN_TOGGLE_COOLDOWN"; teamId: string; cooldownValue: number; adminName?: string }
  | { type: "SACRIFICE_FOR_TIMEBOMB"; teamId: string; sacrificedPowerups: string[]; adminName?: string }
  | { type: "RESTORE_BACKUP"; gameState: GameState; adminName: string };
