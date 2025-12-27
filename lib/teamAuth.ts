import { ref, get } from "firebase/database";
import { database } from "./firebase";
import { Team } from "@/types/game";

// Simple hash function (consistent with existing auth system)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Verify team credentials without loading full game state
export async function verifyTeamCredentials(
  gameId: string,
  teamName: string,
  password: string
): Promise<{ success: true; team: Team } | { success: false; error: string }> {
  try {
    // Load only the teams data from Firebase
    const teamsRef = ref(database, `games/${gameId}/teams`);
    const snapshot = await get(teamsRef);
    
    if (!snapshot.exists()) {
      return { success: false, error: "No teams found" };
    }

    const teams = snapshot.val() as Record<string, Team>;
    const teamsArray = Object.values(teams);
    
    // Find team by name (case-insensitive)
    const team = teamsArray.find(
      (t) => t.name.toLowerCase() === teamName.toLowerCase()
    );

    if (!team) {
      return { success: false, error: "Team not found" };
    }

    // Verify password
    if (!team.password) {
      return { success: false, error: "Team has no password set" };
    }

    if (team.password !== password) {
      return { success: false, error: "Invalid password" };
    }

    return { success: true, team };
  } catch (error: any) {
    console.error("Team verification error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// Verify admin password
export async function verifyAdminPassword(
  password: string
): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Admin verification error:", error);
    return false;
  }
}
