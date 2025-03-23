import { redirect } from 'next/navigation';
import DefaultAuth from '@/components/auth/default-auth';
import { getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
    title: 'Sign In | Weko',
    description: 'Your calm space for productivity, powered by AI',
};

export const viewport = {};

export default async function SignIn() {
    const supabase = await createClient();
    const [user] = await Promise.all([
        getUser(supabase)
    ]);

    if (user) {
        return redirect('/dashboard');
    }

    return (
        <DefaultAuth />
    )
}