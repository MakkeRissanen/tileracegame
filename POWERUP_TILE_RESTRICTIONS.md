# Powerup Tile Restrictions

This document outlines the rules and restrictions for using powerups that target tiles.

## General Rules

All tile-targeting powerups share these common restrictions:
- ❌ Cannot target hidden tiles (tiles not yet revealed by fog of war)
- ❌ Cannot target tiles where a team is currently standing (except for tiles targeted by offensive tactics)

## Powerup-Specific Restrictions

### Copy and Paste Current Tile (copypaste)
Copies the task from your current tile to a target tile.

**Restrictions:**
- ❌ Cannot use on tiles with teams standing on them
- ❌ Cannot use on your current tile
- ❌ Cannot use on tiles with **higher difficulty** than your current tile (can only target equal or lower difficulty)
- ❌ Cannot use on tiles that have reward powerups
- ❌ Cannot use on tiles that were already changed
- ✅ **CAN be used on doubled tiles (Retaliate Mechanic)** - spread the difficulty!

**Can Be Stacked With:**
- ✅ None when pasting (must paste to clean or doubled tiles only)
- ✅ Can copy FROM doubled tiles (retaliate mechanic)

**Other Powerups Can Be Used On Copied Tiles:**
- ✅ Double Tile powerup can be applied to a tile that was copied
- ⚠️ Once doubled, the tile cannot be modified further (except being copied FROM)

**Retaliate Mechanic:**
- 💡 If someone doubles a tile, you can copy that doubled tile to spread the difficulty to other tiles
- 💡 This allows strategic counter-play against Double Tile powerups

**Cannot Be Stacked With:****
- ❌ Another Copy and Paste (tile can only be copied once)
- ❌ Change Tile powerup
- ❌ Double Tile powerup (cannot paste onto already doubled tiles)

---

### Change Tile
Replaces a tile's task with a different one from the same difficulty pool.

**Restrictions:**
- ❌ Cannot use on tiles with teams standing on them
- ❌ Cannot use on the final tile (tile 56)
- ❌ Cannot use on tiles that were already changed once
- ❌ Cannot use on tiles that were already copied
- ❌ Cannot use on tiles that were already doubled

**Can Be Stacked With:**
- ✅ Double Tile powerup (but once doubled, no further modifications allowed)

**Cannot Be Stacked With:**
- ❌ Another Change Tile (tile can only be changed once)
- ❌ Copy and Paste powerup

---

### Double Tile Powerups (doubleEasy/Medium/Hard)
Doubles the completion requirements for a tile.

**Restrictions:**
- ❌ Cannot use on the final tile (tile 56)
- ❌ Must match the difficulty level (easy powerup only works on easy tiles, etc.)
- ❌ Cannot use on tiles that were already doubled
- ❌ Cannot use on tiles with teams standing on them

**Can Be Stacked With:**
- ✅ Copy and Paste powerup (can double a copied tile)
- ✅ Change Tile powerup (can double a changed tile)

**Important:** Once a tile is doubled, it becomes locked and **cannot be modified by any powerup** (copy, change, or double again).

**Cannot Be Stacked With:**
- ❌ Another Double Tile (tile can only be doubled once)

---

## Powerup Stacking Summary

Multiple powerups CAN be applied to the same tile with these rules:

### ✅ Allowed Combinations
- Change Tile + Double Tile
- Copy and Paste → then later Double Tile (double can be applied AFTER copy)
- Copy FROM doubled tile → Paste to another tile (retaliate mechanic)

### ❌ Forbidden Combinations
- Copy and Paste + Copy and Paste (same powerup type twice)
- Copy and Paste + Change Tile (these two cannot be stacked)
- Change Tile + Copy and Paste (these two cannot be stacked)
- Change Tile + Change Tile (same powerup type twice)
- Change Tile on doubled tiles (cannot change doubled tiles)
- Double Tile + Double Tile (same powerup type twice)
- Pasting TO an already doubled tile (target must be clean or have reward cleared)

### Key Principles
1. **Copy and Paste must target clean or doubled tiles** - cannot paste to tiles that have been changed, but CAN copy FROM doubled tiles
2. **Change Tile cannot be used on copied or doubled tiles** - must target relatively unmodified tiles
3. **Double Tile locks out Change Tile** - once doubled, cannot be changed, but can still be copied FROM
4. **Each powerup type can only be used once per tile**
5. **Retaliate Mechanic** - You can copy doubled tiles to spread difficulty, creating counter-play opportunities

---

## Visual Markers

When a tile has been affected by a powerup, it displays a badge:

- **Blue "Copied" badge** - Tile was targeted by Copy and Paste
- **Purple 🔄 badge** - Tile was targeted by Change Tile
- **Orange "2×" badge** - Tile was targeted by Double Tile

These badges help players identify which tiles have been modified and how.

---

## Code References

The tile selection logic is implemented in:
- `components/UsePowerupModal.tsx` - `canSelectTile()` function (lines 60-106)
- `lib/usePowerupHandler.ts` - Powerup execution logic
- `types/game.ts` - Powerup definitions with descriptions

**Last Updated:** December 21, 2025
