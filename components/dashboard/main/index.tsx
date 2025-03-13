/*eslint-disable*/
'use client';

import DashboardLayout from '@/components/layout';
import Navbar from '@/components/navbar/Navbar';
import { Tabs } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { TabComponentFocus } from './tabs/focus/TabComponentFocus';
import { TabComponentReport } from './tabs/report/TabComponentReport';
import { TabComponentBreak } from './tabs/break/TabComponentBreak';

interface Props {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

// Define a type for tabs
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
            <Tabs defaultValue="focus">
                <Navbar user={props.user} userDetails={props.userDetails} activeTab={activeTab} setActiveTab={setActiveTab} />
                {activeTab == 'report' && (<TabComponentReport user={props.user} />)}
                {activeTab == 'focus' && (<TabComponentFocus user={props.user} />)}
                {activeTab == 'break' && (<TabComponentBreak user={props.user} />)}
            </Tabs>
        </DashboardLayout>
    );
}
