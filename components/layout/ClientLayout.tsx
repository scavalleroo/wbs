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

// Define props interface for InnerLayout component
interface InnerLayoutProps {
  children: React.ReactNode;
  user: User;
  userDetails: any;
  isMobile: boolean;
}

// Create an internal layout component that can safely use the timer hooks
function InnerLayout({ children, user, userDetails, isMobile }: InnerLayoutProps) {
  const { showFullScreenTimer } = useTimerUI();
  const { sound } = useTimer();

  // Now this is safe because we're inside TimerProvider
  const isTopFooterVisible = isMobile && sound !== 'none' && !showFullScreenTimer;

  // Determine height based on session status
  const contentHeight = sound === 'none' && isMobile ?
    'h-[calc(100vh-44px)] max-h-[calc(100vh-44px)]' :
    'h-[calc(100vh-112px)] max-h-[calc(100vh-112px)]';

  return (
    <>
      <Toaster />
      <main className='mx-auto h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col'>
        <Analytics />
        <MoodTrackingModal user={user} />

        {/* Conditionally render Navbar/Footer based on screen size */}
        {!isMobile ? (
          // Desktop layout (original)
          <Navbar user={user} userDetails={userDetails} />
        ) : (
          // Mobile layout (Footer at top, only when visible)
          <div className="footer-container order-first">
            <Footer position="top" />
          </div>
        )}

        {/* Content area - conditionally apply top margin and adjust height */}
        <div className={`flex flex-col w-full ${isTopFooterVisible ? 'mt-16' : 'mt-0'} sm:mt-0 pb-4 ${contentHeight} flex-grow overflow-y-auto overflow-x-hidden`}>
          <div className="space-y-6 max-w-screen-lg mx-auto px-1 w-full">
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
    </>
  );
}

// Main layout component that sets up providers
export default function ClientLayout({ user, userDetails, children }: ClientLayoutProps) {
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
          <InnerLayout
            user={user}
            userDetails={userDetails}
            isMobile={isMobile}
          >
            {children}
          </InnerLayout>
        </TimerProvider>
      </UserDetailsContext.Provider>
    </UserContext.Provider>
  );
}

// Don't forget to import useTimer for the inner component
import { useTimer } from '@/contexts/TimerProvider';
import { ScrollArea } from '../ui/scroll-area';

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User;
  userDetails: any;
}