'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth, AuthModalView } from '@/context/AuthContext';

interface AuthTriggerButtonProps extends ButtonProps {
  mode: AuthModalView;
}

const AuthTriggerButton: React.FC<AuthTriggerButtonProps> = ({ mode, children, ...props }) => {
  const { openAuthModal } = useAuth();

  const handleClick = () => {
    openAuthModal(mode);
  };

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  );
};

export default AuthTriggerButton;
