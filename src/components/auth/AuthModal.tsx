'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth, AuthModalView } from '@/context/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { X } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authModalView, setAuthModalView } = useAuth();

  const handleSwitchView = (view: AuthModalView) => {
    setAuthModalView(view);
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModalOpen}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        {/* Add explicit close button */}
         <DialogClose asChild>
            <Button
             variant="ghost"
             size="icon"
             className="absolute top-3 right-3 z-10 rounded-full h-7 w-7"
             aria-label="Close"
            >
             <X className="h-4 w-4" />
            </Button>
         </DialogClose>
        <div className="p-6 pt-10"> {/* Add padding top for close button */}
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-2xl">
              {authModalView === 'login' ? 'Login to Gyman' : 'Create an Account'}
            </DialogTitle>
            <DialogDescription>
              {authModalView === 'login'
                ? 'Enter your email below to login to your account'
                : 'Enter your details to sign up for Gyman'}
            </DialogDescription>
          </DialogHeader>

          {authModalView === 'login' ? <LoginForm /> : <SignupForm />}

          <div className="mt-4 text-center text-sm">
            {authModalView === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => handleSwitchView('signup')}>
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button variant="link" className="p-0 h-auto" onClick={() => handleSwitchView('login')}>
                  Login
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
