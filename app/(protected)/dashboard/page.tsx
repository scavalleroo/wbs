
import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import DashboardComponet from '@/components/dashboard/DashboardComponet';

export const metadata = {
    title: 'Home | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function DashboardPage() {
    const supabase = await createClient();
    const [user] = await Promise.all([
        getUser(supabase),
    ]);

    return <DashboardComponet user={user} />;
}