'use client';

import { Toaster } from '@/components/ui/toaster';
import { User } from '@supabase/supabase-js';
import {
  UserContext,
  UserDetailsContext
} from '@/contexts/layout';
import { useEffect, useState } from 'react';
import Analytics from '../analytics';
import MoodTrackingModal from '../moodTracking/MoodTrackingModal';
import { Navbar } from '../navbar/Navbar';
import { TimerProvider } from '@/contexts/TimerProvider';
import Footer from '../footer/Footer';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { FullScreenTimer } from '../timer/FullScreenTimer';

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User;
  userDetails: any;
}

export default function ClientLayout({ user, userDetails, children }: ClientLayoutProps) {
  const { showFullScreenTimer } = useTimerUI();
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640); // 640px is the default sm breakpoint in Tailwind
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener('resize', checkScreenSize);

    // Clean up
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <UserContext.Provider value={user}>
      <UserDetailsContext.Provider value={userDetails}>
        <TimerProvider user={user}>
          <Toaster />
          <main className='mx-auto h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col'>
            <Analytics />
            <MoodTrackingModal user={user} />

            {/* Conditionally render Navbar/Footer based on screen size */}
            {!isMobile ? (
              // Desktop layout (original)
              <Navbar user={user} userDetails={userDetails} />
            ) : (
              // Mobile layout (Footer at top)
              <div className="footer-container order-first">
                <Footer position="top" />
              </div>
            )}

            {/* Content area */}
            <div className='flex flex-col w-full sm:mt-0 mt-16 pb-4 h-[calc(100vh-112px)] max-h-[calc(100vh-112px)] overflow-y-auto flex-grow'>
              <div className="space-y-6 max-w-screen-lg mx-auto px-2 w-full">
                {children}
              </div>
            </div>

            {/* Conditionally render Footer/Navbar based on screen size */}
            {!isMobile ? (
              // Desktop layout (original)
              <Footer position="bottom" />
            ) : (
              // Mobile layout (Navbar at bottom)
              <div className="navbar-container order-last">
                <Navbar user={user} userDetails={userDetails} position="bottom" />
              </div>
            )}

            {showFullScreenTimer && <FullScreenTimer />}
          </main>
        </TimerProvider>
      </UserDetailsContext.Provider>
    </UserContext.Provider>
  );
};