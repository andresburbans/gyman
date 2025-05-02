'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { measurementTypes, MeasurementType, MeasurementRecord, calculateBMI } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { PlusCircle } from 'lucide-react';

type MeasurementInputState = {
  [K in MeasurementType]?: string | number; // Allow string during input
};

export default function MeasurementsPage() {
  const { user, profile, loading: authLoading, openAuthModal } = useAuth(); // Get openAuthModal
  const router = useRouter();
  const { toast } = useToast();

  const [measurements, setMeasurements] = useState<MeasurementInputState>({});
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Redirect check removed, allow viewing but prompt login on action

  // Fetch measurement history
  useEffect(() => {
    if (!user) {
      setLoadingHistory(false); // No user, no history to load
      setMeasurementHistory([]); // Clear history if user logs out
      return;
    };

    setLoadingHistory(true);
    const measurementsRef = collection(db, 'measurements');
    const q = query(
      measurementsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc') // Order by timestamp descending (most recent first)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history: MeasurementRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          date: data.date, // Assuming date is stored correctly
          timestamp: data.timestamp,
          measurements: data.measurements,
          bmi: data.bmi,
        } as MeasurementRecord);
      });
      setMeasurementHistory(history);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error fetching measurement history: ", error);
      toast({ title: 'Error', description: 'Could not load measurement history.', variant: 'destructive' });
      setLoadingHistory(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, toast]);


  const handleInputChange = (type: MeasurementType, value: string) => {
    setMeasurements(prev => ({ ...prev, [type]: value }));
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      // If not logged in, open the login modal
      toast({ title: 'Login Required', description: 'Please log in or sign up to save measurements.', variant: 'default' });
      openAuthModal('login'); // Open login modal
      return;
    }
    if (!profile) {
      toast({ title: 'Profile Needed', description: 'Please complete your profile before adding measurements.', variant: 'destructive' });
      router.push('/profile'); // Redirect to profile page
      return;
    }
    if (Object.keys(measurements).length === 0) {
      toast({ title: 'No Data', description: 'Please enter at least one measurement.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    const now = new Date();
    const measurementsToSave: { [K in MeasurementType]?: number } = {};
    let hasValidMeasurement = false;

    // Convert input strings to numbers, validate
    for (const key in measurements) {
      const type = key as MeasurementType;
      const value = measurements[type];
      if (value !== undefined && value !== '') {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0) {
          measurementsToSave[type] = numValue;
          hasValidMeasurement = true;
        } else {
          toast({ title: 'Invalid Input', description: `Invalid value for ${measurementTypes[type].label}. Please enter a non-negative number.`, variant: 'destructive' });
          setIsSaving(false);
          return; // Stop saving if any input is invalid
        }
      }
    }

    if (!hasValidMeasurement) {
      toast({ title: 'No Data', description: 'Please enter at least one valid measurement.', variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    // Calculate BMI if weight and height are available
    const currentWeight = measurementsToSave.weight;
    const userHeight = profile.height;
    const calculatedBmi = calculateBMI(currentWeight, userHeight);


    const newRecord = {
      userId: user.uid,
      date: now.toISOString().split('T')[0], // Formato YYYY-MM-DD
      timestamp: now.getTime(),
      measurements: measurementsToSave,
      bmi: calculatedBmi,
    };

    try {
      await addDoc(collection(db, 'measurements'), newRecord); // Guardar en 'measurements'
      toast({ title: 'Success', description: 'Measurements saved successfully.' });
      setMeasurements({}); // Clear form after saving
      router.push('/progress'); // Redirige a progreso tras guardar
    } catch (error: any) {
      console.error("Error adding measurement: ", error);
      toast({ title: 'Error', description: 'Could not save measurements.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderHistoryTable = () => {
    if (loadingHistory && user) { // Only show skeleton if logged in and loading
      return (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }

    if (!user) {
      return <p className="text-center text-muted-foreground">Log in to view your measurement history.</p>;
    }

    if (measurementHistory.length === 0) {
      return <p className="text-center text-muted-foreground">No measurement history yet. Add your first measurement above!</p>;
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {Object.entries(measurementTypes).map(([key, { label }]) => (
                <TableHead key={key} className="text-right">{label}</TableHead>
              ))}
              <TableHead className="text-right">BMI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurementHistory.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{format(new Date(record.date), 'PP')}</TableCell>
                {Object.keys(measurementTypes).map((key) => (
                  <TableCell key={key} className="text-right">
                    {record.measurements[key as MeasurementType] !== undefined
                      ? `${record.measurements[key as MeasurementType]} ${measurementTypes[key as MeasurementType].unit}`
                      : '-'}
                  </TableCell>
                ))}
                <TableCell className="text-right">{record.bmi ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };


  if (authLoading && !user) { // Show skeleton only when initially checking auth state
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" /> Add New Measurement
          </CardTitle>
          <CardDescription>
            Enter your current measurements. Only filled fields will be saved for {format(new Date(), 'PPP')}. BMI is calculated if height is set in your profile and weight is entered. Log in to save.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAddMeasurement}>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(measurementTypes).map(([key, { label, unit }]) => (
              <div key={key} className="grid gap-1.5">
                <Label htmlFor={key}>{`${label} (${unit})`}</Label>
                <Input
                  id={key}
                  type="number"
                  step="0.1" // Allow decimals
                  min="0"
                  placeholder={`Current ${label.toLowerCase()}`}
                  value={measurements[key as MeasurementType] ?? ''}
                  onChange={(e) => handleInputChange(key as MeasurementType, e.target.value)}
                  disabled={isSaving}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : (user ? 'Save Measurement' : 'Log In to Save')}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Measurement History</CardTitle>
          <CardDescription>Your recorded measurements over time.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderHistoryTable()}
        </CardContent>
      </Card>

    </div>
  );
}
