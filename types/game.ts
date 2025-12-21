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
  powerupCooldown: boolean;
  password: string | null;
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
}

export interface GameState {
  version: number;
  raceTiles: RaceTile[];
  powerupTiles: PowerupTile[];
  taskPools: Record<string, PoolTask[]>;
  usedPoolTaskIds: string[];
  changedTiles: number[];
  copyPasteTiles: number[];
  doubledTiles: number[];
  doubledTilesInfo: Record<number, { useDifficultyPoints: boolean }>;
  revealedTiles: number[];
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
}

export const POWERUP_DEFS: PowerupDef[] = [
  { id: "skip1", name: "Skip 1 tile", kind: "self" },
  { id: "skip2", name: "Skip 2 tiles", kind: "self" },
  { id: "skip3", name: "Skip 3 tiles", kind: "self" },
  { id: "back1", name: "Make other team go backward 1 tile", kind: "target" },
  { id: "back2", name: "Make other team go backward 2 tiles", kind: "target" },
  { id: "back3", name: "Make other team go backward 3 tiles", kind: "target" },
  { id: "copypaste", name: "Ctrl + C, Ctrl + V", kind: "future" },
  { id: "changeTile", name: "Change tile (same difficulty pool)", kind: "change" },
  { id: "clearCooldown", name: "Clear powerup cooldown", kind: "self" },
  { id: "disablePowerup", name: "Disable a stored powerup from target team", kind: "targetPowerup" },
  { id: "doublePowerup", name: "Double a stored powerup", kind: "selfPowerup" },
  { id: "doubleEasy", name: "Double requirement on an easy tile", kind: "doubleTile" },
  { id: "doubleMedium", name: "Double requirement on a medium tile", kind: "doubleTile" },
  { id: "doubleHard", name: "Double requirement on a hard tile", kind: "doubleTile" },
];

// Game Events
export type GameEvent =
  | { type: "RESET_ALL" }
  | { type: "ADD_TEAM"; name: string; adminName?: string }
  | { type: "REMOVE_TEAM"; teamId: string }
  | { type: "COMPLETE_TILE"; teamId: string; playerNames: string[] }
  | { type: "USE_COPY_CHOICE"; teamId: string }
  | {
      type: "CLAIM_POWERUP_TILE";
      teamId: string;
      powerTileId: number;
      playerNames: string[];
    }
  | {
      type: "USE_POWERUP";
      teamId: string;
      powerupId: string;
      targetId?: string;
      futureTile?: number;
      changeTaskId?: string;
      targetPowerupId?: string;
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
  | { type: "ADMIN_IMPORT_POOL_TASKS"; tasks: { difficulty: number; label: string; maxCompletions: number; minCompletions: number; instructions: string; image: string }[] }
  | { type: "ADMIN_IMPORT_POWERUPS"; powerups: Array<{ powerupType: string; label: string; pointsPerCompletion: number; maxCompletions: number; minCompletions: number; claimType: "eachTeam" | "firstTeam" | "unlimited"; instructions: string; image: string }> }
  | { type: "ADMIN_RANDOMIZE_BOARD" }
  | { type: "ADMIN_RANDOMIZE_TILES" }
  | { type: "ADMIN_SET_FOG_OF_WAR"; mode: "none" | "admin" | "all" }
  | { type: "ADMIN_RANDOMIZE_DIFFICULTIES"; weights?: { easy: number; medium: number; hard: number }; gradient?: boolean; early?: { easy: number; medium: number; hard: number }; late?: { easy: number; medium: number; hard: number } }
  | { type: "ADMIN_SAVE_GRADIENT_SETTINGS"; weights: { easy: number; medium: number; hard: number }; gradient: boolean; early?: { easy: number; medium: number; hard: number }; late?: { easy: number; medium: number; hard: number } }
  | { type: "SET_TEAM_PASSWORD"; teamId: string; password: string; adminName?: string }
  | { type: "ADMIN_ADD_ADMIN"; name: string; password: string; isMaster: boolean }
  | { type: "ADMIN_REMOVE_ADMIN"; adminId: string }
  | { type: "ADMIN_CHANGE_PASSWORD"; oldPassword: string; newPassword: string }
  | { type: "ADMIN_SET_ALL_TEAM_PASSWORDS"; password: string }
  | { type: "ADMIN_UNDO" }
  | { type: "ADMIN_APPLY_DRAFT_TEAMS"; teams: Array<{ name: string; captain: string; members: string[] }>; adminName?: string }
  | { type: "ADMIN_UPDATE_TEAM"; teamId: string; updates: Partial<Team> }
  | { type: "ADMIN_UPDATE_POWERUP_TILE"; tileId: number; updates: Partial<PowerupTile>; teamClaims?: Array<{ teamId: string; claimed: boolean }> }
  | { type: "ADMIN_UPDATE_POOL_TASK"; taskId: string; updates: Partial<PoolTask> }
  | { type: "ADMIN_TOGGLE_COOLDOWN"; teamId: string; adminName?: string };
