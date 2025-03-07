import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { FocusTabs } from './editor/focus-tabs';
import { User } from '@supabase/supabase-js';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentFocus({ user }: FocusTabContentProps) {
    return (
        <TabsContent value="focus">
            <FocusTabs user={user} />
        </TabsContent>
    );
}