// app/auth/page.tsx
import GoogleSignInWrapper from "@/components/auth/GoogleSignInWrapper";
import OneTapComponent from "../OneTap";

export default async function DefaultAuth() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Login</h1>
            <GoogleSignInWrapper />
            <OneTapComponent />
        </div>
    );
}