/*eslint-disable*/
'use client';

import DashboardLayout from '@/components/layout';
import { User } from '@supabase/supabase-js';

interface Props {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export default function MainPage(props: Props) {
    return (
        <DashboardLayout
            user={props.user}
            userDetails={props.userDetails}
            title="Focus, Break, Report"
            description="Dashboard"
        >
            <div className="h-full w-full">
                <div className="flex gap-5 flex-col xl:flex-row w-full">
                </div>
            </div>
        </DashboardLayout>
    );
}
