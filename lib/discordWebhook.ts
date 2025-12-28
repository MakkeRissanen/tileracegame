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
        title = `${event.adminName}\n✅ ${teamName} completed a tile`;
      } else {
        title = `✅ ${teamName} completed a tile`;
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
              const playersList = event.playerNames.map(p => `⭐ ${p} - ${points} pt${points !== 1 ? 's' : ''}`).join('\n');
              fields.push({ name: "Completions", value: playersList, inline: false });
            }
          }
          
          // Add current position with task label
          const currentTile = gameState.raceTiles.find(t => t.n === team.pos);
          if (currentTile) {
            let positionText = `Tile ${team.pos}: "${currentTile.label}"`;
            if (currentTile.startProofNeeded) {
              positionText += '\n⚠️ START PROOF CHECK';
            }
            fields.push({ name: "New Position", value: positionText, inline: false });
          } else {
            fields.push({ name: "New Position", value: `Tile ${team.pos}`, inline: false });
          }
        }
      }
      break;
      
    case "CLAIM_POWERUP_TILE":
      const claimTeamName = getTeamName(event.teamId);
      
      // Get powerup tile details
      if (gameState) {
        const powerupTile = gameState.powerupTiles.find(pt => pt.id === Number(event.powerTileId));
        if (powerupTile) {
          const powerupName = getPowerupName(powerupTile.rewardPowerupId);
          
          // Check if admin action
          const isAdminClaim = event.adminName !== undefined;
          if (isAdminClaim) {
            title = `${event.adminName}\n🎁 ${claimTeamName} claimed\n${powerupName}`;
          } else {
            title = `🎁 ${claimTeamName} claimed\n${powerupName}`;
          }
          
          fields.push({ name: "Task", value: powerupTile.label, inline: false });
          if (powerupTile.pointsPerCompletion > 0 && event.playerNames && event.playerNames.length > 0) {
            const playersList = event.playerNames.map(p => `⭐ ${p} - ${powerupTile.pointsPerCompletion} pt${powerupTile.pointsPerCompletion !== 1 ? 's' : ''}`).join('\n');
            fields.push({ name: "Completions", value: playersList, inline: false });
          }
        }
      }
      break;
      
    case "USE_POWERUP":
      const useTeamName = getTeamName(event.teamId);
      const powerupName = getPowerupName(event.powerupId);
      
      // Check if admin triggered
      if (event.adminName) {
        title = `${event.adminName}\n⚡ ${useTeamName} used\n${powerupName}`;
      } else {
        title = `⚡ ${useTeamName} used\n${powerupName}`;
      }
      description = "";
      
      if (event.targetId) {
        const targetName = getTeamName(event.targetId);
        fields.push({ name: "Target Team", value: targetName, inline: true });
      }
      if (event.futureTile !== undefined && gameState) {
        const targetTile = gameState.raceTiles.find(t => t.n === event.futureTile);
        if (targetTile) {
          // For copy/paste and change tile, show the task details
          if (event.powerupId === 'copypaste') {
            const userTeam = gameState.teams.find(t => t.id === event.teamId);
            if (userTeam) {
              const sourceTile = gameState.raceTiles.find(t => t.n === userTeam.pos);
              if (sourceTile) {
                fields.push({ 
                  name: "Copied From", 
                  value: `Tile #${userTeam.pos}: "${sourceTile.label}"`, 
                  inline: false 
                });
              }
            }
            // Show what changed on the pasted tile
            if (event.oldTaskLabel && event.newTaskLabel) {
              fields.push({ 
                name: "Pasted To", 
                value: `Tile #${event.futureTile}: "${event.oldTaskLabel}" → "${event.newTaskLabel}"`, 
                inline: false 
              });
            } else {
              fields.push({ 
                name: "Pasted To", 
                value: `Tile #${event.futureTile}: "${targetTile.label}"`, 
                inline: false 
              });
            }
          } else if (event.powerupId === 'changeTile') {
            fields.push({ 
              name: "Target Tile", 
              value: `#${event.futureTile}`, 
              inline: true 
            });
            
            // Show old task → new task if available
            if (event.oldTaskLabel && event.newTaskLabel) {
              fields.push({ 
                name: "Task Changed", 
                value: `"${event.oldTaskLabel}" → "${event.newTaskLabel}"`, 
                inline: false 
              });
            } else if (event.newTaskLabel) {
              fields.push({ 
                name: "New Task", 
                value: `"${event.newTaskLabel}"`, 
                inline: false 
              });
            } else if (event.changeTaskId && gameState.taskPools) {
              // Fallback: try to find task from ID
              const allTasks = [
                ...(gameState.taskPools.easy || []),
                ...(gameState.taskPools.medium || []),
                ...(gameState.taskPools.hard || [])
              ];
              const newTask = allTasks.find(t => t.id === event.changeTaskId);
              if (newTask) {
                fields.push({ 
                  name: "New Task", 
                  value: `"${newTask.label}"`, 
                  inline: false 
                });
              }
            }
          } else if (event.powerupId.startsWith('double')) {
            // For double tile powerups
            const difficultyName = targetTile.difficulty === 1 ? 'Easy' : targetTile.difficulty === 2 ? 'Medium' : 'Hard';
            fields.push({ 
              name: "Target Tile", 
              value: `#${event.futureTile} (${difficultyName})`, 
              inline: true 
            });
            fields.push({ 
              name: "Task", 
              value: `"${targetTile.label}"`, 
              inline: false 
            });
            fields.push({ 
              name: "Effect", 
              value: `Completions doubled: ${targetTile.minCompletions || 1} → ${(targetTile.minCompletions || 1) * 2}`, 
              inline: false 
            });
          } else {
            fields.push({ 
              name: "Target Tile", 
              value: `#${event.futureTile}`, 
              inline: true 
            });
          }
        } else {
          fields.push({ name: "Target Tile", value: `#${event.futureTile}`, inline: true });
        }
      }
      
      // For Disable Powerup, show which powerup was removed
      if (event.powerupId === 'disablePowerup' && event.targetPowerupId) {
        const disabledPowerupName = getPowerupName(event.targetPowerupId);
        fields.push({ 
          name: "Removed Powerup", 
          value: disabledPowerupName, 
          inline: false 
        });
      }
      
      // For Double Powerup, show which powerup was duplicated
      if (event.powerupId === 'doublePowerup' && event.targetPowerupId) {
        const duplicatedPowerupName = getPowerupName(event.targetPowerupId);
        fields.push({ 
          name: "Duplicated Powerup", 
          value: duplicatedPowerupName, 
          inline: false 
        });
      }
      
      // Add current position for movement powerups (skip, back)
      if (gameState && (event.powerupId.startsWith('skip') || event.powerupId.startsWith('back'))) {
        // For skip/back powerups, show from -> to if available
        if (event.fromTileNumber !== undefined && event.toTileNumber !== undefined) {
          const fromTile = gameState.raceTiles.find(t => t.n === event.fromTileNumber);
          const toTile = gameState.raceTiles.find(t => t.n === event.toTileNumber);
          
          // For back powerups, identify the affected team
          const affectedTeam = event.powerupId.startsWith('back') && event.targetId 
            ? gameState.teams.find(t => t.id === event.targetId)
            : gameState.teams.find(t => t.id === event.teamId);
          
          const teamLabel = affectedTeam && event.powerupId.startsWith('back') ? `${affectedTeam.name}: ` : '';
          
          if (fromTile && toTile) {
            let movementText = `${teamLabel}Tile ${event.fromTileNumber}: "${fromTile.label}" → Tile ${event.toTileNumber}: "${toTile.label}"`;
            if (toTile.startProofNeeded) {
              movementText += '\n⚠️ START PROOF CHECK';
            }
            fields.push({ 
              name: "Movement", 
              value: movementText, 
              inline: false 
            });
          } else {
            let movementText = `${teamLabel}Tile ${event.fromTileNumber} → Tile ${event.toTileNumber}`;
            if (toTile && toTile.startProofNeeded) {
              movementText += '\n⚠️ START PROOF CHECK';
            }
            fields.push({ 
              name: "Movement", 
              value: movementText, 
              inline: false 
            });
          }
        } else {
          // Fallback if data not available
          const team = gameState.teams.find(t => t.id === event.teamId);
          const targetTeam = event.targetId ? gameState.teams.find(t => t.id === event.targetId) : team;
          if (targetTeam) {
            const currentTile = gameState.raceTiles.find(t => t.n === targetTeam.pos);
            if (currentTile) {
              let positionText = `Tile ${targetTeam.pos}: "${currentTile.label}"`;
              if (currentTile.startProofNeeded) {
                positionText += '\n⚠️ START PROOF CHECK';
              }
              fields.push({ name: "New Position", value: positionText, inline: false });
            } else {
              fields.push({ name: "New Position", value: `Tile ${targetTeam.pos}`, inline: false });
            }
          }
        }
      }
      break;
      
    case "ADD_TEAM":
      if (event.adminName) {
        title = `${event.adminName}\n➕ Team Added`;
      } else {
        title = "➕ Team Added";
      }
      description = `New team created: **${event.name}**`;
      break;
      
    case "REMOVE_TEAM":
      const removedTeamName = getTeamName(event.teamId);
      
      if (event.adminName) {
        title = `${event.adminName}\n❌ Team Removed`;
      } else {
        title = "❌ Team Removed";
      }
      
      description = `Team **${removedTeamName}** was removed from the game`;
      break;
      
    case "RESET_ALL":
      if (event.adminName) {
        title = `${event.adminName}\n🔄 Game Reset`;
      } else {
        title = "🔄 Game Reset";
      }
      description = "The entire game has been reset";
      break;
      
    case "ADMIN_UNDO":
      if (event.adminName !== undefined) {
        title = `${event.adminName}\n↩️ Undo`;
      } else {
        title = "↩️ Undo";
      }
      
      // Require undoneMessage for Discord posting
      if (event.undoneMessage) {
        description = `Reverted action:\n${event.undoneMessage}`;
      } else {
        // Don't set description - will be caught by validation and skipped
        description = "";
      }
      break;
      
    case "ADMIN_UPDATE_TEAM":
      const updatedTeamName = getTeamName(event.teamId);
      const isAdminUpdate = event.adminName !== undefined;
      
      if (isAdminUpdate) {
        title = `${event.adminName}\n✏️ Team Updated`;
      } else {
        title = "✏️ Team Updated";
      }
      
      // Use changes from the event if available
      const changesList = event.changes || [];
      const changeDesc = changesList.length > 0 ? ` (${changesList.join(", ")})` : "";
      description = `Updated team **${updatedTeamName}**${changeDesc}`;
      break;
      
    case "ADMIN_TOGGLE_COOLDOWN":
      const cooldownTeamName = getTeamName(event.teamId);
      const cooldownTeam = gameState?.teams.find(t => t.id === event.teamId);
      const cooldownStatus = cooldownTeam?.powerupCooldown ? "ON" : "OFF";
      
      if (event.adminName) {
        title = `${event.adminName}\n🔄 Cooldown Changed`;
      } else {
        title = "🔄 Cooldown Changed";
      }
      
      description = `Changed powerup cooldown for **${cooldownTeamName}** → **${cooldownStatus}**`;
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
  const skipEvents: string[] = []; // Add events here if needed
  if (skipEvents.includes(event.type)) {
    return;
  }
  
  const embed = eventToEmbed(event, gameState);
  
  // Validate admin messages have meaningful information
  if ('adminName' in event && event.adminName !== undefined) {
    // Skip if there's no description and no fields (empty admin message)
    if (!embed.description && (!embed.fields || embed.fields.length === 0)) {
      console.warn(`Skipping Discord post for admin event ${event.type} - no meaningful information`);
      return;
    }
    
    // Skip if description is just generic text
    const genericMessages = [
      "Admin undid the last action",
      "Game event occurred",
      "A team was removed"
    ];
    
    if (embed.description && genericMessages.includes(embed.description) && (!embed.fields || embed.fields.length === 0)) {
      console.warn(`Skipping Discord post for admin event ${event.type} - generic message without details`);
      return;
    }
  }
  
  // Collect all affected teams
  const affectedTeams = new Set<{ name: string; slot?: number | null }>();
  
  // Get primary team (the team performing the action)
  if ('name' in event && event.name) {
    affectedTeams.add({ name: event.name, slot: null });
  } else if ('teamId' in event && event.teamId && gameState) {
    const team = gameState.teams.find(t => t.id === event.teamId);
    if (team) affectedTeams.add({ name: team.name, slot: team.discordWebhookSlot });
  }
  
  // For undo events, notify all affected teams
  if (event.type === 'ADMIN_UNDO' && 'affectedTeamIds' in event && event.affectedTeamIds && gameState) {
    event.affectedTeamIds.forEach(teamId => {
      const team = gameState.teams.find(t => t.id === teamId);
      if (team) affectedTeams.add({ name: team.name, slot: team.discordWebhookSlot });
    });
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
