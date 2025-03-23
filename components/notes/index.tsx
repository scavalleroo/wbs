'use client';

import AppLayout from '@/components/layout/ClientLayout';
import Navbar from '@/components/navbar/Navbar';
import MoodTrackingModal from '../moodTracking/MoodTrackingModal';
import { User } from '@supabase/supabase-js';
import Footer from '@/components/footer/Footer';
import { TimerProvider } from '@/contexts/TimerProvider';
import Analytics from '@/components/analytics';
import { FocusTabs } from './editor/focus-tabs';
import { PageLoader } from '../loader/pageLoader';

interface UserDetails {
    id: string;
}

interface Props {
    user: User | null | undefined;
    userDetails: UserDetails | null;
}

export default function Notes(props: Props) {
    return (
        <></>
        // <AppLayout
        //     user={props.user}
        //     userDetails={props.userDetails}

        // >
        //     <FocusTabs user={props.user} />
        // </AppLayout>
    );
}
