// @ts-nocheck
// TODO(you): Remove the ts-nocheck comment and fix the type errors. This may require installing new dependencies or fixing type errors in other files.
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, DocumentData } from 'firebase/firestore';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null; // Add profile state
}

// Define UserProfile type based on requirements
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  birthDate?: string; // Format 'YYYY-MM-DD'
  sex?: 'male' | 'female' | 'other';
  height?: number; // In cm
}

const AuthContext = createContext<AuthContextProps>({ user: null, loading: true, profile: null });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If firebase auth is not initialized, don't attempt to listen
    if (!auth) {
        console.warn("Firebase Auth is not initialized. Skipping auth state changes.");
        setLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);
      if (user && db) { // Check if db is also initialized
        // Fetch user profile from Firestore
        try {
            const profileDocRef = doc(db, 'profiles', user.uid);
            const profileSnap = await getDoc(profileDocRef);
            if (profileSnap.exists()) {
              setProfile({ uid: user.uid, ...profileSnap.data() } as UserProfile);
            } else {
              // Handle case where profile might not exist yet (e.g., during initial signup)
              setProfile({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              });
              console.log("User profile not found in Firestore, using auth data.");
            }
        } catch (error) {
             console.error("Error fetching user profile:", error);
             // Set basic profile from auth if Firestore fails
              setProfile({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              });
        }
      } else {
        setProfile(null); // Clear profile on logout or if db is unavailable
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    profile,
  };

  // Render children only if Firebase is initialized or loading is complete
  // This prevents downstream components from breaking if Firebase isn't ready
  return <AuthContext.Provider value={value}>
           {!loading || auth ? children : <div>Loading Firebase...</div>}
         </AuthContext.Provider>;
};
