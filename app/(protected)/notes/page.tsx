import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { FocusTabs } from '@/components/notes/editor/focus-tabs';

export const metadata = {
    title: 'Notes | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function NotesPage() {
    const supabase = await createClient();
    const [user] = await Promise.all([
        getUser(supabase),
    ]);

    return <FocusTabs user={user} />
}