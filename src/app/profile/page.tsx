'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateAge } from '@/lib/utils'; // Import calculateAge utility

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [birthDate, setBirthDate] = useState<string>('');
  const [sex, setSex] = useState<'male' | 'female' | 'other' | undefined>(undefined);
  const [height, setHeight] = useState<number | ''>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [age, setAge] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialProfileLoaded, setInitialProfileLoaded] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login'); // Redirect if not logged in
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile && !initialProfileLoaded) {
      setDisplayName(profile.displayName || '');
      setBirthDate(profile.birthDate || '');
      setSex(profile.sex || undefined);
      setHeight(profile.height || '');
      if (profile.birthDate) {
         setAge(calculateAge(profile.birthDate));
      }
      setInitialProfileLoaded(true); // Mark initial load complete
    }
     // Recalculate age if birthDate changes client-side
     if (birthDate) {
       setAge(calculateAge(birthDate));
     } else {
       setAge(null);
     }
  }, [profile, birthDate, initialProfileLoaded]);


  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsSaving(true);

    const profileDataToSave: Partial<UserProfile> = {
      displayName: displayName || profile.displayName, // Keep existing if empty
      birthDate: birthDate || undefined, // Store as YYYY-MM-DD string or undefined
      sex: sex || undefined,
      height: height ? Number(height) : undefined,
    };

    try {
      const profileDocRef = doc(db, 'profiles', user.uid);
      await setDoc(profileDocRef, profileDataToSave, { merge: true }); // Merge ensures other fields aren't overwritten
      toast({ title: 'Profile Updated', description: 'Your profile information has been saved.' });
      // Optionally force context refresh or rely on Firestore listener
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save Failed',
        description: error.message || 'An error occurred while saving your profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !initialProfileLoaded) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="w-full max-w-2xl mx-auto">
           <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-3/4" />
           </CardHeader>
            <CardContent className="space-y-6">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
               <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user) return null; // Should be redirected, but added for safety

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="w-full max-w-2xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          <CardDescription>View and update your personal information. Some fields are set once.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-6">
             <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your preferred name"
                    disabled={isSaving}
                />
             </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email || ''} disabled readOnly />
               <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
            </div>
             <div className="grid gap-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={age ?? ''} disabled readOnly />
                <p className="text-xs text-muted-foreground">Age is calculated automatically from your Birth Date.</p>
             </div>

            <div className="grid gap-2">
              <Label htmlFor="birthDate">Birth Date</Label>
              <Input
                id="birthDate"
                type="date" // Use date input type
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                disabled={isSaving || !!profile?.birthDate} // Disable if already set
              />
               {profile?.birthDate && <p className="text-xs text-muted-foreground">Birth date can only be set once.</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={sex}
                onValueChange={(value: 'male' | 'female' | 'other') => setSex(value)}
                disabled={isSaving || !!profile?.sex} // Disable if already set
              >
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select your sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {profile?.sex && <p className="text-xs text-muted-foreground">Sex can only be set once.</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter your height in centimeters"
                min="0"
                step="0.1" // Allow decimals
                disabled={isSaving}
              />
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
