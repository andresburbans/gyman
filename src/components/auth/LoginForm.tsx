'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, AuthErrorCodes } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChromeIcon } from 'lucide-react'; // Using Chrome icon for Google
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile, useAuth } from '@/context/AuthContext'; // Import UserProfile type and useAuth

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setAuthModalOpen } = useAuth(); // Get function to close modal

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ title: 'Error', description: 'Firebase Auth not initialized.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      setAuthModalOpen(false); // Cierra el modal antes de navegar
      // Espera un ciclo de render para asegurar cierre visual
      setTimeout(() => router.push('/measurements'), 100);
    } catch (error: any) {
      console.error('Login error:', error);
      let description = 'An error occurred during login.';
      if (error.code === AuthErrorCodes.INVALID_LOGIN_CREDENTIALS) {
        description = 'Invalid email or password. Please try again.';
      } else if (error.code === AuthErrorCodes.USER_DELETED) {
        description = 'This user account has been deleted.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        title: 'Login Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !db) {
      toast({ title: 'Error', description: 'Firebase not initialized.', variant: 'destructive' });
      return;
    }
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists, if not, create one
      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileDocRef);
      // Check if the profile document exists
      if (!profileSnap.exists()) {
        const newUserProfile: Partial<UserProfile> = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          // Initialize other fields as needed, leave optional ones undefined
        };
        await setDoc(profileDocRef, newUserProfile, { merge: true }); // Use merge to avoid overwriting
        console.log("New user profile created in Firestore from Google Sign-In.");
        toast({ title: 'Google Sign-In Successful', description: `Welcome, ${user.displayName}! Please complete your profile.` });
        setAuthModalOpen(false); // Cierra el modal antes de navegar
        setTimeout(() => router.push('/profile'), 100);
      } else {
        toast({ title: 'Google Sign-In Successful', description: `Welcome back, ${user.displayName}!` });
        setAuthModalOpen(false); // Cierra el modal antes de navegar
        setTimeout(() => router.push('/dashboard'), 100);
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
      } else {
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
      <form onSubmit={handleLogin} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || googleLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || googleLoading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
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
      {/* Optional: Add forgot password link here */}
      {/* <div className="text-center text-sm">
           <Link href="/forgot-password" // Update if you implement this
                 className="underline text-muted-foreground hover:text-primary">
            Forgot password?
           </Link>
       </div> */}
    </div>
  );
}
