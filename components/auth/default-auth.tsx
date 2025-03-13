import Link from "next/link";
import GoogleSignInButton from "./GoogleSignInButton";
import Image from "next/image";

export default async function DefaultAuth() {
    return (
        <div className="relative min-h-screen grid w-full lg:max-w-none lg:grid-cols-2 lg:px-0 bg-neutral-900">
            <div className="relative hidden h-full flex-col p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, var(--weko-green), var(--weko-blue))'
                }} />
                <div className="relative z-20 flex items-start">
                    <Image src="/logoTransparent.svg" alt="Weko Logo" width={128} height={128} />
                </div>
                <div className="relative z-20 mt-auto">
                    <p className="text-foreground-muted">Your calm space for productivity</p>
                    <p className="text-foreground-muted">© Weko 2025</p>
                </div>
            </div>
            <div className="lg:p-8 flex items-center justify-center w-full">
                <div className="mx-auto flex w-full max-w-[600px] flex-col justify-center space-y-6 sm:w-[550px] items-center px-6">
                    {/* Logo for mobile view */}
                    <div className="flex flex-col justify-center items-center lg:hidden mb-8">
                        <Image
                            src="/logoTransparent.svg"
                            alt="Weko Logo"
                            width={128}
                            height={128}
                            className="hidden dark:block mb-[-24px]"
                        />
                        <Image
                            src="/logoTransparentC.svg"
                            alt="Weko Logo"
                            width={128}
                            height={128}
                            className="dark:hidden mb-[-24px]"
                        />
                        <p className="text-foreground-muted">Your calm space for productivity</p>
                    </div>
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4" style={{
                            background: 'linear-gradient(90deg, var(--weko-green), var(--weko-blue))',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            What matters most, every day.
                        </h1>
                    </div>
                    <GoogleSignInButton />
                    <p className="px-4 text-center text-sm text-muted-foreground">
                        By clicking continue, you agree to our{" "}
                        <Link
                            href="/#"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                            href="/#"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>
                    <p className="px-4 text-center text-sm text-muted-foreground lg:hidden">© Weko 2025</p>
                </div>
            </div>
        </div>
    );
}