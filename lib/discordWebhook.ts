import { GameEvent, GameState, POWERUP_DEFS } from "@/types/game";

/**
 * Discord webhook integration for game events
 * Sends formatted messages to Discord channel via webhook
 * Supports both main channel and team-specific channels
 */

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
const DISCORD_TEAM_WEBHOOKS = process.env.NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS;

// Numbered webhook slots (1-5)
const DISCORD_WEBHOOK_SLOTS = {
  1: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_1,
  2: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_2,
  3: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_3,
  4: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_4,
  5: process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_5,
};

/**
 * Parse team webhooks from environment variable (legacy format)
 * Format: "TeamName1:webhook_url1,TeamName2:webhook_url2"
 */
function parseTeamWebhooks(): Map<string, string> {
  const webhooks = new Map<string, string>();
  
  if (!DISCORD_TEAM_WEBHOOKS) {
    return webhooks;
  }
  
  const pairs = DISCORD_TEAM_WEBHOOKS.split(',');
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) continue;
    
    const teamName = pair.substring(0, colonIndex).trim();
    const webhookUrl = pair.substring(colonIndex + 1).trim();
    
    if (teamName && webhookUrl) {
      webhooks.set(teamName.toLowerCase(), webhookUrl);
    }
  }
  
  return webhooks;
}

const teamWebhooks = parseTeamWebhooks();

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

/**
 * Convert game event to Discord embed format
 */
