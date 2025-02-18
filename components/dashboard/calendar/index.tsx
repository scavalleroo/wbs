'use client';

import DashboardLayout from '@/components/layout';
import { User } from '@supabase/supabase-js';
import MonthlyCalendar from './calendar-component';
import { useEffect, useState } from 'react';
import { PlanActivity } from '@/types/plan';
import { createClient } from '@/utils/supabase/client';

interface Props {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export default function CalendarPageComponent(props: Props) {
    const [activities, setActivities] = useState<PlanActivity[]>([]);

    return (
        <DashboardLayout
            user={props.user}
            userDetails={props.userDetails}
            title="Subscription Page"
            description="Manage your subscriptions"
        >
            <div className="h-full w-full">
                <div className="mb-5 flex gap-5 flex-col xl:flex-row w-full">
                    <MonthlyCalendar />
                </div>
            </div>
        </DashboardLayout>
    );
}