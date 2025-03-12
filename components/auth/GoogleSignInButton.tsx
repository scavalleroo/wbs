"use client";

import { useTheme } from 'next-themes';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function GoogleSignInButton() {
    const { resolvedTheme } = useTheme();
    const router = useRouter();
    const supabase = createClient();
    const [isClient, setIsClient] = useState(false);

    const initializeGoogleButton = () => {
        // Ensure this only runs on client
        if (typeof window === 'undefined' || !window.google) return;

        const signInDiv = document.getElementById("signInDiv");
        if (!signInDiv) return;

        // Clear existing content
        signInDiv.innerHTML = '';

        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleSignInWithGoogle,
            use_fedcm_for_prompt: true
        });

        window.google.accounts.id.renderButton(
            signInDiv,
            {
                type: "standard",
                shape: "pill",
                theme: resolvedTheme === 'dark' ? "filled_black" : "outline",
                text: "signin_with",
                size: "large",
                logo_alignment: "left",
            }
        );
    };

    useEffect(() => {
        // Only run on client
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && window.google) {
            initializeGoogleButton();
        }
    }, [isClient, resolvedTheme]);

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

    // Prevent rendering on server
    if (!isClient) {
        return null;
    }

    return (
        <div className='loginButton'>
            <Script
                src="https://accounts.google.com/gsi/client"
                onLoad={() => {
                    if (window.google) {
                        initializeGoogleButton();
                    }
                }}
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
        </div>
    );
}