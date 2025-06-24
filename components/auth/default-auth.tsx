import Link from "next/link";
import GoogleSignInButton from "./GoogleSignInButton";
import Image from "next/image";
import { Inter } from "next/font/google";
import OneTapComponent from "../OneTap";

const inter = Inter({ subsets: ['latin'] });

export default async function DefaultAuth() {
    return (
        <div className={`relative min-h-screen grid w-full lg:max-w-none lg:grid-cols-2 lg:px-0 ${inter.className}`}>
            <OneTapComponent />
            {/* Left side with background image - unchanged */}
            <div className="relative hidden h-full flex-col p-10 text-white lg:flex">
                <div className="absolute inset-0 bg-cover bg-center" style={{
                    backgroundImage: 'url("/images/login.jpg")'
                }} />
                {/* Add a dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-black/30 z-10"></div>
                <div className="relative z-20 flex items-start">
                    <Link href="/">
                        <Image src="/logoTransparent.svg" alt="Weko Logo" width={128} height={128} />
                    </Link>
                </div>
                <div className="relative z-20 mt-auto">
                    <p className="text-foreground-muted">Your calm space for productivity, powered by AI</p>
                    <p className="text-foreground-muted">© Weko 2025</p>
                </div>
            </div>

            {/* Right side with gradient background */}
            <div className="relative lg:p-8 flex items-center justify-center w-full">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(135deg, #6CB4EE, #3730A3)'
                }} />
                <div className="mx-auto flex w-full max-w-[600px] flex-col justify-center space-y-6 sm:w-[550px] items-center px-6 relative z-10">
                    {/* Logo for mobile view */}
                    <div className="flex flex-col justify-center items-center lg:hidden mb-8">
                        <Link href="/">
                            <Image
                                src="/logoTransparent.svg"
                                alt="Weko Logo"
                                width={128}
                                height={128}
                                className="mb-[-24px]"
                            />
                        </Link>
                        <p className="text-white">Your calm space for productivity, powered by AI</p>
                    </div>
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white">
                            What matters most, everyday.
                        </h1>
                    </div>
                    <GoogleSignInButton />
                    <p className="px-4 text-center text-sm text-white text-opacity-90">
                        By clicking continue, you agree to our{" "}
                        <Link
                            href="/privacy-policy"
                            target="_blank"
                            className="underline underline-offset-4 hover:text-opacity-100"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                    <p className="px-4 text-center text-sm text-white text-opacity-90 lg:hidden">© Weko 2025</p>
                </div>
            </div>
        </div>
    );
}