import { redirect } from 'next/navigation';
import { getUserDetails, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import Break from '@/components/break';

export const metadata = {
    title: 'Break | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function BreakPage() {
    const supabase = await createClient();
    const [user] = await Promise.all([
        getUser(supabase),
    ]);

    return <Break user={user} />;
}