import {
  GameState,
  RaceTile,
  Team,
  MAX_TILE,
  POWERUP_DEFS,
  LogEntry,
  GameEvent,
} from "@/types/game";

// ========= Utilities =========
export function uid(): string {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function colorForIndex(i: number): string {
  const palette = [
    "bg-red-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-lime-500",
    "bg-orange-500",
    "bg-indigo-500",
  ];
  return palette[i % palette.length];
}

export function powerupLabel(id: string): string {
  return POWERUP_DEFS.find((p) => p.id === id)?.name ?? id;
}

export function diffTint(d: number, isDark: boolean): string {
  const diff = Number(d) || 1;
  if (isDark) {
    if (diff === 1) return "bg-emerald-900/40 border-emerald-600 text-slate-100";
    if (diff === 2) return "bg-amber-900/40 border-amber-600 text-slate-100";
    return "bg-purple-900/40 border-purple-600 text-slate-100";
  } else {
    if (diff === 1) return "bg-emerald-200/80 border-emerald-500 text-slate-900";
    if (diff === 2) return "bg-amber-200/90 border-amber-500 text-slate-900";
    return "bg-purple-200/80 border-purple-500 text-slate-900";
  }
}

export function diffBadge(d: number): { txt: string; cls: string } {
  const diff = Number(d) || 1;
  if (diff === 1) return { txt: "E", cls: "bg-emerald-700 text-white" };
  if (diff === 2) return { txt: "M", cls: "bg-amber-700 text-white" };
  return { txt: "H", cls: "bg-purple-700 text-white" };
}

export function defaultRaceTiles(): RaceTile[] {
  return Array.from({ length: MAX_TILE }, (_, i) => {
    const n = i + 1;
    const label = n === MAX_TILE ? "Final tile" : `Task ${n}`;
    const difficulty: 1 | 2 | 3 = n === MAX_TILE ? 3 : 1;
    return {
      n,
      label,
      difficulty,
      rewardPowerupId: null,
      instructions: "",
      image: "",
      maxCompletions: 1,
      minCompletions: 1,
    };
  });
}

export function initialGame(): GameState {
  return {
    version: 3,
    raceTiles: defaultRaceTiles(),
    powerupTiles: [],
    taskPools: { "1": [], "2": [], "3": [] },
    usedPoolTaskIds: [],
    changedTiles: [],
    doubledTiles: [],
    doubledTilesInfo: {},
    revealedTiles: [1, 2, 3, 4, 5, 6, 7, 8],
    playerPoints: {},
    teams: [],
    admins: [
      { id: "master", name: "Master Admin", password: "admin123", isMaster: true },
    ],
    log: [],
  };
}

// ========= Pure helpers =========
export function addLog(
  game: GameState,
  message: string,
  adminName: string | null = null
): GameState {
  const finalMessage = adminName ? `[${adminName}] ${message}` : message;
  const entry: LogEntry = { id: uid(), ts: Date.now(), message: finalMessage };
  const log = [entry, ...(game.log || [])].slice(0, 200);
  return { ...game, log };
}

export function getRaceTile(game: GameState, n: number): RaceTile {
  return (
    game.raceTiles.find((t) => t.n === n) || {
      n,
      label: `Task ${n}`,
      difficulty: 1,
      rewardPowerupId: null,
      instructions: "",
      image: "",
      maxCompletions: 1,
      minCompletions: 1,
    }
  );
}

export function tileLabel(game: GameState, n: number): string {
  return getRaceTile(game, n).label || `Task ${n}`;
}

export function tileDiff(game: GameState, n: number): number {
  return clamp(Number(getRaceTile(game, n).difficulty || 1), 1, 3);
}

export function tileReward(game: GameState, n: number): string | null {
  return getRaceTile(game, n).rewardPowerupId || null;
}

export function tileInstructions(game: GameState, n: number): string {
  return getRaceTile(game, n).instructions || "";
}

export function tileDesc(game: GameState, n: number): string {
  return `Tile ${n}: "${tileLabel(game, n)}"`;
}

export function simulateAdvance(team: Team, steps: number): number {
  let pos = team.pos;
  for (let i = 0; i < steps; i++) {
    if (pos >= MAX_TILE) break;
    pos += 1;
    while (pos < MAX_TILE && (team.preCleared || []).includes(pos + 1)) pos += 1;
  }
  return pos;
}

export function maybeGrantMainTileReward(
  game: GameState,
  teamId: string,
  completedTileN: number
): { game: GameState; granted: string | null } {
  const reward = tileReward(game, completedTileN);
  if (!reward) return { game, granted: null };

  const team = game.teams.find((t) => t.id === teamId);
  if (!team) return { game, granted: null };

  if ((team.claimedRaceTileRewards || []).includes(completedTileN))
    return { game, granted: null };

  const teams = game.teams.map((t) => {
    if (t.id !== teamId) return t;
    return {
      ...t,
      inventory: [...(t.inventory || []), reward],
      claimedRaceTileRewards: [
        ...(t.claimedRaceTileRewards || []),
        completedTileN,
      ],
    };
  });

  return { game: { ...game, teams }, granted: reward };
}

export function imagePlaceholder(label: string = "No image", w: number = 64, h: number = 64): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><rect fill='%23e2e8f0' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23838fa3' font-size='10'>${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
