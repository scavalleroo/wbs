/*eslint-disable*/
'use client';

import DashboardLayout from '@/components/layout';
import Navbar from '@/components/navbar/Navbar';
import { Tabs } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';
import { useState } from 'react';
import { TabComponentFocus } from './tabs/focus/TabComponentFocus';

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
            <div className="h-full w-full">
                <Tabs defaultValue="focus" className="flex flex-col w-full h-full relative">
                    <Navbar user={props.user} userDetails={props.userDetails} activeTab={activeTab} setActiveTab={setActiveTab} />
                    <TabComponentFocus user={props.user} />
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
