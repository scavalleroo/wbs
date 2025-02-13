import { getUserDetails, getUser } from '@/utils/supabase/queries';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PlanPage from '@/components/dashboard/planDetail';

export default async function PlanDetails() {
    const supabase = await createClient();
    const [user, userDetails] = await Promise.all([
        getUser(supabase),
        getUserDetails(supabase)
    ]);

    if (!user) {
        return redirect('/dashboard/signin');
    }

    return <PlanPage user={user} userDetails={userDetails} />;
}
