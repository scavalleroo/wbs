'use client';

import DashboardLayout from '@/components/layout';
import Navbar from '@/components/navbar/Navbar';
import { Tabs } from '@/components/ui/tabs';
import { useState } from 'react';
import { TabComponentFocus } from './tabs/notes/TabComponentFocus';
import { TabComponentReport } from './tabs/dashboard/TabComponentReport';
import { TabComponentBreak } from './tabs/break/TabComponentBreak';
import MoodTrackingModal from './moodTracking/MoodTrackingModal';
import { User } from '@supabase/supabase-js';
import Footer from '@/components/footer/FooterAdmin';
import { TimerProvider } from '@/contexts/TimerProvider';
import Analytics from '@/components/analytics';

interface UserDetails {
    id: string;
}

interface Props {
    user: User | null | undefined;
    userDetails: UserDetails | null;
}

export type TabValue = 'focus' | 'break' | 'report';

export default function MainPage(props: Props) {
    const [activeTab, setActiveTab] = useState<TabValue>('focus');

    return (
        <DashboardLayout
            user={props.user}
            userDetails={props.userDetails}
            title="Focus, Break, Report"
            description="Dashboard"
        >
            <Analytics />
            <MoodTrackingModal user={props.user} />
            <Tabs defaultValue="focus">
                <Navbar user={props.user} userDetails={props.userDetails} activeTab={activeTab} setActiveTab={setActiveTab} />
                {activeTab == 'report' && (<TabComponentReport user={props.user} />)}
                {activeTab == 'focus' && (<TabComponentFocus user={props.user} />)}
                {activeTab == 'break' && (<TabComponentBreak user={props.user} />)}
            </Tabs>
            <TimerProvider user={props.user}>
                <Footer />
            </TimerProvider>
        </DashboardLayout>
    );
}
