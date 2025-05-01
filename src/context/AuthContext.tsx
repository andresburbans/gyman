// @ts-nocheck
// TODO(you): Remove the ts-nocheck comment and fix the type errors. This may require installing new dependencies or fixing type errors in other files.
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, DocumentData } from 'firebase/firestore'; // Import onSnapshot

export type AuthModalView = 'login' | 'signup';

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null; // Add profile state
  isAuthModalOpen: boolean;
  setAuthModalOpen: Dispatch<SetStateAction<boolean>>;
  authModalView: AuthModalView;
  setAuthModalView: Dispatch<SetStateAction<AuthModalView>>;
  openAuthModal: (view?: AuthModalView) => void; // Helper function
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

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  profile: null,
  isAuthModalOpen: false,
  setAuthModalOpen: () => {},
  authModalView: 'login',
  setAuthModalView: () => {},
  openAuthModal: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');

  useEffect(() => {
    // If firebase auth is not initialized, don't attempt to listen
    if (!auth) {
        console.warn("Firebase Auth is not initialized. Skipping auth state changes.");
        setLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true); // Start loading when auth state might change
      setUser(user);
      setLoading(false); // Stop loading after setting user
      if (!user) {
          setProfile(null); // Clear profile if user logs out
      }
      // Profile fetching will be handled by the profile listener
    });

    // Cleanup auth subscription on unmount
    return () => unsubscribeAuth();
  }, []); // Run only once on mount

   useEffect(() => {
      // Fetch profile initially and set up listener
      let unsubscribeProfile: (() => void) | undefined;
      if (user && db) {
          setLoading(true); // Start loading when fetching profile
          const profileDocRef = doc(db, 'profiles', user.uid);
          unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
              } else {
                  // Handle case where profile might not exist yet
                   // If profile doesn't exist, create a temporary one from auth data
                   // This might happen briefly during signup before the profile doc is created
                   setProfile({
                     uid: user.uid,
                     email: user.email,
                     displayName: user.displayName,
                     photoURL: user.photoURL,
                   });
                  console.log("User profile not found in Firestore, using auth data. It might be created shortly.");
              }
              setLoading(false); // Stop loading after profile is fetched/updated
          }, (error) => {
              console.error("Error fetching/listening to user profile:", error);
               setProfile({ // Fallback to auth data on error
                   uid: user.uid,
                   email: user.email,
                   displayName: user.displayName,
                   photoURL: user.photoURL,
               });
              setLoading(false); // Stop loading on error
          });
      } else {
           setProfile(null); // Clear profile if no user or db
           setLoading(false); // Ensure loading is false if no user
      }

      // Cleanup profile listener on user change or unmount
      return () => {
          unsubscribeProfile?.();
      };
   }, [user]); // Rerun when user changes

  const openAuthModal = (view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const value = {
    user,
    loading,
    profile,
    isAuthModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    openAuthModal,
  };

  // Render children only if Firebase is initialized or loading is complete
  // This prevents downstream components from breaking if Firebase isn't ready
  // We check 'auth' which depends on the API key being present
  return <AuthContext.Provider value={value}>
           {auth || !loading ? children : <div>Loading Firebase...</div>}
         </AuthContext.Provider>;
};
