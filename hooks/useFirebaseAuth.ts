"use client";

import { useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Hook to automatically authenticate users with Firebase Anonymous Auth
 * This enables Firebase security rules while maintaining seamless UX
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          // User is signed in
          setUser(currentUser);
          setLoading(false);
        } else {
          // No user, sign in anonymously
          try {
            const result = await signInAnonymously(auth);
            setUser(result.user);
            setLoading(false);
          } catch (err) {
            console.error("Anonymous auth failed:", err);
            setError(err instanceof Error ? err.message : "Auth failed");
            setLoading(false);
          }
        }
      },
      (err) => {
        console.error("Auth state change error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}
