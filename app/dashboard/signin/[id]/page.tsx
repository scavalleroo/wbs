import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
    getAuthTypes,
    getViewTypes,
    getDefaultSignInView,
    getRedirectMethod
} from '@/utils/auth-helpers/settings';
import DefaultAuth from '@/components/auth/default-auth';

export default async function SignIn({
    params: paramsPromise,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: { disable_button: boolean };
}) {
    const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
    const viewTypes = getViewTypes();
    const redirectMethod = getRedirectMethod();
    const params = await paramsPromise;

    // Declare 'viewProp' and initialize with the default value
    let viewProp: string;

    // Assign url id to 'viewProp' if it's a valid string and ViewTypes includes it
    if (typeof params.id === 'string' && viewTypes.includes(params.id)) {
        viewProp = params.id;
    } else {
        const preferredSignInView =
            (await cookies()).get('preferredSignInView')?.value || null;
        viewProp = getDefaultSignInView(preferredSignInView);
        return redirect(`/dashboard/signin/${viewProp}`);
    }

    // Check if the user is already logged in and redirect to the account page if so
    const supabase = await createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (user && viewProp !== 'update_password') {
        return redirect('/dashboard/main');
    } else if (!user && viewProp === 'update_password') {
        return redirect('/dashboard/signin');
    }

    return (
        <DefaultAuth />
    )
}