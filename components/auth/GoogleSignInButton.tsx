"use client";

import { useTheme } from 'next-themes';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';


export default function GoogleSignInButton() {
    const { theme } = useTheme();
    const router = useRouter();
    const supabase = createClient(); // Use client-side Supabase instance

    const handleSignInWithGoogle = async (response: any) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });
            if (error) throw error;
            router.push('/dashboard/main');
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    const existingButton = document.getElementById("signInDiv");
    if (existingButton) {
        existingButton.innerHTML = '';
    }

    if (window.google) {
        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleSignInWithGoogle,
            use_fedcm_for_prompt: true
        });

        window.google.accounts.id.renderButton(
            document.getElementById("signInDiv")!,
            {
                type: "standard",
                shape: "pill",
                theme: "filled_black", // Force dark theme
                text: "signin_with",
                size: "large",
                logo_alignment: "left",
                // width: 280 // Match your design width
            }
        );
    }

    return (
        <>
            <Script src="https://accounts.google.com/gsi/client" />
            <div
                id="signInDiv"
                className="mb-4 [&>div]:!bg-transparent dark:[&>div]:!bg-transparent [&>div]:!shadow-none"
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%'
                }}
            ></div>
        </>
    );
}