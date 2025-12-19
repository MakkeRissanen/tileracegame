import { 
  signInAnonymously,
  updateProfile,
  User
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { auth, firestore } from "./firebase";

// User profile stored in Firestore
export interface UserProfile {
  uid: string;
  username: string;
  password: string; // Hashed (we'll use simple hash for demo)
  createdAt: number;
  role: "admin" | "player";
}

// Simple hash function (for demo - in production use bcrypt or similar)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Check if username exists
export async function checkUsernameExists(username: string): Promise<boolean> {
  const usersRef = collection(firestore, "users");
  const q = query(usersRef, where("username", "==", username.toLowerCase()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Sign up with username and password
export async function signUpWithUsername(
  username: string,
  password: string,
  role: "admin" | "player" = "player"
): Promise<{ user: User; profile: UserProfile } | { error: string }> {
  try {
    // Validate inputs
    if (!username || username.length < 3) {
      return { error: "Username must be at least 3 characters" };
    }
    if (!password || password.length < 6) {
      return { error: "Password must be at least 6 characters" };
    }

    // Check if username exists
    const exists = await checkUsernameExists(username);
    if (exists) {
      return { error: "Username already taken" };
    }

    // Create anonymous account
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: username });

    // Store user profile in Firestore
    const profile: UserProfile = {
      uid: user.uid,
      username: username.toLowerCase(),
      password: simpleHash(password),
      createdAt: Date.now(),
      role,
    };

    await setDoc(doc(firestore, "users", user.uid), profile);

    return { user, profile };
  } catch (error: any) {
    return { error: error.message || "Sign up failed" };
  }
}

// Sign in with username and password
export async function signInWithUsername(
  username: string,
  password: string
): Promise<{ user: User; profile: UserProfile } | { error: string }> {
  try {
    // Find user by username
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { error: "Invalid username or password" };
    }

    const profile = snapshot.docs[0].data() as UserProfile;

    // Verify password
    if (profile.password !== simpleHash(password)) {
      return { error: "Invalid username or password" };
    }

    // Sign in anonymously (reuse existing UID if possible)
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName: username });

    return { user, profile };
  } catch (error: any) {
    return { error: error.message || "Sign in failed" };
  }
}

// Sign out
export async function signOut() {
  return auth.signOut();
}

// Get current user profile
export async function getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(firestore, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}
