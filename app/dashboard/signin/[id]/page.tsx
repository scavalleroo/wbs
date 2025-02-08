"use client";

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
    getAuthTypes,
    getViewTypes,
    getDefaultSignInView,
    getRedirectMethod
} from '@/utils/auth-helpers/settings';
import OneTapComponent from '@/components/OneTap';
import Script from 'next/script';

export default async function SignIn({
    params,
    searchParams
}: {
    params: { id: string };
    searchParams: { disable_button: boolean };
}) {
    const { allowOauth, allowEmail, allowPassword } = getAuthTypes();
    const viewTypes = getViewTypes();
    const redirectMethod = getRedirectMethod();

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

    // Function to handle the callback
    const handleSignInWithGoogle = async (response: any) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            })
            if (error) throw error
            redirect('/dashboard/main')
        } catch (error) {
            console.error('Error signing in with Google:', error)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Login</h1>

            {/* Script to load Google Sign-In */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    // // Define the callback function globally
                    // window.handleSignInWithGoogle = handleSignInWithGoogle

                    // Initialize the sign-in button
                    window.google.accounts.id.initialize({
                        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                        callback: handleSignInWithGoogle,
                        use_fedcm_for_prompt: true
                    })

                    // Render the button
                    window.google.accounts.id.renderButton(
                        document.getElementById("signInDiv")!,
                        {
                            type: "standard",
                            shape: "pill",
                            theme: "outline",
                            text: "signin_with",
                            size: "large",
                            logo_alignment: "left"
                        }
                    )
                }}
            />

            {/* Container for Google Sign-In button */}
            <div id="signInDiv" className="mb-4"></div>

            {/* One Tap component */}
            <OneTapComponent />
        </div>
    )
}
