import Settings from '@/components/dashboard/settings';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserDetails, getUser } from '@/utils/supabase/queries';

export const metadata = {
    title: 'Settings | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function SettingsPage() {
    const supabase = await createClient();
    const [user, userDetails] = await Promise.all([
        getUser(supabase),
        getUserDetails(supabase)
    ]);
    if (!user) {
        return redirect('/dashboard/signin');
    }

    return <Settings userDetails={userDetails} user={user} />;
}
