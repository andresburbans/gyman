import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates age based on a birth date string (YYYY-MM-DD).
 * @param birthDateString - The birth date in 'YYYY-MM-DD' format.
 * @returns The calculated age in years, or null if the input is invalid.
 */
export function calculateAge(birthDateString: string): number | null {
  try {
    const birthDate = new Date(birthDateString);
    // Check if the date is valid (Date constructor can return 'Invalid Date')
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null; // Return null or handle error as appropriate
  }
}

/**
 * Calculates Body Mass Index (BMI).
 * @param weightKg - Weight in kilograms.
 * @param heightCm - Height in centimeters.
 * @returns The calculated BMI, or null if inputs are invalid.
 */
export function calculateBMI(weightKg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightM = heightCm / 100; // Convert height to meters
  const bmi = weightKg / (heightM * heightM);
  return parseFloat(bmi.toFixed(1)); // Return BMI rounded to one decimal place
}

// Define measurement types and their labels/units
export const measurementTypes = {
  weight: { label: 'Weight', unit: 'Kg' },
  waist: { label: 'Waist', unit: 'cm' },
  neck: { label: 'Neck', unit: 'cm' },
  shoulder: { label: 'Shoulder', unit: 'cm' },
  chest: { label: 'Chest', unit: 'cm' },
  leftBicep: { label: 'Left Bicep', unit: 'cm' },
  rightBicep: { label: 'Right Bicep', unit: 'cm' },
  leftForearm: { label: 'Left Forearm', unit: 'cm' },
  rightForearm: { label: 'Right Forearm', unit: 'cm' },
  abdomen: { label: 'Abdomen', unit: 'cm' },
  hips: { label: 'Hips', unit: 'cm' },
  leftThigh: { label: 'Left Thigh', unit: 'cm' },
  rightThigh: { label: 'Right Thigh', unit: 'cm' },
  leftCalf: { label: 'Left Calf', unit: 'cm' },
  rightCalf: { label: 'Right Calf', unit: 'cm' },
} as const; // Use 'as const' for stricter typing

export type MeasurementType = keyof typeof measurementTypes;

// Type for a single measurement record
export interface MeasurementRecord {
  id?: string; // Optional Firestore document ID
  userId: string;
  date: string; // Store date as ISO string (e.g., new Date().toISOString())
  timestamp: number; // Store timestamp for easier sorting
  measurements: {
    [K in MeasurementType]?: number; // All measurements are optional numbers
  };
  bmi?: number | null; // Calculated BMI
}
