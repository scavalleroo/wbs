import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { User } from '@supabase/supabase-js';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentBreak({ user }: FocusTabContentProps) {
    return (
        <TabsContent value="break">

        </TabsContent>
    );
}