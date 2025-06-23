"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <div
            className="relative mx-auto flex w-full min-h-screen flex-col items-center justify-center overflow-hidden"
        >
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute top-0 left-0 z-0 h-full w-full object-cover"
            >
                <source src="/videos/next.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm" />

            <div className="relative z-20 px-4 text-center">
                <h1 className="mx-auto max-w-4xl text-4xl font-bold text-white md:text-5xl lg:text-7xl">
                    {"What matters most, everyday."
                        .split(" ")
                        .map((word, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                    ease: "easeOut",
                                }}
                                className="mr-2 inline-block"
                            >
                                {word}
                            </motion.span>
                        ))}
                </h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="mx-auto mt-6 max-w-2xl text-lg font-normal text-slate-200"
                >
                    Weko is your calm space for productivity. An AI-powered platform that reduces digital overwhelm and helps you focus.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="mt-8 flex justify-center"
                >
                    <Button size="lg" asChild>
                        <Link href="/signin">
                            Get Started for Free
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}