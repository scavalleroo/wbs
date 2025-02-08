'use client'
import Script from 'next/script'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import OneTapComponent from '@/components/OneTap'

export default function LoginPage() {
    const supabase = createClient()
    const router = useRouter()

    // Function to handle the callback
    const handleSignInWithGoogle = async (response: any) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            })
            if (error) throw error
            router.push('/')
        } catch (error) {
            console.error('Error signing in with Google:', error)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Login</h1>

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