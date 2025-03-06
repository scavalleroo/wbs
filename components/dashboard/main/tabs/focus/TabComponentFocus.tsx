import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useDebouncedCallback } from 'use-debounce';
import { JSONContent } from "novel";
import { Editor } from './editor/advanced-editor';
import { useNotes } from '@/hooks/use-notes';
import { User } from '@supabase/supabase-js';
import { useProjects } from '@/hooks/use-project';

interface FocusTabContentProps {
    user: User | null | undefined;
}

export function TabComponentFocus({ user }: FocusTabContentProps) {
    return (
        <TabsContent
            value="focus"
            className="flex flex-row w-full justify-between items-center relative mt-0 overflow-y-auto"
        >
            <div className="flex flex-col w-full overflow-y-auto h-[calc(100vh-156px)] max-h-[calc(100vh-156px)]">
                <div className="max-w-screen-lg mx-auto w-full h-full py-2 overflow-y-auto">
                    <div className="w-full mx-auto px-6 md:px-2 relative z-0 flex flex-col sm:flex-row gap-2 overflow-hidden h-full pb-4 overflow-y-auto">
                        <Editor user={user} />
                    </div>
                </div>
            </div>
        </TabsContent>
    );
}