function eventToEmbed(event: GameEvent, gameState?: GameState): DiscordEmbed {
  const timestamp = new Date().toISOString();
  
  // Helper to get team name by ID
  const getTeamName = (teamId: string): string => {
    if (!gameState) return teamId;
    const team = gameState.teams.find(t => t.id === teamId);
    return team ? team.name : teamId;
  };
  
  // Helper to get powerup name by ID
  const getPowerupName = (powerupId: string): string => {
    const powerup = POWERUP_DEFS.find(p => p.id === powerupId);
    return powerup ? powerup.name : powerupId;
  };
  
  // Color scheme based on event type
  const colors: Record<string, number> = {
    COMPLETE_TILE: 0x00ff00, // Green
    CLAIM_POWERUP_TILE: 0xffaa00, // Orange
    USE_POWERUP: 0xff00ff, // Purple
    ADMIN_MOVE_TEAM: 0x0099ff, // Blue
    ADMIN_GRANT_POWERUP: 0x00aaff, // Light Blue
    VICTORY: 0xffd700, // Gold
    RESET_ALL: 0xff0000, // Red
    ADD_TEAM: 0x00ff00, // Green
    EDIT_TEAM: 0x0099ff, // Blue
    DELETE_TEAM: 0xff0000, // Red
  };
  
  const color = colors[event.type] || 0x808080; // Default gray
  
  // Format event description based on type
  let title = "";
  let description = "";
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];
  
  switch (event.type) {
    case "COMPLETE_TILE":
      const teamName = getTeamName(event.teamId);
      
      // Check if admin action
      const isAdminComplete = event.adminName !== undefined;
      if (isAdminComplete) {
        title = `[${event.adminName}] ${teamName} completed a task`;
      } else {
        title = `${teamName} completed a task`;
      }
      
      // Add tile position if available from game state
      if (gameState) {
        const team = gameState.teams.find(t => t.id === event.teamId);
        if (team) {
          const tile = gameState.raceTiles.find(t => t.n === team.pos - 1);
          if (tile) {
            fields.push({ name: "Tile", value: `#${team.pos - 1} - ${tile.label}`, inline: false });
            
            // Calculate points using same logic as game
            const isMultiCompletion = Math.max(1, Number(tile.maxCompletions || 1)) > 1;
            const doubledTilesInfo = gameState.doubledTilesInfo || {};
            const isDoubledWithDiffPoints = doubledTilesInfo[team.pos - 1]?.useDifficultyPoints || false;
            
            const points = (isMultiCompletion && !isDoubledWithDiffPoints) 
              ? 1 
              : tile.difficulty === 1 ? 1 : tile.difficulty === 2 ? 2 : 3;
            
            // Format player completions as list
            if (event.playerNames && event.playerNames.length > 0) {
              const playersList = event.playerNames.map(p => `• ${p} - ${points} pt${points !== 1 ? 's' : ''}`).join('\n');
              fields.push({ name: "Completions", value: playersList, inline: false });
            }
          }
          fields.push({ name: "New Position", value: `Tile ${team.pos}`, inline: true });
        }
      }
      break;
      
    case "CLAIM_POWERUP_TILE":
      const claimTeamName = getTeamName(event.teamId);
      
      // Check if admin action (no player names)
      const isAdminClaim = !event.playerNames || event.playerNames.length === 0;
      if (isAdminClaim) {
        title = `[Admin] ${claimTeamName} claimed a powerup tile`;
      } else {
        title = `${claimTeamName} claimed a powerup tile`;
      }
      
      // Get powerup tile details
      if (gameState) {
        const powerupTile = gameState.powerupTiles.find(pt => pt.id === Number(event.powerTileId));
        if (powerupTile) {
          fields.push({ name: "Powerup", value: getPowerupName(powerupTile.rewardPowerupId), inline: false });
          fields.push({ name: "Task", value: powerupTile.label, inline: false });
          if (powerupTile.pointsPerCompletion > 0 && event.playerNames && event.playerNames.length > 0) {
            const playersList = event.playerNames.map(p => `• ${p} - ${powerupTile.pointsPerCompletion} pt${powerupTile.pointsPerCompletion !== 1 ? 's' : ''}`).join('\n');
            fields.push({ name: "Completions", value: playersList, inline: false });
          }
        }
      }
      break;
      
    case "USE_POWERUP":
      const useTeamName = getTeamName(event.teamId);
      const powerupName = getPowerupName(event.powerupId);
      title = "⚡ Powerup Used";
      
      // Check if admin triggered
      if (event.adminName) {
        description = `**${useTeamName}** used **${powerupName}** *(Admin action)*`;
      } else {
        description = `**${useTeamName}** used **${powerupName}**`;
      }
      
      if (event.targetId) {
        const targetName = getTeamName(event.targetId);
        fields.push({ name: "Target Team", value: targetName, inline: true });
      }
      if (event.futureTile) {
        fields.push({ name: "Target Tile", value: `#${event.futureTile}`, inline: true });
      }
      break;
      
    case "ADD_TEAM":
      title = "➕ Team Added";
      description = `New team created: **${event.name}**`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      break;
      
    case "REMOVE_TEAM":
      title = "❌ Team Removed";
      description = `A team was removed`;
      fields.push({ name: "Team ID", value: event.teamId, inline: true });
      break;
      
    case "RESET_ALL":
      title = "🔄 Game Reset";
      description = "The entire game has been reset";
      break;
      
    case "ADMIN_UNDO":
      title = "↩️ Undo";
      description = "Admin undid the last action";
      break;
      
    case "ADMIN_UPDATE_TEAM":
      const updatedTeamName = getTeamName(event.teamId);
      title = "✏️ Team Updated";
      
      // Build change description matching event log format
      const changes: string[] = [];
      if (gameState) {
        const oldTeam = gameState.teams.find(t => t.id === event.teamId);
        if (oldTeam && event.updates) {
          for (const [key, newValue] of Object.entries(event.updates)) {
            const oldValue = (oldTeam as any)[key];
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
              if (key === "inventory") {
                const oldLen = Array.isArray(oldValue) ? oldValue.length : 0;
                const newLen = Array.isArray(newValue) ? (newValue as any[]).length : 0;
                changes.push(`inventory: ${oldLen} items → ${newLen} items`);
              } else if (key === "pos") {
                changes.push(`position: ${oldValue} → ${newValue}`);
              } else if (key === "powerupCooldown") {
                changes.push(`cooldown: ${oldValue ? "ON" : "OFF"} → ${newValue ? "ON" : "OFF"}`);
              } else if (key === "discordWebhookSlot") {
                const oldSlot = oldValue === null || oldValue === undefined ? "None" : `Channel ${oldValue}`;
                const newSlot = newValue === null || newValue === undefined ? "None" : `Channel ${newValue}`;
                changes.push(`discord: ${oldSlot} → ${newSlot}`);
              } else if (key === "members") {
                const oldMembers = Array.isArray(oldValue) ? oldValue : [];
                const newMembers = Array.isArray(newValue) ? newValue : [];
                changes.push(`members: [${oldMembers.join(", ")}] → [${newMembers.join(", ")}]`);
              } else {
                changes.push(`${key}: ${JSON.stringify(oldValue)} → ${JSON.stringify(newValue)}`);
              }
            }
          }
        }
      }
      
      const changeDesc = changes.length > 0 ? ` (${changes.join(", ")})` : "";
      description = `Admin updated team **${updatedTeamName}**${changeDesc}`;
      break;
      
    default:
      title = `📝 ${event.type}`;
      description = "Game event occurred";
  }
  
  return {
    title,
    description,
    color,
    timestamp,
    fields: fields.length > 0 ? fields : undefined,
  };
}

