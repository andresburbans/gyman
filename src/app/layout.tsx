import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed to Inter for a clean modern look
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/Header'; // Added Header component
import AuthModal from '@/components/auth/AuthModal'; // Import AuthModal

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Use --font-sans for consistency
});

export const metadata: Metadata = {
  title: 'Gyman', // Updated title
  description: 'Gym Analyst: Track your weightlifting progress', // Updated description
  manifest: "/manifest.json", // Add PWA manifest link
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased dark', // Apply dark theme by default
          inter.variable
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header /> {/* Add Header */}
            <main className="flex-1">{children}</main>
          </div>
          <AuthModal /> {/* Render AuthModal globally */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
