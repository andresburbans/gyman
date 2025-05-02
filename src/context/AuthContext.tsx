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
  setAuthModalOpen: () => { },
  authModalView: 'login',
  setAuthModalView: () => { },
  openAuthModal: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>({
    uid: '',
    email: null,
    displayName: null,
    photoURL: null,
  }); // Initialize profile with default values
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('login');

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth is not initialized. Skipping auth state changes.");
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        setProfile(null); // Clear profile if user logs out
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && db) {
      const profileDocRef = doc(db, 'profiles', user.uid);
      const unsubscribeProfile = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
        } else {
          setProfile({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        }
      });

      return () => unsubscribeProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  const openAuthModal = (view: AuthModalView = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

  const value = {
    user,
    loading: user === null, // Determine loading based on user existence
    profile, // Ensure profile is included in the context value
    isAuthModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    openAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider };
