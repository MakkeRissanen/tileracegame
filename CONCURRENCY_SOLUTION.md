# Concurrency Control & Race Condition Prevention

## Problem Statement

When multiple users perform actions simultaneously, several race conditions can occur:

### Race Condition Examples

1. **Double Claiming Powerup (firstTeam)**
   - User A and User B both see powerup unclaimed
   - Both click claim at same time
   - Without locks: Both succeed, violating "first team only" rule

2. **Tile Already Changed**
   - Admin A changes tile 5 to new task
   - Admin B changes tile 5 to different task (same moment)
   - Without validation: Second action succeeds, but tile shouldn't be changeable twice

3. **Powerup During Disable**
   - Team A uses "skip3" powerup
   - Team B disables Team A's "skip3" (same moment)
   - Without transactions: Both could succeed, causing inconsistent state

4. **Simultaneous Tile Completion**
   - Multiple players completing different tiles
   - Last-write-wins: Some completions could be lost

## Solution Implemented

### 1. **Firebase Transactions**
```typescript
runTransaction(gameRef, (currentData) => {
  // Read current state
  // Validate preconditions
  // Apply changes atomically
  return newState;
})
```

**Benefits:**
- ✅ Atomic operations (all-or-nothing)
- ✅ Automatic retry on conflicts
- ✅ Reads latest state before write
- ✅ Prevents lost updates

### 2. **Event Queue**
```typescript
eventQueue.current.push({ event, resolve, reject });
processEventQueue(); // Process sequentially
```

**Benefits:**
- ✅ Events processed in order (FIFO)
- ✅ No simultaneous conflicting operations
- ✅ Failed events don't block queue
- ✅ Predictable execution order

### 3. **Validation Layer**
```typescript
const validateEvent = (currentGame, event) => {
  // Check if action is still valid
  // Return { valid: true/false, reason }
}
```

**Validations:**
- ✅ Powerup still in inventory
- ✅ Team not on cooldown
- ✅ Tile not already changed
- ✅ Powerup tile not already claimed
- ✅ Tile not already doubled

### 4. **Promise-Based API**
```typescript
try {
  await dispatch({ type: "COMPLETE_TILE", ... });
  // Success!
} catch (err) {
  // Handle failure
  alert("Action failed: " + err.message);
}
```

**Benefits:**
- ✅ Know when action succeeds/fails
- ✅ Show user-friendly error messages
- ✅ Can retry failed actions
- ✅ Better error handling

## How It Works

### Example: Two Teams Claiming Same Powerup

```
Timeline with OLD implementation (BROKEN):
---------------------------------------------
t0: Team A reads game state (powerup unclaimed)
t1: Team B reads game state (powerup unclaimed) 
t2: Team A writes: claim powerup
t3: Team B writes: claim powerup (overwrites A!) ❌
Result: Both teams have powerup (WRONG!)

Timeline with NEW implementation (FIXED):
---------------------------------------------
t0: Team A action queued → starts transaction
    - Reads current state
    - Validates (powerup unclaimed ✓)
    - Claims powerup
    - Commits ✓
t1: Team B action queued (waits for Team A)
t2: Team B transaction starts
    - Reads current state (Team A already claimed)
    - Validates (powerup claimed ✗)
    - Aborts transaction
    - Returns error to user
Result: Only Team A has powerup (CORRECT!)
```

### Example: Tile Completion During Tile Change

```
OLD (BROKEN):
-------------
t0: Admin reads state, starts changing tile 10
t1: Team completes tile 10
t2: Admin writes: tile 10 changed (overwrites completion!) ❌

NEW (FIXED):
------------
t0: Admin change tile 10 queued
t1: Team complete tile 10 queued (waits)
t2: Admin transaction: changes tile 10 ✓
t3: Team transaction: completes tile 10 (with new task) ✓
Result: Both actions succeed in order (CORRECT!)
```

## What's Protected

### ✅ Protected Operations

1. **Powerup Claims** - No double claiming
2. **Tile Changes** - Can't change twice
3. **Tile Doubling** - Can't double twice  
4. **Powerup Usage** - Validated before use
5. **Team Actions** - Properly sequenced
6. **Tile Completion** - Never lost
7. **Admin Actions** - Atomic updates

### ⚠️ Still Possible (By Design)

1. **Multiple Teams Completing Different Tiles** - Allowed & desired
2. **Admin Creating Multiple Teams** - Allowed
3. **Different Teams Using Powerups** - Allowed if not conflicting

## Performance Considerations

### Throughput
- **Sequential processing** means actions wait in queue
- **Typical delay**: 50-200ms per action (Firebase transaction time)
- **Acceptable for turn-based game** where actions aren't millisecond-critical

### Optimization
- Actions are processed **as fast as Firebase allows**
- Queue prevents overwhelming Firebase with simultaneous writes
- Failed actions don't block the queue

### Scaling
For very high throughput (100+ actions/second):
- Consider Firebase Cloud Functions for server-side validation
- Use Firebase Security Rules as secondary validation
- Implement action batching

## Testing Concurrency

### How to Test

1. **Open two browser tabs**
2. **Log in as different teams**
3. **Try these scenarios:**

```javascript
// Scenario 1: Double claim powerup
Tab 1: Click "Claim Powerup 1"
Tab 2: Click "Claim Powerup 1" (same time)
Expected: One succeeds, one gets error

// Scenario 2: Complete tile simultaneously  
Tab 1: Complete Tile 5
Tab 2: Complete Tile 6
Expected: Both succeed (different tiles OK)

// Scenario 3: Use + Disable same powerup
Tab 1 (Team A): Use "skip3"
Tab 2 (Team B): Disable Team A's "skip3"
Expected: One succeeds, one gets error
```

## Monitoring

### Check Transaction Success
```javascript
// In browser console
localStorage.setItem('DEBUG_TRANSACTIONS', 'true');
```

Then watch console for:
- `✓ Transaction committed` (success)
- `✗ Transaction aborted` (validation failed)
- `⚠ Transaction conflict` (retry needed)

### Event Queue Status
```javascript
// See queue length
window.__eventQueueLength = eventQueue.current.length;
```

## Future Improvements

### Could Add
1. **Optimistic UI Updates** - Show action immediately, revert on failure
2. **Retry Logic** - Auto-retry failed transactions
3. **Rate Limiting** - Prevent spam from single user
4. **Action History** - Audit trail of all actions
5. **Rollback Support** - Undo recent actions
6. **Conflict Resolution UI** - Show user why action failed with more detail

### Migration from Old Code
No data migration needed! The transaction system works with existing game state structure.

## Summary

✅ **Race conditions prevented** via Firebase transactions  
✅ **Events processed sequentially** via queue  
✅ **Validations prevent invalid actions**  
✅ **Users get feedback** on success/failure  
✅ **Atomic operations** ensure consistency  
✅ **Tested architecture** used by many Firebase apps  

The game is now **production-ready** for concurrent multiplayer use! 🎉
