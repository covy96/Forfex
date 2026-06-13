import React from 'react';
import { Toaster } from "sonner";
import AppShell from '@/components/layout/AppShell';
import { useUserProfile } from '@/lib/useUserProfile';
import { useLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding';

export default function Layout({ children, currentPageName }) {
  const { isLoading, hasProfile, user } = useUserProfile();
  const location = useLocation();

  // Don't wrap onboarding in AppShell
  if (location.pathname === '/Onboarding') {
    return (
      <>
        {children}
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  // Show loading spinner while checking profile
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  // If user exists but no profile → show onboarding
  if (user && !hasProfile) {
    return (
      <>
        <Onboarding />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <>
      <AppShell currentPageName={currentPageName}>
        {children}
      </AppShell>
      <Toaster position="bottom-right" richColors />
    </>
  );
}