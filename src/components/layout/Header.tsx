'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Dumbbell, User, LogOut, LayoutDashboard, LineChart, Pencil, Home, BarChart, List } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import AuthTriggerButton from '@/components/auth/AuthTriggerButton';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Header() {
  const { user, loading, profile, openAuthModal } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    if (!auth) {
      console.error("Firebase Auth is not initialized.");
      return;
    }
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-2">
        <a href="/dashboard" className={`flex flex-col items-center ${pathname === '/dashboard' ? 'text-green-500' : 'text-muted-foreground'}`}>
          <Home className={`h-6 w-6 ${pathname === '/dashboard' ? 'text-green-500' : ''}`} />
          <span className="text-xs">Dashboard</span>
        </a>
        <a href="/measurements" className={`flex flex-col items-center ${pathname === '/measurements' ? 'text-green-500' : 'text-muted-foreground'}`}>
          <List className={`h-6 w-6 ${pathname === '/measurements' ? 'text-green-500' : ''}`} />
          <span className="text-xs">Measurements</span>
        </a>
        <a href="/progress" className={`flex flex-col items-center ${pathname === '/progress' ? 'text-green-500' : 'text-muted-foreground'}`}>
          <BarChart className={`h-6 w-6 ${pathname === '/progress' ? 'text-green-500' : ''}`} />
          <span className="text-xs">Progress</span>
        </a>
        <a href="/profile" className={`flex flex-col items-center ${pathname === '/profile' ? 'text-green-500' : 'text-muted-foreground'}`}>
          <User className={`h-6 w-6 ${pathname === '/profile' ? 'text-green-500' : ''}`} />
          <span className="text-xs">User</span>
        </a>
      </nav>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Gyman</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4">
          {user && (
            <>
              <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-green-500' : 'text-muted-foreground'} hover:text-green-500`}>
                Dashboard
              </Link>
              <Link href="/measurements" className={`text-sm font-medium transition-colors ${pathname === '/measurements' ? 'text-green-500' : 'text-muted-foreground'} hover:text-green-500`}>
                Measurements
              </Link>
              <Link href="/progress" className={`text-sm font-medium transition-colors ${pathname === '/progress' ? 'text-green-500' : 'text-muted-foreground'} hover:text-green-500`}>
                Progress
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-4">
          {user ? (
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
              <AuthTriggerButton mode="login" variant="outline" size="sm">
                Login
              </AuthTriggerButton>
              <AuthTriggerButton mode="signup" size="sm">
                Sign Up
              </AuthTriggerButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
