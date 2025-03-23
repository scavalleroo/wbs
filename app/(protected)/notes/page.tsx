import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { NotesPageComponent } from '@/components/notes/editor/NotesPageComponent';

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

    return <NotesPageComponent user={user} />
}