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
                {/* Unified Card with Tabs */}
                {/* <Card className="shadow-md bg-neutral-100 dark:bg-neutral-800">
                    <div className="p-4 border-b">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="flex items-center justify-between">
                                <div>
                                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                    <TabsTrigger value="extension">Extension Settings</TabsTrigger>
                                </div>
                                <ExtensionStatus className="ml-4" />
                            </TabsList>

                            <TabsContent value="dashboard" className="space-y-4">
                                <CombinedWellnessReport user={user} />
                            </TabsContent>

                            <TabsContent value="extension" className="pt-4 space-y-4">
                                <ExtensionTab
                                    user={user}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </Card> */}
            </div>
        </TabsContent>
    );
}