'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, AuthErrorCodes } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChromeIcon } from 'lucide-react';
import { UserProfile, useAuth } from '@/context/AuthContext'; // Import UserProfile type and useAuth

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setAuthModalOpen } = useAuth(); // Get function to close modal

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Signup Failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!displayName.trim()) {
       toast({ title: 'Signup Failed', description: 'Display Name is required.', variant: 'destructive' });
       return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName });

      // Create user profile document in Firestore
      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        photoURL: user.photoURL, // Initially null for email/pass signup
        // Initialize other fields as needed
      };
      await setDoc(doc(db, 'profiles', user.uid), newUserProfile);

      toast({ title: 'Signup Successful', description: 'Welcome to Gyman!' });
      setAuthModalOpen(false); // Close modal on success
      router.push('/profile'); // Redirect to profile setup
    } catch (error: any) {
      console.error('Signup error:', error);
       let description = 'An error occurred during signup.';
       if (error.code === AuthErrorCodes.EMAIL_EXISTS) {
           description = 'This email address is already in use. Please log in or use a different email.';
       } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
           description = 'Password is too weak. Please choose a stronger password (at least 6 characters).';
       } else if (error.code === AuthErrorCodes.INVALID_EMAIL) {
            description = 'Invalid email address format.';
       } else if (error.message) {
            description = error.message;
       }
      toast({
        title: 'Signup Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

 const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists, if not, create one
      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileDocRef);

      if (!profileSnap.exists()) {
         const newUserProfile: Partial<UserProfile> = {
           uid: user.uid,
           email: user.email,
           displayName: user.displayName,
           photoURL: user.photoURL,
         };
        await setDoc(profileDocRef, newUserProfile, { merge: true }); // Use merge to ensure no data loss
        console.log("New user profile created/merged in Firestore from Google Sign-In.");
         toast({ title: 'Account Created', description: `Welcome, ${user.displayName}! Please complete your profile.` });
         setAuthModalOpen(false); // Close modal
         router.push('/profile'); // Redirect to profile setup for new Google users too
      } else {
         toast({ title: 'Google Sign-In Successful', description: `Welcome back, ${user.displayName}!` });
         setAuthModalOpen(false); // Close modal
         router.push('/dashboard'); // Redirect existing users to dashboard
      }

    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      // Handle specific errors like popup closed
      if (error.code === 'auth/popup-closed-by-user') {
           toast({
             title: 'Google Sign-In Cancelled',
             description: 'You closed the Google Sign-In window.',
             variant: 'default',
           });
      } else if (error.code === 'auth/cancelled-popup-request') {
             // Ignore this error, it happens if the user clicks the button again quickly
      } else if (error.code === 'auth/account-exists-with-different-credential') {
           toast({
             title: 'Account Exists',
             description: 'An account already exists with this email using a different sign-in method.',
             variant: 'destructive',
           });
      }
      else {
         toast({
           title: 'Google Sign-In Failed',
           description: error.message || 'An error occurred during Google Sign-In.',
           variant: 'destructive',
         });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="grid gap-4">
       <form onSubmit={handleSignup} className="grid gap-4">
         <div className="grid gap-2">
          <Label htmlFor="signup-displayName">Display Name</Label>
          <Input
            id="signup-displayName"
            type="text"
            placeholder="Your Name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            required
            minLength={6} // Basic password strength requirement
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
         <div className="grid gap-2">
          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
          <Input
            id="signup-confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
        {googleLoading ? (
          'Signing in...'
        ) : (
          <>
            <ChromeIcon className="mr-2 h-4 w-4" /> Google
          </>
        )}
      </Button>
    </div>
  );
}
