"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PageLoaderProps {
    className?: string
}

export function PageLoader({ className }: PageLoaderProps) {

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                    "fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-neutral-900 z-50",
                    className
                )}
            >
                <div className="flex flex-col items-center">
                    {/* Logo - shows the right version based on dark/light mode */}
                    <div className="mb-8 relative">
                        <Image
                            src="/logoTransparentB.svg"
                            alt="Weko"
                            width={80}
                            height={80}
                            priority
                            className="dark:hidden"
                        />
                        <Image
                            src="/logoTransparent.svg"
                            alt="Weko"
                            width={80}
                            height={80}
                            priority
                            className="hidden dark:block"
                        />
                    </div>

                    {/* LinkedIn-style loading bar container */}
                    <div className="w-72 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden relative">
                        <motion.div
                            className="h-full w-16 bg-blue-600 dark:bg-blue-400 absolute rounded-full"
                            animate={{
                                x: [0, 288 - 64, 0]  // Container width (w-72 = 288px) minus bar width (w-16 = 64px)
                            }}
                            transition={{
                                duration: 2.4,
                                times: [0, 0.5, 1], // Ensure equal timing for each segment
                                ease: ["easeInOut", "easeInOut"], // Apply easing to both animations
                                repeat: Infinity,
                                repeatType: "loop"
                            }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}