# Firebase Setup & Security Configuration

## Firebase Authentication Setup

### 1. Enable Anonymous Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. In left sidebar: **Build → Authentication**
4. Click **Get Started** (if first time)
5. Go to **Sign-in method** tab
6. Enable **Anonymous** authentication:
   - Click on "Anonymous"
   - Toggle "Enable"
   - Click "Save"

### 2. Update Database Security Rules

1. In Firebase Console: **Build → Realtime Database**
2. Go to **Rules** tab
3. Copy and paste the rules from `firebase-database-rules.json`
4. Click **Publish**

**What these rules do:**
- ✅ Require authentication for all reads/writes
- ✅ Allow any authenticated user (anonymous auth counts)
- ✅ Validate data structure
- ✅ Prevent unauthorized access

### 3. Test the Setup

**Local testing:**
```bash
npm run dev
```

Visit http://localhost:3000 - you should see a brief loading screen, then the game loads automatically.

**Check in Console:**
- Firebase Console → Authentication → Users
- You should see anonymous users appearing as people connect

## How It Works

### Anonymous Authentication
- **Seamless UX**: No login forms or passwords for players
- **Automatic**: Users are auto-authenticated on page load
- **Persistent**: Auth persists across page refreshes
- **Secure**: Still enforces Firebase security rules
- **Anonymous**: No personal information collected

### Security Benefits
✅ **Database protected**: Only authenticated users can read/write  
✅ **DDoS mitigation**: Firebase automatically rate-limits  
✅ **Abuse prevention**: Can ban specific user IDs if needed  
✅ **Production ready**: Meets security best practices  

## Firebase Console Quick Links

- **Authentication**: https://console.firebase.google.com/project/_/authentication/users
- **Database Rules**: https://console.firebase.google.com/project/_/database/rules
- **Database Data**: https://console.firebase.google.com/project/_/database/data
- **Usage & Billing**: https://console.firebase.google.com/project/_/usage

## Monitoring

### Check Auth Usage
Firebase Console → Authentication → Usage tab
- Monitor number of active users
- Check authentication methods used

### Check Database Usage
Firebase Console → Realtime Database → Usage tab
- Monitor storage (1GB free on Spark plan)
- Monitor downloads (10GB/month free)
- Monitor simultaneous connections (100 free)

## Troubleshooting

### Error: "Permission Denied"
1. Check Anonymous auth is enabled in Firebase Console
2. Check database rules are published
3. Clear browser cache and reload

### Error: "Auth Failed"
1. Check Firebase config in `.env.local`
2. Check internet connection
3. Check Firebase project is active

### Users Not Appearing
- Anonymous users only show in Firebase Console → Authentication after they connect
- They have auto-generated UIDs starting with random characters

## Upgrading to Email Authentication (Optional)

If you want team captains to have accounts later:

1. Enable Email/Password in Firebase Console → Authentication
2. Add sign-up/sign-in UI
3. Update security rules to differentiate team members vs captains

## Production Checklist

Before deploying to Netlify:

- [x] Anonymous auth enabled in Firebase
- [x] Database rules updated and published
- [x] App wrapped in FirebaseAuthProvider
- [x] `.env.local` configured correctly
- [ ] Test authentication flow locally
- [ ] Deploy to Netlify
- [ ] Test authentication on production URL
- [ ] Monitor Firebase usage after launch

## Cost Estimates

**Spark Plan (Free):**
- Up to 100 simultaneous connections
- 1GB storage
- 10GB/month downloads
- **Good for:** Up to ~50 active players

**Blaze Plan (Pay-as-you-go):**
- First 100 connections free, then $1/100K connections
- First 1GB storage free, then $5/GB/month
- First 10GB downloads free, then $1/GB
- **Good for:** Larger games, production apps

## Next Steps

1. ✅ Enable Anonymous Authentication in Firebase Console
2. ✅ Update database security rules
3. ✅ Test locally
4. 🔄 Deploy to Netlify (next section)
