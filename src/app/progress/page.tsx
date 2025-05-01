'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { measurementTypes, MeasurementType, MeasurementRecord } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label as RechartsLabel } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Define chart colors based on theme
const chartColors = {
  weight: "hsl(var(--chart-1))",
  waist: "hsl(var(--chart-2))",
  neck: "hsl(var(--chart-3))",
  shoulder: "hsl(var(--chart-4))",
  chest: "hsl(var(--chart-5))",
  leftBicep: "hsl(var(--chart-1))", // Reuse colors
  rightBicep: "hsl(var(--chart-2))",
  leftForearm: "hsl(var(--chart-3))",
  rightForearm: "hsl(var(--chart-4))",
  abdomen: "hsl(var(--chart-5))",
  hips: "hsl(var(--chart-1))",
  leftThigh: "hsl(var(--chart-2))",
  rightThigh: "hsl(var(--chart-3))",
  leftCalf: "hsl(var(--chart-4))",
  rightCalf: "hsl(var(--chart-5))",
};

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [measurementHistory, setMeasurementHistory] = useState<MeasurementRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

   // Fetch measurement history
  useEffect(() => {
    if (!user) {
        setLoadingHistory(false);
        setMeasurementHistory([]);
        return;
    };

    setLoadingHistory(true);
    const measurementsRef = collection(db, 'measurements');
    // Order by timestamp ascending for charts
    const q = query(
      measurementsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const history: MeasurementRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          userId: data.userId,
          date: data.date,
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

    return () => unsubscribe();
  }, [user, toast]);

  // Prepare data for charts
  const chartData = useMemo(() => {
    return measurementHistory.map(record => ({
      date: format(new Date(record.date), 'MMM d'), // Format date for X-axis
      ...record.measurements,
      bmi: record.bmi
    }));
  }, [measurementHistory]);

   // Prepare data for chart config
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {};
    Object.entries(measurementTypes).forEach(([key, { label }]) => {
      config[key] = {
        label: label,
        color: chartColors[key as MeasurementType] || "hsl(var(--foreground))", // Fallback color
      };
    });
     config["bmi"] = { label: "BMI", color: "hsl(var(--chart-1))" }; // Add BMI config
    return config;
  }, []);


   const getProgressIndicator = (type: MeasurementType | 'bmi') => {
    if (measurementHistory.length < 2) return null; // Need at least two records

    const latestRecord = measurementHistory[measurementHistory.length - 1];
    const previousRecord = measurementHistory[measurementHistory.length - 2];

    const latestValue = type === 'bmi' ? latestRecord.bmi : latestRecord.measurements[type];
    const previousValue = type === 'bmi' ? previousRecord.bmi : previousRecord.measurements[type];

    if (latestValue === undefined || previousValue === undefined || latestValue === null || previousValue === null) {
        return <span className="text-xs text-muted-foreground">No data</span>;
    }

    const difference = latestValue - previousValue;
    const differenceText = difference.toFixed(1); // Show one decimal place

    if (difference > 0) {
      return (
        <span className="flex items-center text-xs text-green-500">
          <TrendingUp className="h-3 w-3 mr-1" /> +{differenceText} {type !== 'bmi' ? measurementTypes[type as MeasurementType].unit : ''}
        </span>
      );
    } else if (difference < 0) {
       // For weight and BMI, decrease is often good, but for measurements it's bad.
       // We'll stick to red for decrease for now as per req.
      return (
        <span className="flex items-center text-xs text-red-500">
          <TrendingDown className="h-3 w-3 mr-1" /> {differenceText} {type !== 'bmi' ? measurementTypes[type as MeasurementType].unit : ''}
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-xs text-muted-foreground">
           <Minus className="h-3 w-3 mr-1" /> 0 - Ánimos! Necesitas crecer
        </span>
      );
    }
  };

  const renderChart = (title: string, types: (MeasurementType | 'bmi')[]) => {
     if (loadingHistory) {
        return <Skeleton className="h-[350px] w-full" />;
     }
     if (chartData.length < 2) {
         return <p className="text-center text-muted-foreground h-[350px] flex items-center justify-center">Not enough data to display {title.toLowerCase()} chart. Add at least two measurements.</p>;
     }

    const filteredConfig: ChartConfig = {};
    types.forEach(type => {
      if (chartConfig[type]) {
        filteredConfig[type] = chartConfig[type];
      }
    });

     return (
        <ChartContainer config={filteredConfig} className="min-h-[200px] w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}> {/* Adjust left margin */}
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
               <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    tickMargin={8}
                    fontSize={12}
                />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="hsl(var(--muted-foreground))"
                tickMargin={8}
                fontSize={12}
                // Consider adding domain="auto" or specific domain if needed
              >
                  {/* Add Y-axis Label */}
                 <RechartsLabel
                   value={title === 'Weight Chart' ? 'Kg' : 'cm / BMI'}
                   angle={-90}
                   position="insideLeft"
                   style={{ textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '12px' }}
                   offset={-5} // Adjust offset as needed
                 />
              </YAxis>
              <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
              <Legend />
              {types.map(type => (
                <Line
                  key={type}
                  dataKey={type}
                  type="monotone"
                  stroke={chartConfig[type]?.color || "hsl(var(--foreground))"}
                  strokeWidth={2}
                  dot={false}
                  name={chartConfig[type]?.label || type}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      );
   }

  if (authLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
         <Skeleton className="h-12 w-1/3 mb-4" />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[450px] w-full" />
            <Skeleton className="h-[450px] w-full" />
         </div>
         <Skeleton className="h-48 w-full mt-6" />
      </div>
    );
  }
  if (!user) return null;

  // Group measurements for the general chart (excluding weight)
  const generalMeasurementTypes = Object.keys(measurementTypes).filter(key => key !== 'weight') as MeasurementType[];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Weight Chart</CardTitle>
                <CardDescription>Weight (Kg) and BMI over time.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderChart("Weight Chart", ['weight', 'bmi'])}
            </CardContent>
         </Card>

         <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Body Measurements Chart</CardTitle>
                <CardDescription>Circumference measurements (cm) over time.</CardDescription>
            </CardHeader>
            <CardContent>
                {renderChart("Body Measurements Chart", generalMeasurementTypes)}
            </CardContent>
         </Card>
       </div>


       <Card className="shadow-md">
            <CardHeader>
                <CardTitle>Latest Progress</CardTitle>
                <CardDescription>Change between your last two measurements.</CardDescription>
            </CardHeader>
            <CardContent>
               {measurementHistory.length < 2 ? (
                 <p className="text-center text-muted-foreground">Add at least two measurements to see progress indicators.</p>
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {/* Weight Indicator */}
                   <div className="flex flex-col items-center p-3 border rounded-lg bg-card">
                     <span className="text-sm font-medium">{measurementTypes.weight.label}</span>
                     <span className="text-lg font-semibold">
                        {measurementHistory[measurementHistory.length - 1].measurements.weight ?? '-'} {measurementTypes.weight.unit}
                     </span>
                     {getProgressIndicator('weight')}
                   </div>
                    {/* BMI Indicator */}
                   <div className="flex flex-col items-center p-3 border rounded-lg bg-card">
                     <span className="text-sm font-medium">BMI</span>
                     <span className="text-lg font-semibold">
                        {measurementHistory[measurementHistory.length - 1].bmi ?? '-'}
                     </span>
                     {getProgressIndicator('bmi')}
                   </div>
                   {/* Other Measurement Indicators */}
                   {generalMeasurementTypes.map(type => (
                     <div key={type} className="flex flex-col items-center p-3 border rounded-lg bg-card">
                       <span className="text-sm font-medium">{measurementTypes[type].label}</span>
                       <span className="text-lg font-semibold">
                         {measurementHistory[measurementHistory.length - 1].measurements[type] ?? '-'} {measurementTypes[type].unit}
                       </span>
                       {getProgressIndicator(type)}
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
        </Card>

    </div>
  );
}