/**
 * Get team name from event
 */
function getTeamNameFromEvent(event: GameEvent): string | null {
  // For events that reference a team by name
  if ('name' in event && event.name) return event.name;
  // For most other events, we'd need to look up the team by ID
  // This would require passing the game state, which we don't have here
  // So we'll return null and rely on team ID matching instead
  return null;
}

/**
 * Get team ID from event
 */
function getTeamIdFromEvent(event: GameEvent): string | null {
  if ('teamId' in event && event.teamId) return event.teamId;
  return null;
}

/**
 * Send message to a Discord webhook
 */
async function sendToWebhook(webhookUrl: string, embed: DiscordEmbed, mentionText?: string): Promise<boolean> {
  try {
    const payload: any = {
      embeds: [embed],
      username: "TileRace Game Bot",
    };
    
    // Add mention text if provided (for team-specific channels)
    if (mentionText) {
      payload.content = mentionText;
    }
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error("Failed to send Discord webhook:", response.status, response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    return false;
  }
}

/**
 * Send event to Discord webhook(s)
 * Will send to main channel and/or team-specific channel as appropriate
 */
export async function sendEventToDiscord(event: GameEvent, gameState?: GameState): Promise<void> {
  // Skip certain events that are too noisy or not interesting
  const skipEvents = ["ADMIN_UNDO"]; // Add more if needed
  if (skipEvents.includes(event.type)) {
    return;
  }
  
  const embed = eventToEmbed(event, gameState);
  
  // Collect all affected teams
  const affectedTeams = new Set<{ name: string; slot?: number | null }>();
  
  // Get primary team (the team performing the action)
  if ('name' in event && event.name) {
    affectedTeams.add({ name: event.name, slot: null });
  } else if ('teamId' in event && event.teamId && gameState) {
    const team = gameState.teams.find(t => t.id === event.teamId);
    if (team) affectedTeams.add({ name: team.name, slot: team.discordWebhookSlot });
  }
  
  // For targeted powerups, also notify the target team
  if (event.type === 'USE_POWERUP' && 'targetId' in event && event.targetId && gameState) {
    const targetTeam = gameState.teams.find(t => t.id === event.targetId);
    if (targetTeam) affectedTeams.add({ name: targetTeam.name, slot: targetTeam.discordWebhookSlot });
  }
  
  // Send to main channel if configured
  if (DISCORD_WEBHOOK_URL) {
    await sendToWebhook(DISCORD_WEBHOOK_URL, embed);
  }
  
  // Send to team-specific channels
  if (affectedTeams.size > 0) {
    for (const team of affectedTeams) {
      let teamWebhookUrl: string | undefined;
      
      // Priority 1: Use numbered slot if assigned
      if (team.slot && team.slot >= 1 && team.slot <= 5) {
        teamWebhookUrl = DISCORD_WEBHOOK_SLOTS[team.slot as keyof typeof DISCORD_WEBHOOK_SLOTS];
      }
      
      // Priority 2: Fall back to legacy name-based mapping
      if (!teamWebhookUrl && teamWebhooks.size > 0) {
        teamWebhookUrl = teamWebhooks.get(team.name.toLowerCase());
      }
      
      if (teamWebhookUrl) {
        const mention = `@${team.name}`;
        await sendToWebhook(teamWebhookUrl, embed, mention);
      }
    }
  }
}

/**
 * Test the Discord webhook with a sample message
 */
export async function testDiscordWebhook(): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.error("Discord webhook URL not configured");
    return false;
  }
  
  try {
    const payload = {
      embeds: [{
        title: "🎮 TileRace Bot Connected",
        description: "Discord integration is working! Game events will appear here.",
        color: 0x00ff00,
        timestamp: new Date().toISOString(),
      }],
      username: "TileRace Game Bot",
    };
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error testing Discord webhook:", error);
    return false;
  }
}
