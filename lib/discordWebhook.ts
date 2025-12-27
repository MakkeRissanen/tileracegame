import { GameEvent, GameState } from "@/types/game";

/**
 * Discord webhook integration for game events
 * Sends formatted messages to Discord channel via webhook
 * Supports both main channel and team-specific channels
 */

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
const DISCORD_TEAM_WEBHOOKS = process.env.NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS;

/**
 * Parse team webhooks from environment variable
 * Format: "TeamName1:webhook_url1,TeamName2:webhook_url2"
 */
function parseTeamWebhooks(): Map<string, string> {
  const webhooks = new Map<string, string>();
  
  if (!DISCORD_TEAM_WEBHOOKS) {
    return webhooks;
  }
  
  const pairs = DISCORD_TEAM_WEBHOOKS.split(',');
  for (const pair of pairs) {
    const [teamName, webhookUrl] = pair.split(':');
    if (teamName && webhookUrl) {
      webhooks.set(teamName.trim().toLowerCase(), webhookUrl.trim());
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
function eventToEmbed(event: GameEvent): DiscordEmbed {
  const timestamp = new Date().toISOString();
  
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
      title = "✅ Task Completed";
      description = `**${event.teamId}** completed a task`;
      if (event.playerNames && event.playerNames.length > 0) {
        fields.push({ name: "Players", value: event.playerNames.join(", "), inline: false });
      }
      break;
      
    case "CLAIM_POWERUP_TILE":
      title = "🎁 Powerup Claimed";
      description = `A team claimed a powerup tile`;
      if (event.playerNames && event.playerNames.length > 0) {
        fields.push({ name: "Players", value: event.playerNames.join(", "), inline: false });
      }
      fields.push({ name: "Tile ID", value: String(event.powerTileId), inline: true });
      break;
      
    case "USE_POWERUP":
      title = "⚡ Powerup Used";
      description = `A team used a powerup`;
      fields.push({ name: "Powerup ID", value: event.powerupId, inline: true });
      if (event.targetId) fields.push({ name: "Target Team", value: event.targetId, inline: true });
      if (event.futureTile) fields.push({ name: "Target Tile", value: String(event.futureTile), inline: true });
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
async function sendToWebhook(webhookUrl: string, embed: DiscordEmbed): Promise<boolean> {
  try {
    const payload = {
      embeds: [embed],
      username: "TileRace Game Bot",
    };
    
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
  
  const embed = eventToEmbed(event);
  
  // Try to get team name from event or look up by ID
  let teamName: string | null = null;
  if ('name' in event && event.name) {
    teamName = event.name;
  } else if ('teamId' in event && event.teamId && gameState) {
    const team = gameState.teams.find(t => t.id === event.teamId);
    if (team) teamName = team.name;
  }
  
  // Send to main channel if configured
  if (DISCORD_WEBHOOK_URL) {
    await sendToWebhook(DISCORD_WEBHOOK_URL, embed);
  }
  
  // Send to team-specific channel if available
  if (teamName && teamWebhooks.size > 0) {
    const teamWebhookUrl = teamWebhooks.get(teamName.toLowerCase());
    if (teamWebhookUrl) {
      await sendToWebhook(teamWebhookUrl, embed);
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
