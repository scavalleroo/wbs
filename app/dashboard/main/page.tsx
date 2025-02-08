import Main from '@/components/dashboard/main';
import { redirect } from 'next/navigation';
import { getUserDetails, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export default async function Account() {
    const supabase = createClient();
    const [user, userDetails] = await Promise.all([
        getUser(await supabase),
        getUserDetails(await supabase)
    ]);

    if (!user) {
        return redirect('/dashboard/signin');
    }

    return <Main user={user} userDetails={userDetails} />;
}
