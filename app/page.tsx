import { createClient } from '@/utils/supabase/server';
import Image from "next/image";
import Link from "next/link";
import { HeroSection } from '@/components/landing/HeroSection';
import { Button } from '@/components/ui/button';
import { Star, CheckCircle2, HeartPulse, BedDouble, Apple, Bike, Users, Twitter, Linkedin, Instagram } from 'lucide-react';


export const metadata = {
    title: 'Weko | What matters most, every day.',
    description: 'AI-powered productivity platform that reduces digital overwhelm through mindful distraction blocking and personalized focus environments.',
};

export default async function LandingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="dark bg-background text-foreground">
            <header className="sticky top-0 w-full bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm z-50">
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex-shrink-0">
                                <Image src="/logoTransparent.svg" alt="Weko Logo" width={80} height={80} />
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild>
                                <Link
                                    href={user ? "/dashboard" : "/signin"}
                                >
                                    {user ? "Go to Home" : "Get Started"}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </nav>
            </header>

            <main className="-mt-16 overflow-x-hidden">
                {/* Section 1: Hero */}
                <HeroSection />

                {/* Section 2: Weko Mindful Browsing Extension */}
                <section id="extension" className="bg-background py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                            <div className="lg:pr-8 lg:pt-4">
                                <div className="lg:max-w-lg">
                                    <h2 className="text-base font-semibold leading-7 text-primary">Mindful Browsing</h2>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Take Control of Your Tabs</p>
                                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                                        Our ADHD-friendly Chrome extension helps you manage distracting sites, set time limits, and improve focus with mindful browsing habits. Reclaim your attention from the ground up.
                                    </p>
                                    <div className="mt-8 flex items-center gap-4">
                                        <div className="flex items-center text-yellow-400">
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                            <Star className="h-5 w-5 fill-current" />
                                        </div>
                                        <p className="text-sm text-muted-foreground">5-star rating on the Chrome Web Store.</p>
                                    </div>
                                    <div className="mt-10">
                                        <Button size="lg" asChild>
                                            <Link href="https://chromewebstore.google.com/detail/weko-mindful-browsing/dhooahmpdcmdnjbdedfhhopjdboeniih" target="_blank" rel="noopener noreferrer">
                                                Add to Chrome
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <Image
                                src="/images/extension.jpg"
                                alt="Product screenshot"
                                className="w-[48rem] max-w-none rounded-xl shadow-xl ring-1 ring-foreground/10 sm:w-[57rem] md:-ml-4 lg:-ml-0"
                                width={2432}
                                height={1442}
                            />
                        </div>
                    </div>
                </section>

                {/* Section 3: AI-Powered Planning */}
                <section
                    id="planning"
                    className="py-24 sm:py-32"
                    style={{ background: 'linear-gradient(135deg, #6CB4EE, #3730A3)' }}
                >
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                            <div className="lg:order-last">
                                <Image
                                    src="/images/projects/weko/notes1.png"
                                    alt="AI Notes Feature"
                                    className="w-[48rem] max-w-none rounded-xl shadow-2xl ring-1 ring-black/10 sm:w-[57rem]"
                                    width={2432}
                                    height={1442}
                                />
                            </div>
                            <div className="lg:pr-8 lg:pt-4">
                                <div className="lg:max-w-lg">
                                    <h2 className="text-base font-semibold leading-7 text-sky-200">AI-powered planning</h2>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Boost Your Productivity 5x</p>
                                    <p className="mt-6 text-lg leading-8 text-indigo-100">
                                        Structure your work with our intelligent note-taking feature. Plan crucial daily tasks, organize long-term goals into project Pages, and let our AI assistant help you write and brainstorm. Everything is synced to the cloud, available on all your devices.
                                    </p>
                                    <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-indigo-100 lg:max-w-none">
                                        <div className="relative pl-9">
                                            <dt className="inline font-semibold text-white">
                                                <CheckCircle2 className="absolute left-1 top-1 h-5 w-5 text-sky-300" />
                                                Daily & Project Notes.
                                            </dt>
                                            <dd className="inline"> Organize your thoughts by day or by project with a flexible page structure.</dd>
                                        </div>
                                        <div className="relative pl-9">
                                            <dt className="inline font-semibold text-white">
                                                <CheckCircle2 className="absolute left-1 top-1 h-5 w-5 text-sky-300" />
                                                AI Writing Assistant.
                                            </dt>
                                            <dd className="inline"> Enhance your writing, brainstorm ideas, and plan more effectively with AI.</dd>
                                        </div>
                                        <div className="relative pl-9">
                                            <dt className="inline font-semibold text-white">
                                                <CheckCircle2 className="absolute left-1 top-1 h-5 w-5 text-sky-300" />
                                                Cloud Sync.
                                            </dt>
                                            <dd className="inline"> Access your notes and plans from anywhere, on any device, seamlessly.</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Undistracted Wellbeing */}
                <section id="wellbeing" className="bg-background py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                            <div className="lg:pr-8 lg:pt-4">
                                <div className="lg:max-w-lg">
                                    <h2 className="text-base font-semibold leading-7 text-primary">Holistic Wellbeing</h2>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Chart Your Path to Balance</p>
                                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                                        Go beyond productivity. Weko helps you build a sustainable routine by tracking the five core pillars of wellbeing. Each day, take a moment to check in, leave personal notes, and watch your progress over time with insightful charts and analysis.
                                    </p>
                                    <dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-muted-foreground lg:max-w-none">
                                        {[
                                            { icon: HeartPulse, name: 'Mood', description: 'Log your emotional state.' },
                                            { icon: BedDouble, name: 'Sleep Quality', description: 'Rate how rested you feel.' },
                                            { icon: Apple, name: 'Nutrition', description: 'Track your meal quality.' },
                                            { icon: Bike, name: 'Physical Activity', description: 'Note your exercise for the day.' },
                                            { icon: Users, name: 'Social Connections', description: 'Reflect on your social interactions.' },
                                        ].map((feature) => (
                                            <div key={feature.name} className="relative pl-9">
                                                <dt className="inline font-semibold text-foreground">
                                                    <feature.icon className="absolute left-1 top-1 h-5 w-5 text-primary" />
                                                    {feature.name}.
                                                </dt>
                                                <dd className="inline"> {feature.description}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>
                            <div className="relative mt-16 flex h-[550px] items-center justify-center lg:mt-0">
                                <Image
                                    src="/images/login.jpg"
                                    alt="A person meditating in a calm environment"
                                    className="relative w-[300px] rounded-2xl shadow-2xl"
                                    width={1000}
                                    height={1500}
                                />
                                <div className="absolute -right-4 -bottom-4 w-72 rounded-2xl bg-gradient-to-br from-purple-400 via-fuchsia-500 to-pink-600 p-5 text-white shadow-2xl ring-1 ring-black/10 backdrop-blur-lg sm:right-4">
                                    <div className="absolute inset-0 rounded-2xl bg-black/20"></div>
                                    <div className="relative z-10">
                                        <p className="text-lg font-semibold">How's your mood today?</p>
                                        <div className="mt-4 flex justify-between">
                                            {['😔', '😕', '😐', '😊', '🌟'].map((emoji, i) => (
                                                <div key={i} className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${i === 3 ? 'border-white bg-white/30' : 'border-white/50'} cursor-pointer`}>
                                                    <span className="text-xl">{emoji}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-5 flex justify-center space-x-1.5">
                                            <div className="h-2 w-5 rounded-full bg-white"></div>
                                            <div className="h-2 w-2 rounded-full bg-white/50"></div>
                                            <div className="h-2 w-2 rounded-full bg-white/50"></div>
                                            <div className="h-2 w-2 rounded-full bg-white/50"></div>
                                            <div className="h-2 w-2 rounded-full bg-white/50"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 5: Focus Timer & Soundscapes */}
                <section id="focus" className="bg-muted py-24 sm:py-32">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                            <div className="lg:order-last relative flex h-[550px] items-center justify-center">
                                <Image
                                    src="/images/projects/weko/mindful.jpg"
                                    alt="A person meditating peacefully"
                                    className="absolute top-0 left-0 w-[300px] rounded-2xl shadow-2xl transform -rotate-6"
                                    width={1000}
                                    height={1500}
                                />
                                <Image
                                    src="/images/projects/weko/mobile2.png"
                                    alt="Weko focus timer on a mobile device"
                                    className="relative z-10 w-[300px] rounded-2xl shadow-2xl transform rotate-3"
                                    width={1000}
                                    height={1500}
                                />
                            </div>
                            <div className="lg:pr-8 lg:pt-4">
                                <div className="lg:max-w-lg">
                                    <h2 className="text-base font-semibold leading-7 text-primary">Deep Focus</h2>
                                    <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Work with Intention, Rest with Purpose</p>
                                    <p className="mt-6 text-lg leading-8 text-muted-foreground">
                                        Complete the circle of high performance with our integrated Focus Timer. It’s more than a clock; it’s a system designed to protect you from burnout by weaving work and wellbeing together.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: More to Come */}
                <section
                    className="relative bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
                    style={{ backgroundImage: "url('/images/hero.jpg')" }}
                >
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
                    <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                The Future of Mindful Work is Unfolding.
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-muted-foreground">
                                Weko is currently in beta, and this is just the beginning. We're constantly building new features to help you maximize productivity while optimizing your health. Sign up now to be the first to know what's next.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Button size="lg" asChild>
                                    <Link href="/signin">
                                        Join the Beta & Get Notified
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-muted text-muted-foreground">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div className="col-span-2 lg:col-span-1">
                            <Link href="/" className="flex-shrink-0">
                                <Image src="/logoTransparent.svg" alt="Weko Logo" width={80} height={80} />
                            </Link>
                            <p className="mt-4 text-sm">
                                What matters most, every day.
                            </p>
                            <p className="mt-2 text-xs">
                                Barcelona, Spain
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Navigate</h3>
                            <ul className="mt-4 space-y-2 text-sm">
                                <li><Link href="#extension" className="hover:text-foreground transition">Extension</Link></li>
                                <li><Link href="#planning" className="hover:text-foreground transition">AI Planning</Link></li>
                                <li><Link href="#wellbeing" className="hover:text-foreground transition">Wellbeing</Link></li>
                                <li><Link href="#focus" className="hover:text-foreground transition">Focus Timer</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Account</h3>
                            <ul className="mt-4 space-y-2 text-sm">
                                <li><Link href="/signin" className="hover:text-foreground transition">Sign In</Link></li>
                                <li><Link href="/signin" className="hover:text-foreground transition">Join Beta</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Legal</h3>
                            <ul className="mt-4 space-y-2 text-sm">
                                <li><Link href="/privacy-policy" className="hover:text-foreground transition">Privacy Policy</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Social</h3>
                            <div className="flex mt-4 space-x-4">
                                <Link href="#" className="hover:text-foreground transition"><Twitter className="h-5 w-5" /></Link>
                                <Link href="#" className="hover:text-foreground transition"><Linkedin className="h-5 w-5" /></Link>
                                <Link href="#" className="hover:text-foreground transition"><Instagram className="h-5 w-5" /></Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="border-t">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 text-center text-sm">
                        <p>© 2025 Weko. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}