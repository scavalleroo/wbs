import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Editor } from './editor/advanced-editor';
import { User } from '@supabase/supabase-js';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentFocus({ user }: FocusTabContentProps) {
    return (
        <TabsContent value="focus">
            <Editor user={user} />
        </TabsContent>
    );
}