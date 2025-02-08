"use client";

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleSignInButtonProps {
    onSignIn: (response: any) => void;
}

export default function GoogleSignInButton({ onSignIn }: GoogleSignInButtonProps) {
    useEffect(() => {
        // Clean up any existing button
        const existingButton = document.getElementById("signInDiv");
        if (existingButton) {
            existingButton.innerHTML = '';
        }
    }, []);

    return (
        <>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => {
                    window.google.accounts.id.initialize({
                        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                        callback: onSignIn,
                        use_fedcm_for_prompt: true
                    });

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
                    );
                }}
            />
            <div id="signInDiv" className="mb-4"></div>
        </>
    );
}