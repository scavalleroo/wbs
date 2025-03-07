import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Editor } from './editor/advanced-editor';
import { User } from '@supabase/supabase-js';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentFocus({ user }: FocusTabContentProps) {
    return (
        <TabsContent
            value="focus"
            className="flex flex-row w-full justify-between items-center relative mt-0 overflow-y-auto"
        >
            <Editor user={user} />
        </TabsContent>
    );
}