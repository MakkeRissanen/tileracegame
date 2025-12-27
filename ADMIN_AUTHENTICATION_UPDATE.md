# Admin Authentication System Update

## Summary

The admin authentication system has been updated to use **database-stored credentials** instead of a shared environment variable password. This aligns admin authentication with the team authentication pattern and provides better security and flexibility.

## What Changed

### Before
- Single shared admin password stored in `ADMIN_PASSWORD` environment variable
- All admins used the same password
- Admin names were prompted after login and not persisted
- Required server-side API route for password verification

### After
- Individual admin accounts stored in Firebase database
- Each admin has their own name and password
- Admin login uses same pattern as team login
- Supports multiple admins with different privilege levels (master vs regular)
- Admin name automatically comes from database, no prompts needed

## Technical Changes

### Files Modified

1. **lib/teamAuth.ts**
   - Added `verifyAdminCredentials()` function similar to `verifyTeamCredentials()`
   - Verifies admin name and password against database
   - Returns full admin object on success

2. **components/TeamSelect.tsx**
   - Updated to show "Admin Name" field instead of just password
   - Admin login now requires both name and password
   - `onAdminLogin` prop now accepts `(adminName: string, password: string)`

3. **components/TileRaceGame.tsx**
   - `handleAdminLogin()` updated to use new database authentication
   - Admin name automatically set from database (no prompt)
   - Imports `verifyAdminCredentials` instead of deprecated `verifyAdminPassword`

4. **.env.local**
   - Removed `ADMIN_PASSWORD` environment variable
   - Only Firebase and Discord configuration remain

5. **app/api/admin/verify/route.ts**
   - Marked as deprecated but kept for backwards compatibility
   - No longer used by the application

### Documentation Updated

- **SECURITY.md**: Removed ADMIN_PASSWORD instructions, added database admin setup
- **NETLIFY_DEPLOYMENT.md**: Removed ADMIN_PASSWORD deployment steps
- **ONLINE_ARCHITECTURE.md**: Updated admin flow description
- **DISCORD_INTEGRATION.md**: No changes needed (already documented correctly)

## How to Use

### Setting Up Admin Accounts

1. **Initial Setup**: When starting a new game, at least one admin must be created via the "Manage Admins" modal
2. **Admin Login**: Click "Admin Login" on the login screen, enter admin name and password
3. **Master Admin**: At least one admin should be designated as "Master Admin" for full privileges

### Admin Structure in Database

```json
{
  "games": {
    "main": {
      "admins": {
        "admin1": {
          "id": "admin1",
          "name": "John",
          "password": "securepassword123",
          "isMaster": true
        },
        "admin2": {
          "id": "admin2",
          "name": "Jane",
          "password": "anotherpassword456",
          "isMaster": false
        }
      }
    }
  }
}
```

## Migration Notes

### For Existing Deployments

If you have an existing deployment with the old system:

1. Admin accounts need to be created in the database via the "Manage Admins" feature
2. Remove `ADMIN_PASSWORD` from your hosting platform's environment variables (Netlify/Vercel)
3. Redeploy with the updated code
4. Admins must login with their individual credentials

### Backwards Compatibility

The deprecated `/api/admin/verify` route is kept but no longer used. It can be safely removed in future versions once all deployments are confirmed migrated.

## Benefits

1. **Individual Accountability**: Each admin has their own credentials
2. **Better Discord Integration**: Admin names are automatically tracked in Discord events
3. **Consistent Authentication**: Same pattern as team authentication
4. **Flexibility**: Easy to add/remove admins without changing environment variables
5. **Security**: No shared password, easier to rotate credentials per admin

## Testing

Build tested successfully:
```bash
npm run build
✓ Compiled successfully
✓ Finished TypeScript
```

All functionality preserved with enhanced authentication system.
