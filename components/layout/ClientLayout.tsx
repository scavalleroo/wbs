'use client';

import { Toaster } from '@/components/ui/toaster';
import { User } from '@supabase/supabase-js';
import {
  UserContext,
  UserDetailsContext
} from '@/contexts/layout';
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

  return (
    <UserContext.Provider value={user}>
      <UserDetailsContext.Provider value={userDetails}>
        <TimerProvider user={user}>
          <Toaster />
          <main className='mx-auto h-screen bg-neutral-50 dark:bg-neutral-900'>
            <Analytics />
            <MoodTrackingModal user={user} />
            <Navbar user={user} userDetails={userDetails} />
            <div className='flex flex-col w-full h-[calc(100vh-112px)] max-h-[calc(100vh-112px)] overflow-y-auto'>
              <div className="space-y-6 max-w-screen-lg mx-auto px-2 w-full">
                {children}
              </div>
            </div>
            <Footer />
            {showFullScreenTimer && <FullScreenTimer />}
          </main>
        </TimerProvider>
      </UserDetailsContext.Provider>
    </UserContext.Provider>
  );
};
