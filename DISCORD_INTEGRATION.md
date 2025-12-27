# Discord Bot Integration for TileRace

## Overview
The TileRace game sends all game events to Discord channels via webhooks. Supports:
- **Main channel**: All events
- **Team-specific channels**: Events affecting each team (optional)

## Setup Instructions

### Option 1: Single Main Channel (Simplest)

1. Open your Discord server
2. Go to **Server Settings** → **Integrations** → **Webhooks**
3. Click **Create Webhook**
4. Give it a name like "TileRace Game Bot"
5. Select the channel where you want ALL events to appear
6. Click **Copy Webhook URL**
7. In `.env.local`, set:
   ```
   NEXT_PUBLIC_DISCORD_WEBHOOK_URL=your_webhook_url_here
   ```

### Option 2: Main Channel + Team Channels (Recommended)

1. **Create main webhook** (as above)
2. **Create team webhooks**:
   - For each team, create a separate webhook in their team channel
   - Copy each webhook URL
3. In `.env.local`, set both:
   ```
   NEXT_PUBLIC_DISCORD_WEBHOOK_URL=main_webhook_url
   NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS=Team1:webhook1,Team2:webhook2
   ```
   
**Example**:
```env
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/abc
NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS=Blue Team:https://discord.com/api/webhooks/456/def,Red Team:https://discord.com/api/webhooks/789/ghi
```

**Important**: Team names in the config must match EXACTLY (case-insensitive) with team names in the game.

### Option 3: Team Channels Only (No Main)

Leave `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` empty and only set team webhooks:
```env
NEXT_PUBLIC_DISCORD_WEBHOOK_URL=
NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS=Blue:url1,Red:url2,Green:url3
```

### Restart Server

```bash
npm run dev
```

## What Gets Sent

Events are sent with color-coded embeds:

- ✅ **Task Completed** (Green) - Sent to team channel + main
- 🎁 **Powerup Claimed** (Orange) - Sent to team channel + main
- ⚡ **Powerup Used** (Purple) - Sent to team channel + main
- 🎯 **Admin Move** (Blue) - Sent to affected team channel + main
- 🎁 **Admin Grant** (Light Blue) - Sent to team channel + main
- 🏆 **Victory** (Gold) - Sent to winning team channel + main
- ➕ **Team Added** (Green) - Sent to main only
- ✏️ **Team Edited** (Blue) - Sent to team channel + main
- ❌ **Team Deleted** (Red) - Sent to main only
- 🔄 **Game Reset** (Red) - Sent to main only

**Team channels** receive only events that affect their team.  
**Main channel** receives all events (if configured).

## Netlify Deployment

Add both environment variables in Netlify:

1. Go to **Site configuration** → **Environment variables**
2. Add `NEXT_PUBLIC_DISCORD_WEBHOOK_URL` with your main webhook
3. Add `NEXT_PUBLIC_DISCORD_TEAM_WEBHOOKS` with your team webhooks (format: `Team1:url1,Team2:url2`)
4. Redeploy

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
