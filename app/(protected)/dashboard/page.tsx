
import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import CombinedWellnessReport from '@/components/dashboard/wellebing/CombinedWellnessReport';

export const metadata = {
    title: 'Dashboard | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function DashboardPage() {
    const supabase = await createClient();
    const [user] = await Promise.all([
        getUser(supabase),
    ]);

    return <CombinedWellnessReport user={user} />;
}