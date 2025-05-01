'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ChromeIcon } from 'lucide-react'; // Using Chrome icon for Google
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/context/AuthContext'; // Import UserProfile type

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard'); // Redirect to dashboard after successful login
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred during login.',
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
           // Initialize other fields as needed, leave optional ones undefined
         };
        await setDoc(profileDocRef, newUserProfile, { merge: true }); // Use merge to avoid overwriting existing data if somehow created concurrently
        console.log("New user profile created in Firestore from Google Sign-In.");
      }


      toast({ title: 'Google Sign-In Successful', description: `Welcome, ${user.displayName}!` });
      router.push('/dashboard'); // Redirect to dashboard
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
          <CardTitle className="text-2xl">Login to LiftBuddy</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin} className="grid gap-4">
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
        </CardContent>
         <CardFooter className="flex flex-col space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline text-primary hover:text-primary/80">
                Sign up
              </Link>
            </p>
             {/* Optional: Add forgot password link here */}
             {/* <Link href="/forgot-password" className="underline text-sm text-muted-foreground hover:text-primary">
              Forgot password?
            </Link> */}
          </CardFooter>
      </Card>
    </div>
  );
}
