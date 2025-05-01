'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ChromeIcon } from 'lucide-react';
import { UserProfile } from '@/context/AuthContext'; // Import UserProfile type

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // Add display name state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

      toast({ title: 'Signup Successful', description: 'Welcome to LiftBuddy!' });
      router.push('/profile'); // Redirect to profile setup after signup
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An error occurred during signup.',
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
         router.push('/profile'); // Redirect to profile setup for new Google users too
      } else {
         toast({ title: 'Google Sign-In Successful', description: `Welcome back, ${user.displayName}!` });
         router.push('/dashboard'); // Redirect existing users to dashboard
      }

    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast({
        title: 'Google Sign-In Failed',
        description: error.message || 'An error occurred during Google Sign-In.',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Enter your details to sign up for LiftBuddy</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
           <form onSubmit={handleSignup} className="grid gap-4">
             <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your Name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading || googleLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6} // Basic password strength requirement
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
              />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
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
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary hover:text-primary/80">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
