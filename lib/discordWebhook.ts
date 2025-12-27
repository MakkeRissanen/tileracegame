import { GameEvent } from "@/types/game";

/**
 * Discord webhook integration for game events
 * Sends formatted messages to Discord channel via webhook
 */

const DISCORD_WEBHOOK_URL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;

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
    COMPLETE_TASK: 0x00ff00, // Green
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
    case "COMPLETE_TASK":
      title = "✅ Task Completed";
      description = `**${event.teamName}** completed a task`;
      if (event.playerName) fields.push({ name: "Player", value: event.playerName, inline: true });
      if (event.taskDesc) fields.push({ name: "Task", value: event.taskDesc, inline: false });
      if (event.rewardDesc) fields.push({ name: "Reward", value: event.rewardDesc, inline: false });
      break;
      
    case "CLAIM_POWERUP_TILE":
      title = "🎁 Powerup Claimed";
      description = `**${event.teamName}** claimed a powerup tile`;
      if (event.playerName) fields.push({ name: "Player", value: event.playerName, inline: true });
      if (event.powerupLabel) fields.push({ name: "Powerup", value: event.powerupLabel, inline: false });
      break;
      
    case "USE_POWERUP":
      title = "⚡ Powerup Used";
      description = `**${event.teamName}** used a powerup`;
      if (event.playerName) fields.push({ name: "Player", value: event.playerName, inline: true });
      if (event.powerupLabel) fields.push({ name: "Powerup", value: event.powerupLabel, inline: false });
      if (event.targetName) fields.push({ name: "Target", value: event.targetName, inline: true });
      break;
      
    case "ADMIN_MOVE_TEAM":
      title = "🎯 Admin Move";
      description = `**${event.teamName}** was moved by admin`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      if (event.oldPos !== undefined && event.newPos !== undefined) {
        fields.push({ name: "Movement", value: `Tile ${event.oldPos} → Tile ${event.newPos}`, inline: false });
      }
      break;
      
    case "ADMIN_GRANT_POWERUP":
      title = "🎁 Admin Grant";
      description = `Admin granted a powerup to **${event.teamName}**`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      if (event.powerupLabel) fields.push({ name: "Powerup", value: event.powerupLabel, inline: false });
      break;
      
    case "VICTORY":
      title = "🏆 VICTORY!";
      description = `**${event.teamName}** has won the game!`;
      break;
      
    case "ADD_TEAM":
      title = "➕ Team Added";
      description = `New team created: **${event.name}**`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      break;
      
    case "EDIT_TEAM":
      title = "✏️ Team Edited";
      description = `Team **${event.name}** was modified`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      break;
      
    case "DELETE_TEAM":
      title = "❌ Team Deleted";
      description = `Team **${event.teamName}** was removed`;
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
      break;
      
    case "RESET_ALL":
      title = "🔄 Game Reset";
      description = "The entire game has been reset";
      break;
      
    case "ADMIN_UNDO":
      title = "↩️ Undo";
      description = "Admin undid the last action";
      if (event.adminName) fields.push({ name: "Admin", value: event.adminName, inline: true });
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
 * Send event to Discord webhook
 */
export async function sendEventToDiscord(event: GameEvent): Promise<void> {
  // Skip if webhook URL is not configured
  if (!DISCORD_WEBHOOK_URL) {
    return;
  }
  
  // Skip certain events that are too noisy or not interesting
  const skipEvents = ["ADMIN_UNDO"]; // Add more if needed
  if (skipEvents.includes(event.type)) {
    return;
  }
  
  try {
    const embed = eventToEmbed(event);
    
    const payload = {
      embeds: [embed],
      username: "TileRace Game Bot",
    };
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error("Failed to send Discord webhook:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    // Don't throw - we don't want Discord failures to break the game
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
