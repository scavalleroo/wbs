import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import DefaultAuth from '@/components/auth/default-auth';


export default async function SignIn() {
    // Check if the user is already logged in and redirect to the account page if so
    const supabase = await createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (user) {
        return redirect('/dashboard/plans/new');
    }

    return (
        <DefaultAuth />
    )
}