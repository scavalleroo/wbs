"use client";

import { useTheme } from 'next-themes';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function GoogleSignInButton() {
    const { theme } = useTheme();
    const router = useRouter();
    const supabase = createClient();
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const initializeGoogleButton = () => {
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
                    theme: "filled_black",
                    text: "signin_with",
                    size: "large",
                    logo_alignment: "left",
                }
            );
        }
    };

    useEffect(() => {
        if (isScriptLoaded) {
            initializeGoogleButton();
        }
    }, [isScriptLoaded, theme]);

    const handleSignInWithGoogle = async (response: any) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });
            if (error) throw error;
            router.push('/dashboard/plans/new');
        } catch (error) {
            console.error('Error signing in with Google:', error);
        }
    };

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={() => setIsScriptLoaded(true)}
                strategy="afterInteractive"
            />
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