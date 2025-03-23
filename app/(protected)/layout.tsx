import { redirect } from 'next/navigation';
import { getUserDetails, getUser } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import { TimerUIProvider } from '@/contexts/TimerUIProvider';
import ClientLayout from '@/components/layout/ClientLayout';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side data fetching
    const supabase = await createClient();
    const [user, userDetails] = await Promise.all([
        getUser(supabase),
        getUserDetails(supabase)
    ]);

    if (!user) {
        return redirect('/signin');
    }

    return (
        <TimerUIProvider>
            <ClientLayout user={user} userDetails={userDetails}>
                {children}
            </ClientLayout>
        </TimerUIProvider>
    );
}