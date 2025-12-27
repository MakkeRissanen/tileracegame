# Discord Bot Integration for TileRace

## Overview
The TileRace game now sends all game events to a Discord channel via webhooks. Every action in the game (task completions, powerup claims, team movements, etc.) will appear as formatted messages in your Discord server.

## Setup Instructions

### 1. Create a Discord Webhook

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **Create Webhook** (or **New Webhook**)
4. Give it a name like "TileRace Game Bot"
5. Select the channel where you want events to appear
6. Click **Copy Webhook URL**

### 2. Configure the Application

1. Open `.env.local` in your project
2. Find the line: `NEXT_PUBLIC_DISCORD_WEBHOOK_URL=`
3. Paste your webhook URL after the `=`
   ```
   NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/abcdefg...
   ```
4. Save the file

### 3. Restart Your Development Server

```bash
npm run dev
```

## What Gets Sent

Every game event will be sent to Discord with color-coded embeds:

- ✅ **Task Completed** (Green) - Shows team, player, task description, and rewards
- 🎁 **Powerup Claimed** (Orange) - Shows which team/player claimed which powerup
- ⚡ **Powerup Used** (Purple) - Shows powerup usage and targets
- 🎯 **Admin Move** (Blue) - Shows when admin moves a team
- 🎁 **Admin Grant** (Light Blue) - Shows when admin grants powerups
- 🏆 **Victory** (Gold) - Shows when a team wins
- ➕ **Team Added** (Green) - Shows when teams are created
- ✏️ **Team Edited** (Blue) - Shows when teams are modified
- ❌ **Team Deleted** (Red) - Shows when teams are removed
- 🔄 **Game Reset** (Red) - Shows when game is reset

## Testing

To test if your webhook is working:

1. Make any action in the game (complete a task, claim a powerup, etc.)
2. Check your Discord channel - you should see a formatted message appear immediately
3. If it doesn't work, check:
   - Webhook URL is correct in `.env.local`
   - Development server was restarted after adding the URL
   - Check browser console for any errors

## Security Notes

- The webhook URL is exposed in client-side code (it uses `NEXT_PUBLIC_` prefix)
- This is safe because Discord webhooks can only POST messages to the channel
- However, anyone with the URL can send messages to that channel
- Keep your `.env.local` file out of version control (it's already in `.gitignore`)
- For production, consider moving this to a server-side API route for better security

## Customization

You can customize the Discord integration in `lib/discordWebhook.ts`:

- **Skip certain events**: Add event types to `skipEvents` array
- **Change colors**: Modify the `colors` object
- **Change formatting**: Modify the `eventToEmbed()` function
- **Add more details**: Add more fields to specific event types

## Troubleshooting

**No messages appearing:**
- Verify webhook URL is correct
- Check browser console for errors
- Ensure you restarted the dev server after adding the URL

**Rate limiting:**
- Discord allows ~5 requests per second per webhook
- The current implementation should be well within limits
- If you have extremely high traffic, consider batching events

**Webhook deleted:**
- If the webhook is deleted in Discord, update `.env.local` with a new URL
- Or set `NEXT_PUBLIC_DISCORD_WEBHOOK_URL=` to empty to disable

## Disable Integration

To disable Discord notifications, simply remove or empty the webhook URL in `.env.local`:

```
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=
```

The game will continue working normally without Discord integration.
