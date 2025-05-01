'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { MeasurementRecord, measurementTypes, calculateAge, calculateBMI } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, Dumbbell, LineChart, User, Ruler, Activity } from 'lucide-react'; // Import Ruler for BMI
import { format } from 'date-fns';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const chartConfig = {
  weight: { label: "Weight", color: "hsl(var(--chart-1))" },
  bmi: { label: "BMI", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [latestMeasurement, setLatestMeasurement] = useState<MeasurementRecord | null>(null);
  const [recentHistory, setRecentHistory] = useState<MeasurementRecord[]>([]); // For mini chart
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch latest measurement and recent history
  useEffect(() => {
    if (!user) {
        setLoadingData(false);
        setLatestMeasurement(null);
        setRecentHistory([]);
        return;
    }

    setLoadingData(true);
    const measurementsRef = collection(db, 'measurements');

    // Query for the latest measurement
    const latestQuery = query(
      measurementsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    // Query for recent history (e.g., last 7 entries for mini-chart)
    const historyQuery = query(
      measurementsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc') // Ascending for chart
      // limit(7) // Optional: Limit the history for performance
    );


    let latestUnsubscribe: () => void;
    let historyUnsubscribe: () => void;
    let dataLoadedCount = 0;
    const totalQueries = 2;

    const checkLoadingComplete = () => {
        dataLoadedCount++;
        if (dataLoadedCount === totalQueries) {
            setLoadingData(false);
        }
    };


    latestUnsubscribe = onSnapshot(latestQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setLatestMeasurement({ id: snapshot.docs[0].id, ...data } as MeasurementRecord);
      } else {
        setLatestMeasurement(null);
      }
       checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching latest measurement: ", error);
      toast({ title: 'Error', description: 'Could not load latest measurement.', variant: 'destructive' });
       checkLoadingComplete();
    });


    historyUnsubscribe = onSnapshot(historyQuery, (snapshot) => {
        const history: MeasurementRecord[] = [];
        snapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as MeasurementRecord);
        });
        setRecentHistory(history);
         checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching recent history: ", error);
      toast({ title: 'Error', description: 'Could not load recent history.', variant: 'destructive' });
       checkLoadingComplete();
    });


    // Cleanup listeners
    return () => {
      latestUnsubscribe?.();
      historyUnsubscribe?.();
    };
  }, [user, toast]);

  const userAge = useMemo(() => profile?.birthDate ? calculateAge(profile.birthDate) : null, [profile]);
  const currentBMI = latestMeasurement?.bmi ?? calculateBMI(latestMeasurement?.measurements.weight, profile?.height); // Recalculate if needed or use stored

  const miniChartData = useMemo(() => {
     // Take last N entries for the chart if needed, e.g., last 7
     const dataToShow = recentHistory.slice(-7);
    return dataToShow.map(record => ({
      date: format(new Date(record.date), 'MMM d'),
      weight: record.measurements.weight,
      bmi: record.bmi
    }));
  }, [recentHistory]);


  if (authLoading || loadingData) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-6">
         <Skeleton className="h-8 w-1/2 mb-4" />
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
         </div>
          <div className="grid gap-4 md:grid-cols-2">
             <Skeleton className="h-64" />
             <Skeleton className="h-64" />
          </div>
      </div>
    );
  }
  if (!user) return null;


  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.displayName || 'User'}!</h1>

      {/* Key Metrics Cards */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestMeasurement?.measurements.weight ? `${latestMeasurement.measurements.weight} Kg` : 'N/A'}
            </div>
             <p className="text-xs text-muted-foreground">
                {latestMeasurement ? `Last updated: ${format(new Date(latestMeasurement.date), 'PP')}` : 'No measurements yet'}
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current BMI</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{currentBMI ?? 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.height ? `Based on height: ${profile.height} cm` : 'Height needed in profile'}
             </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Age</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{userAge ?? 'N/A'}</div>
             <p className="text-xs text-muted-foreground">
                {profile?.birthDate ? `Born ${format(new Date(profile.birthDate), 'PPP')}` : 'Birth date needed in profile'}
             </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Measured Chest</CardTitle> {/* Example */}
             <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">
                 {latestMeasurement?.measurements.chest ? `${latestMeasurement.measurements.chest} cm` : 'N/A'}
             </div>
             <p className="text-xs text-muted-foreground">
                 {latestMeasurement ? `From ${format(new Date(latestMeasurement.date), 'PP')}` : 'No measurements yet'}
             </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Actions */}
       <div className="grid gap-4 md:grid-cols-2">
         <Card>
            <CardHeader>
             <CardTitle>Recent Weight Trend</CardTitle>
             <CardDescription>Your weight and BMI over the last few entries.</CardDescription>
            </CardHeader>
             <CardContent className="h-[250px]"> {/* Fixed height for consistency */}
                {miniChartData.length > 1 ? (
                     <ChartContainer config={chartConfig} className="w-full h-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <RechartsLineChart data={miniChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}> {/* Adjust margins */}
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                tickMargin={8}
                                fontSize={10} // Smaller font for mini chart
                            />
                            <YAxis
                                yAxisId="left"
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                tickMargin={8}
                                fontSize={10}
                                // domain={['auto', 'auto']} // Auto domain for weight
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                tickLine={false}
                                axisLine={false}
                                stroke="hsl(var(--muted-foreground))"
                                tickMargin={8}
                                fontSize={10}
                                // domain={['auto', 'auto']} // Auto domain for BMI
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                                />
                            <Line
                                yAxisId="left"
                                dataKey="weight"
                                type="monotone"
                                stroke={chartConfig.weight.color}
                                strokeWidth={2}
                                dot={false}
                                name="Weight (Kg)"
                            />
                            <Line
                                yAxisId="right"
                                dataKey="bmi"
                                type="monotone"
                                stroke={chartConfig.bmi.color}
                                strokeWidth={2}
                                dot={false}
                                name="BMI"
                            />
                         </RechartsLineChart>
                       </ResponsiveContainer>
                     </ChartContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                     <p className="text-muted-foreground">Not enough data for trend chart.</p>
                  </div>
                )}
             </CardContent>
         </Card>

          <Card>
            <CardHeader>
             <CardTitle>Quick Actions</CardTitle>
             <CardDescription>Navigate to key sections of the app.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-3">
                 <Button asChild variant="outline">
                    <Link href="/measurements" className="flex items-center justify-between w-full">
                       <span>Add/View Measurements</span>
                       <ArrowUpRight className="h-4 w-4" />
                    </Link>
                 </Button>
                 <Button asChild variant="outline">
                    <Link href="/progress" className="flex items-center justify-between w-full">
                       <span>View Full Progress</span>
                       <LineChart className="h-4 w-4" />
                    </Link>
                 </Button>
                  <Button asChild variant="outline">
                    <Link href="/profile" className="flex items-center justify-between w-full">
                       <span>Update Profile</span>
                       <User className="h-4 w-4" />
                    </Link>
                 </Button>
            </CardContent>
         </Card>
       </div>

       {/* Optional: Maybe add a section for Goals or recent achievements later */}

    </div>
  );
}
