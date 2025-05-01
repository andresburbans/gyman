'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Dumbbell, User, LogOut, LayoutDashboard, LineChart, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login after sign out
    } catch (error) {
      console.error("Error signing out: ", error);
      // Optionally show a toast notification for the error
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'; // Default to 'U' for User
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">LiftBuddy</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {user && (
             <>
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Dashboard
              </Link>
              <Link href="/measurements" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Measurements
              </Link>
              <Link href="/progress" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                Progress
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.photoURL ?? user.photoURL ?? undefined} alt={profile?.displayName ?? user.displayName ?? 'User'} />
                    <AvatarFallback>{getInitials(profile?.displayName ?? user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.displayName ?? user.displayName ?? 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/measurements')}>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Measurements</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/progress')}>
                  <LineChart className="mr-2 h-4 w-4" />
                  <span>Progress</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <>
               <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                 Login
               </Button>
               <Button size="sm" onClick={() => router.push('/signup')}>
                 Sign Up
               </Button>
             </>
          )}
        </div>
      </div>
    </header>
  );
}
