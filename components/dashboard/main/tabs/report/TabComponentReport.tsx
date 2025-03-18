import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';
import CombinedWellnessReport from './wellebing/CombinedWellnessReport';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentReport({ user }: FocusTabContentProps) {
    const [activeTab, setActiveTab] = useState("dashboard");

    return (
        <TabsContent value="report" className='flex flex-col w-full h-[calc(100vh-156px)] max-h-[calc(100vh-156px)] overflow-y-auto'>
            <div className="space-y-6 max-w-screen-lg mx-auto px-2 w-full">
                <CombinedWellnessReport user={user} />
            </div>
        </TabsContent>
    );
}