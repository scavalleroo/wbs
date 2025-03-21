import { createClient } from '@/utils/supabase/server'
import Image from "next/image";
import Link from "next/link";

export default async function PrivacyPolicy() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="relative min-h-screen grid w-full lg:max-w-none lg:grid-cols-2 lg:px-0 bg-neutral-100 dark:bg-neutral-800">
            {/* Left column - static */}
            <div className="relative hidden h-full flex-col p-10 text-white dark:border-r lg:flex">
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(180deg, var(--weko-green), var(--weko-blue))'
                }} />
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

            {/* Right column - scrollable content with fixed navbar */}
            <div className="flex flex-col w-full h-screen overflow-hidden">
                {/* Fixed navigation bar */}
                <div className="sticky top-0 w-full bg-neutral-100/90 dark:bg-neutral-800/90 backdrop-blur-sm z-50 py-4 px-6 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-700">
                    <div>
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/logoTransparent.svg"
                                alt="Weko Logo"
                                width={64}
                                height={64}
                                className="hidden dark:block"
                            />
                            <Image
                                src="/logoTransparentC.svg"
                                alt="Weko Logo"
                                width={64}
                                height={64}
                                className="dark:hidden"
                            />
                        </Link>
                    </div>
                    <div className="ml-auto">
                        <Link
                            href={user ? "/dashboard/main" : "/dashboard/signin"}
                            className="px-4 py-2 rounded-md bg-gradient-to-r from-[var(--weko-green)] to-[var(--weko-blue)] text-white hover:opacity-90 transition shadow-sm"
                        >
                            {user ? "Dashboard" : "Login"}
                        </Link>
                    </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="mx-auto flex w-full flex-col justify-start space-y-6 p-6 lg:p-16">
                        {/* Logo for mobile view */}
                        <div className="flex flex-col justify-center items-center lg:hidden mb-8 pt-2">
                            <Link href="/">
                                <Image
                                    src="/logoTransparent.svg"
                                    alt="Weko Logo"
                                    width={100}
                                    height={100}
                                    className="hidden dark:block mb-[-24px]"
                                />
                                <Image
                                    src="/logoTransparentC.svg"
                                    alt="Weko Logo"
                                    width={100}
                                    height={100}
                                    className="dark:hidden mb-[-24px]"
                                />
                            </Link>
                            <p className="text-primary">Your calm space for productivity, powered by AI</p>
                        </div>

                        <div className="text-left max-w-[800px] mx-auto">
                            <h1 className="text-3xl md:text-4xl font-light mb-4" style={{
                                background: 'linear-gradient(90deg, var(--weko-green), var(--weko-blue))',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                Privacy Policy & Beta Test Agreement
                            </h1>

                            <p className="text-sm text-muted-foreground mb-6">Last Updated: 12 March 2025</p>

                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-xl font-medium mb-3">1. Introduction</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Weko ("the App") is a beta testing platform designed to monitor user activity on various web browsers (e.g., Google Chrome, Mozilla Firefox, Microsoft Edge, etc.).
                                        The App records website visits, visit durations, and other usage metrics. Additionally, users may enter mood logs, notes, and calendar events,
                                        and utilize features including guided meditation sessions and focus-enhancing music. This Agreement governs your participation in the beta test
                                        and establishes binding terms governing data collection, usage, and the respective rights and obligations of all parties. This document is
                                        intended to be enforceable under Regulation (EU) 2016/679 (GDPR), the Italian Data Protection Code (D.lgs. 196/2003, as amended),
                                        and all other applicable laws and regulations.
                                    </p>
                                </section>

                                {/* The rest of your privacy policy sections continue here unchanged */}
                                <section>
                                    <h2 className="text-xl font-medium mb-3">2. Data Collection and Use</h2>
                                    <ul className="list-disc pl-5 space-y-3 text-sm text-muted-foreground">
                                        <li>
                                            <p className="font-medium text-foreground">Browser Activity Monitoring:</p>
                                            <p>The App collects comprehensive data on your browsing activity across all supported browsers, including but not limited to:</p>
                                            <ul className="list-disc pl-5 mt-2">
                                                <li>Categories and URLs of websites visited</li>
                                                <li>Duration of each visit</li>
                                                <li>Browser type, version, and device metadata</li>
                                                <li>IP addresses and related technical identifiers</li>
                                                <li>Any additional metadata generated during your sessions</li>
                                            </ul>
                                            <p className="mt-2">This information is solely used to assess user engagement, productivity, and to optimize the performance of the App during its beta testing phase.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Self-Reported Data:</p>
                                            <p>You may provide personal inputs, such as mood logs, notes, and calendar events. This self-reported data is used to gauge user well-being and to improve App functionality.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Additional Engagement Data:</p>
                                            <p>Data derived from interactions with guided meditation sessions and music features is collected exclusively for the purpose of evaluating and enhancing these services.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Purpose:</p>
                                            <p>All data collected is used strictly for the purposes of:</p>
                                            <ul className="list-disc pl-5 mt-2">
                                                <li>Evaluating the performance and functionality of the App</li>
                                                <li>Gaining insights to improve the user experience</li>
                                                <li>Validating the App's productivity and well-being objectives during the beta test</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium mb-3">3. Legal Basis, Consent, and Regulatory Compliance</h2>
                                    <ul className="list-disc pl-5 space-y-3 text-sm text-muted-foreground">
                                        <li>
                                            <p className="font-medium text-foreground">Compliance with GDPR and National Laws:</p>
                                            <p>All data processing is performed in strict compliance with the GDPR, the Italian Data Protection Code, and other applicable national and EU data protection laws.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Consent and Legal Basis:</p>
                                            <p>Your participation is based on explicit, informed consent as well as the developers' legitimate interests in conducting an effective beta test. By participating, you unconditionally consent to all data processing practices outlined herein.</p>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium mb-3">4. Data Sharing and Third-Party Access</h2>
                                    <ul className="list-disc pl-5 space-y-3 text-sm text-muted-foreground">
                                        <li>
                                            <p className="font-medium text-foreground">Restricted Data Sharing:</p>
                                            <p>Data collected during the beta test shall not be disclosed to any third parties, except to trusted service providers who are contractually bound to adhere to the terms of this Agreement and all applicable data protection laws.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Prohibition on Commercial Use:</p>
                                            <p>Under no circumstances shall any personal data be exploited for marketing or commercial purposes, nor sold to any external entity.</p>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium mb-3">5. Data Retention and Deletion</h2>
                                    <ul className="list-disc pl-5 space-y-3 text-sm text-muted-foreground">
                                        <li>
                                            <p className="font-medium text-foreground">Retention:</p>
                                            <p>Your data will be securely retained only for the period necessary to complete the beta test and conduct subsequent analyses.</p>
                                        </li>

                                        <li>
                                            <p className="font-medium text-foreground">Deletion:</p>
                                            <p>Upon the beta test's conclusion or upon your written request, your personal data will be permanently expunged from all active systems. Only aggregated and anonymized data, which cannot be traced back to any individual, may be retained for research and developmental purposes.</p>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-xl font-medium mb-3">12. Consent and Acceptance</h2>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        By using Weko, you acknowledge that you have read, fully understood, and voluntarily agree to all terms, conditions, and obligations set forth in this Privacy Policy and Beta Test Agreement.
                                        You further confirm that you accept the irrevocable, binding nature of this Agreement, including the limitations on liability, mandatory arbitration,
                                        waiver of litigation, and non-appealability provisions.
                                    </p>
                                </section>
                            </div>

                            <p className="mt-8 text-center text-sm text-muted-foreground lg:hidden pb-4">© Weko 2025</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}