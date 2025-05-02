'use client';

import React, { useState } from 'react';
import { format } from "date-fns";
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, updateProfile, AuthErrorCodes } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChromeIcon } from 'lucide-react';
import { UserProfile, useAuth } from '@/context/AuthContext'; // Import UserProfile type and useAuth

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Initial info, 2: Account details

  const router = useRouter();
  const { toast } = useToast();
  const { setAuthModalOpen } = useAuth(); // Get function to close modal

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Signup Failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!name.trim()) {
      toast({ title: 'Signup Failed', description: 'Name is required.', variant: 'destructive' });
      return;
    }
    if (!dateOfBirth) {
      toast({ title: 'Signup Failed', description: 'Date of Birth is required.', variant: 'destructive' });
      return;
    }
    if (!gender) {
      toast({ title: 'Signup Failed', description: 'Gender is required.', variant: 'destructive' });
      return;
    }
    if (!auth || !db) {
      toast({ title: 'Error', description: 'Firebase not initialized.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      const newUserProfile = {
        displayName: name,
        email: user.email,
        photoURL: user.photoURL,
        birthDate: dateOfBirth.toISOString().split('T')[0], // Formato YYYY-MM-DD
        sex: gender,
        height: null, // Altura inicial como null
      };
      await setDoc(doc(db, 'users', user.uid), newUserProfile, { merge: true }); // Guardar en 'users'
      toast({ title: 'Signup Successful', description: 'Welcome to Gyman!' });
      setAuthModalOpen(false); // Cierra el modal antes de navegar
      setTimeout(() => router.push('/measurements'), 100);
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
    if (!auth || !db) {
      toast({ title: 'Error', description: 'Firebase not initialized.', variant: 'destructive' });
      return;
    }
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileDocRef);
      if (!profileSnap.exists()) {
        const newUserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        await setDoc(profileDocRef, newUserProfile, { merge: true });
        console.log("New user profile created/merged in Firestore from Google Sign-In.");
        toast({ title: 'Account Created', description: `Welcome, ${user.displayName}! Please complete your profile.` });
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

  const handleNext = () => {
    if (!name.trim()) {
      toast({ title: 'Information Required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }
    if (!dateOfBirth) {
      toast({ title: 'Information Required', description: 'Please select your date of birth.', variant: 'destructive' });
      return;
    }
    if (!gender) {
      toast({ title: 'Information Required', description: 'Please select your gender.', variant: 'destructive' });
      return;
    }
    router.push('/measurements');
    setAuthModalOpen(false); // Close modal after navigating
  };

  return (
    <div className="grid gap-4">
      {step === 1 ? (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-bold">We need to get to know you better!</h2>
            <p className="text-muted-foreground text-sm">For a personalized experience, please enter your date of birth and gender.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              {/* Popover para seleccionar la fecha de nacimiento */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                {/* Centra el calendario dentro del popup usando flex y mx-auto */}
                <PopoverContent className="w-auto p-0 flex justify-center items-center mx-auto">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                    captionLayout="dropdown-buttons" // Habilita los dropdowns de mes y año
                    fromYear={1900} // Año mínimo
                    toYear={new Date().getFullYear()} // Año máximo
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => setGender(value)} value={gender}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="w-full" onClick={handleNext}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSignup} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            {/* Allow modification */}
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading || googleLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            {/* Popover para seleccionar la fecha de nacimiento */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateOfBirth && "text-muted-foreground"
                  )}
                  disabled={loading || googleLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              {/* Centra el calendario dentro del popup usando flex y mx-auto */}
              <PopoverContent className="w-auto p-0 flex justify-center items-center mx-auto">
                <Calendar
                  mode="single"
                  selected={dateOfBirth}
                  onSelect={setDateOfBirth}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="gender">Gender</Label>
            {/* Allow modification */}
            <Select onValueChange={(value) => setGender(value)} value={gender} disabled={loading || googleLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
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
      )}
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
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading || step === 1}> {/* Disable Google sign-up in the first step */}
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
