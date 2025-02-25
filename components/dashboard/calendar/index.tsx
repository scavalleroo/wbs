'use client';

import DashboardLayout from '@/components/layout';
import { User } from '@supabase/supabase-js';
import CalendarView from './CalendarView';

interface Props {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export default function CalendarPageComponent(props: Props) {
    return (
        <DashboardLayout
            user={props.user}
            userDetails={props.userDetails}
            title="Subscription Page"
            description="Manage your subscriptions"
        >
            <div className="h-full w-full">
                <div className="flex gap-5 flex-col xl:flex-row w-full">
                    <CalendarView />
                </div>
            </div>
        </DashboardLayout>
    );
}