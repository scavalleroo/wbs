// app/components/GoogleSignInWrapper.tsx
"use client";

import { createClient } from "@/utils/supabase/client"; // Create a client-side Supabase instance
import GoogleSignInButton from "./GoogleSignInButton";
import { useRouter } from "next/navigation";

export default function GoogleSignInWrapper() {
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

    return <GoogleSignInButton onSignIn={handleSignInWithGoogle} />;
}