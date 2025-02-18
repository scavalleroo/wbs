import { redirect } from 'next/navigation';
import { getUserDetails, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import CalendarPageComponent from '@/components/dashboard/calendar';

export default async function CalendarPage() {
    const supabase = createClient();
    const [user, userDetails] = await Promise.all([
        getUser(await supabase),
        getUserDetails(await supabase)
    ]);

    if (!user) {
        return redirect('/dashboard/signin');
    }

    return <CalendarPageComponent user={user} userDetails={userDetails} />;
}
