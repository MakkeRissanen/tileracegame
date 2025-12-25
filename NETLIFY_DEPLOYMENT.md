# Netlify Deployment Guide

## Prerequisites

- [x] Firebase project configured with Anonymous Auth enabled
- [x] Firebase Database security rules updated
- [x] `.env.local` file configured locally
- [x] Code tested locally with `npm run dev`
- [ ] Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Netlify account

## Step 1: Prepare Your Repository

### Push to Git (if not already)

```bash
# Initialize git (if needed)
git init

# Add all files
git add .

# Commit
git commit -m "Production ready with Firebase Auth"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/tile-race-game.git

# Push
git push -u origin main
```

## Step 2: Install Netlify CLI (Optional but Recommended)

```bash
npm install -D @netlify/plugin-nextjs
```

Then commit:
```bash
git add package.json package-lock.json
git commit -m "Add Netlify Next.js plugin"
git push
```

## Step 3: Create netlify.toml Configuration

Already created in your project root. Contents:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

## Step 4: Deploy to Netlify

### Option A: Netlify Dashboard (Easiest)

1. **Go to [netlify.com](https://netlify.com)**
2. **Click "Add new site" → "Import an existing project"**
3. **Connect to Git provider** (GitHub/GitLab/Bitbucket)
4. **Select your repository**
5. **Configure build settings:**
   - Build command: `npm run build` (auto-detected)
   - Publish directory: `.next` (auto-detected)
   - Click "Show advanced" if needed

6. **Add environment variables** (CRITICAL):
   Click "Add environment variables" and add ALL of these:
   
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ADMIN_PASSWORD=your_strong_production_password
   ```

7. **Click "Deploy site"**

8. **Wait for deployment** (~2-5 minutes)

### Option B: Netlify CLI

```bash
# Install CLI globally
npm install -g netlify-cli

# Login
netlify login

# Initialize (from project directory)
netlify init

# Follow prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: tile-race-game (or custom)
# - Build command: npm run build
# - Publish directory: .next

# Add environment variables
netlify env:set NEXT_PUBLIC_FIREBASE_API_KEY "your_value"
netlify env:set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "your_value"
# ... repeat for all env vars

# Deploy
netlify deploy --prod
```

## Step 5: Configure Your Site

### Set Production Admin Password

**CRITICAL**: In Netlify Dashboard → Site settings → Environment variables:

Change `ADMIN_PASSWORD` to something strong:
```
ADMIN_PASSWORD=MyVeryStr0ng!Password2025
```

After changing, redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

Or in Netlify Dashboard: **Deploys → Trigger deploy → Deploy site**

### Custom Domain (Optional)

1. Netlify Dashboard → **Domain management**
2. Click "Add custom domain"
3. Enter your domain (e.g., `tilerace.yourdomain.com`)
4. Follow DNS configuration instructions
5. SSL certificate auto-generated (free)

## Step 6: Test Production Deployment

1. **Visit your Netlify URL** (e.g., `https://your-site.netlify.app`)
2. **Check authentication**:
   - Should see brief loading screen
   - Game should load automatically
   - Check browser console for errors
3. **Test game functionality**:
   - Go to `/admin` - login with production password
   - Create teams, set passwords
   - Open in another browser/incognito
   - Select team and test gameplay
4. **Check Firebase Console**:
   - Authentication → Users (should see anonymous users)
   - Database → Data (should see game data syncing)

## Step 7: Monitoring & Maintenance

### Netlify Analytics
- Site overview → Analytics
- Monitor traffic, build times
- Check for errors in Function logs

### Firebase Monitoring
- Console → Analytics
- Check user growth
- Monitor database usage
- Set up budget alerts

### Set Up Alerts

**Netlify:**
- Deploy notifications (Settings → Build & deploy → Deploy notifications)
- Add webhook to Discord/Slack

**Firebase:**
- Project settings → Usage and billing
- Set budget alerts
- Enable daily usage emails

## Troubleshooting

### Build Failures

**"Module not found":**
```bash
# Ensure all dependencies in package.json
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**"Environment variable undefined":**
- Check all `NEXT_PUBLIC_*` variables in Netlify
- Redeploy after adding variables

### Runtime Errors

**"Permission Denied" in Firebase:**
1. Check Anonymous auth is enabled
2. Check database rules are published
3. Check Firebase config values are correct

**"CORS Error":**
- Firebase automatically allows all origins
- Check if using correct `authDomain` and `databaseURL`

**Admin Panel 403:**
- Check `ADMIN_PASSWORD` environment variable is set
- Ensure it's NOT prefixed with `NEXT_PUBLIC_`

### Performance Issues

**Slow loads:**
- Enable Netlify CDN (automatic)
- Check Firebase region (closer to users = faster)
- Monitor Firebase quotas

**Build timeout:**
- Increase timeout in Netlify settings (max 30 min)
- Check for circular dependencies

## Continuous Deployment

Once set up, every push to your main branch will:
1. ✅ Trigger Netlify build
2. ✅ Run `npm run build`
3. ✅ Deploy new version
4. ✅ Keep previous deployments as rollback points

### Manual Deploys

```bash
# Deploy specific branch
git checkout feature-branch
git push origin feature-branch

# In Netlify: Create branch deploy
# Or use CLI:
netlify deploy --alias=feature-preview
```

## Rollback

If something goes wrong:

1. Netlify Dashboard → **Deploys**
2. Find last working deploy
3. Click **"⋯"** → **"Publish deploy"**
4. Instant rollback!

## Cost Summary

### Netlify
- **Free tier**: 100GB bandwidth, 300 build minutes/month
- **Pro**: $19/month - More bandwidth, faster builds
- **Your app**: Should fit in free tier easily

### Firebase (with Auth)
- **Spark (Free)**: 100 connections, anonymous auth included
- **Blaze**: Pay-as-you-go after free tier
- **Your app**: Likely free tier sufficient for moderate use

## Security Checklist

- [ ] Admin password changed from default
- [ ] Firebase database rules published
- [ ] Anonymous auth enabled in Firebase
- [ ] All environment variables set in Netlify
- [ ] `.env.local` NOT committed to Git
- [ ] Firebase budget alerts configured
- [ ] Tested on production URL
- [ ] Custom domain SSL enabled (if using)

## Next Steps After Deployment

1. **Share the URL** with your team/players
2. **Create teams** via admin panel
3. **Monitor usage** in first 24 hours
4. **Set up backups** (Firebase daily exports)
5. **Consider**: 
   - Analytics (Google Analytics, Plausible)
   - Error tracking (Sentry)
   - Uptime monitoring (UptimeRobot)

## Support Resources

- **Netlify Docs**: https://docs.netlify.com/
- **Netlify Support**: https://answers.netlify.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js on Netlify**: https://docs.netlify.com/frameworks/next-js/

---

🎉 **You're ready to deploy!** Follow Step 4 to get your game live on the internet.
