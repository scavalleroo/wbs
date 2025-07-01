'use client';

import { Toaster } from '@/components/ui/toaster';
import { User } from '@supabase/supabase-js';
import {
  UserContext,
  UserDetailsContext
} from '@/contexts/layout';
import { useEffect, useState } from 'react';
import Analytics from '../analytics';
import { TimerProvider } from '@/contexts/TimerProvider';
import { useTimerUI } from '@/contexts/TimerUIProvider';
import { FullScreenTimer } from '../timer/FullScreenTimer';
import { Sidebar } from '../sidebar/Sidebar';
import { TopNavbar } from '../navbar/TopNavbar';
import { useTimer } from '@/contexts/TimerProvider';

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
  const { sound, isRunning, flowMode, timeElapsed, timeRemaining, endSession } = useTimer();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Update sidebar state when mobile changes
  useEffect(() => {
    setIsSidebarCollapsed(isMobile);
    setIsMobileSidebarOpen(false); // Close mobile sidebar when switching to desktop
  }, [isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      <Toaster />
      <div className="h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        <Analytics />

        {/* Fixed Top Navigation Bar */}
        <TopNavbar
          user={user}
          userDetails={userDetails}
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          isRunning={isRunning}
          timeElapsed={timeElapsed}
          onEndSession={endSession}
        />

        {/* Main content area with sidebar */}
        <div className={`flex flex-1 overflow-hidden ${isMobile ? 'pt-0' : 'pt-12'}`}>
          {/* Sidebar - Desktop only */}
          {!isMobile && (
            <Sidebar
              user={user}
              userDetails={userDetails}
              isCollapsed={isSidebarCollapsed}
              isMobile={isMobile}
              isOpen={isMobileSidebarOpen}
              onClose={closeMobileSidebar}
            />
          )}

          {/* Main content - scrollable */}
          <div
            className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${!isMobile ? (isSidebarCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
              }`}
          >
            <div className="min-h-full">
              {children}
            </div>
          </div>
        </div>

        {showFullScreenTimer && <FullScreenTimer />}
      </div>
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

interface ClientLayoutProps {
  children: React.ReactNode;
  user: User;
  userDetails: any;
}