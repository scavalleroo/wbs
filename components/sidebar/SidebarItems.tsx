"use client"

import { Coffee, HomeIcon, Notebook, Timer, TreePalm } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { FocusSelector } from "@/components/timer/FocusSelector"
import { Dialog } from "@/components/ui/dialog"
import { useTimer } from "@/contexts/TimerProvider"
import { useTimerUI } from "@/contexts/TimerUIProvider"

interface SidebarItemsProps {
    className?: string
}

// Define the type for navigation items
interface NavItem {
    name: string;
    href: string;
    path: string;
    icon: React.ElementType;
    type: string;
    action?: () => void;
    isTimer?: boolean;
}

export function SidebarItems({ className }: SidebarItemsProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { initializeSession, timeRemaining, timeElapsed, sound, isRunning, flowMode } = useTimer()
    const { setShowFullScreenTimer } = useTimerUI()
    const [focusDialogOpen, setFocusDialogOpen] = useState(false)

    // Extract the current section from the pathname
    const currentPath = pathname.split('/')[1] || 'dashboard'

    // Format timer for display
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Determine if a timer is active
    const isTimerActive = (flowMode && timeElapsed > 0) || (!flowMode && timeRemaining > 0 && isRunning);

    // Get the appropriate time value to display
    const displayTime = flowMode ? timeElapsed : timeRemaining;

    // Create our navigation items
    const navItems: NavItem[] = [
        {
            name: "Dashboard",
            href: "/dashboard",
            path: "dashboard",
            icon: HomeIcon,
            type: "report"
        },
        {
            name: "Notes",
            href: "/notes",
            path: "notes",
            icon: Notebook,
            type: "focus"
        },
        {
            name: isTimerActive ? `Focus ${formatTime(displayTime)}` : "Focus",
            href: "#",
            path: "focus-dialog",
            icon: Timer,
            type: "focus",
            action: () => isTimerActive ? setShowFullScreenTimer(true) : setFocusDialogOpen(true),
            isTimer: isTimerActive
        },
        // {
        //     name: "Relax",
        //     href: "/break",
        //     path: "break",
        //     icon: TreePalm,
        //     type: "break"
        // }
    ];

    // Handle focus session start
    const handleStartFocus = (settings: {
        activity: string;
        sound: string;
        duration: number;
        volume: number;
        flowMode?: boolean;
    }) => {
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration,
            volume: settings.volume,
            flowMode: settings.flowMode
        });
        setShowFullScreenTimer(true);
        setFocusDialogOpen(false);
    };

    // Client-side navigation handler
    const handleNavigation = (item: NavItem, e: React.MouseEvent) => {
        e.preventDefault()

        if (item.action) {
            item.action()
        } else {
            router.push(item.href)
        }
    }

    return (
        <>
            <nav className={cn("flex flex-col w-full space-y-2", className)}>
                {navItems.map((item) => (
                    <a
                        key={item.name + (item.isTimer ? (flowMode ? timeElapsed : timeRemaining) : '')}
                        href={item.href}
                        onClick={(e) => handleNavigation(item, e)}
                        className={cn(
                            "group flex items-center relative overflow-hidden",
                            "transition-all duration-300 ease-out",
                            "transform hover:scale-[1.02] active:scale-[0.98]",
                            // Base styling for all sizes with modern rounded corners
                            "rounded-xl backdrop-blur-sm",
                            // Icon-only mode for sm-md breakpoints
                            "sm:justify-center sm:px-3 sm:py-4",
                            "md:justify-center md:px-3 md:py-4",
                            // Full sidebar mode for lg+ breakpoints 
                            "lg:justify-start lg:px-4 lg:py-3.5",
                            // Default padding for all other cases
                            "px-4 py-3.5",
                            // Modern shadow effects with smooth transitions
                            "shadow-sm hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                            "transition-shadow duration-300 ease-out",
                            // Active state with modern styling and subtle glow
                            currentPath === item.path
                                ? [
                                    "bg-gradient-to-r from-blue-50 via-blue-50/80 to-indigo-50",
                                    "dark:from-blue-900/30 dark:via-blue-900/20 dark:to-indigo-900/30",
                                    "text-blue-700 dark:text-blue-300 font-semibold",
                                    "shadow-lg shadow-blue-100/60 dark:shadow-blue-900/30",
                                    "border border-blue-200/40 dark:border-blue-700/40",
                                    "ring-1 ring-blue-100/20 dark:ring-blue-800/20"
                                ].join(" ")
                                : [
                                    "text-neutral-600 dark:text-neutral-300",
                                    "hover:text-neutral-900 dark:hover:text-white",
                                    "hover:bg-gradient-to-r hover:from-neutral-50/80 hover:via-gray-50/60 hover:to-neutral-50/80",
                                    "dark:hover:from-neutral-800/40 dark:hover:via-neutral-700/30 dark:hover:to-neutral-800/40",
                                    "hover:backdrop-blur-md"
                                ].join(" "),
                            // Timer-specific styling with enhanced pulsing effect
                            item.isTimer && isRunning ? [
                                "text-blue-600 dark:text-blue-400",
                                "bg-gradient-to-r from-blue-50/60 to-indigo-50/60",
                                "dark:from-blue-900/20 dark:to-indigo-900/20",
                                "animate-pulse border-blue-200/30 dark:border-blue-700/30"
                            ].join(" ") : "",
                            // Subtle border with smooth transitions
                            "border border-transparent hover:border-neutral-200/40 dark:hover:border-neutral-600/40",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300/30"
                        )}
                    >
                        <item.icon className={cn(
                            "size-5 transition-all duration-300 ease-out",
                            // Remove margin when text is hidden (sm and md)
                            "sm:mr-0 md:mr-0 lg:mr-3 mr-3",
                            // Icon color transitions
                            currentPath === item.path
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200",
                            item.isTimer && isRunning ? "text-blue-500 dark:text-blue-400" : "",
                            // Subtle transform on hover
                            "group-hover:scale-110 group-active:scale-95"
                        )} />
                        <span className={cn(
                            "text-sm font-medium transition-all duration-300 ease-out",
                            // Hide text on sm and md screens, show on lg+
                            "sm:hidden md:hidden lg:inline",
                            // Text color transitions
                            currentPath === item.path
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white",
                            item.isTimer && "font-semibold",
                            item.isTimer && isRunning ? "text-blue-600 dark:text-blue-400" : ""
                        )}>
                            {item.name}
                        </span>
                    </a>
                ))}
            </nav>

            {focusDialogOpen && (
                <FocusSelector
                    onStart={handleStartFocus}
                    onClose={() => setFocusDialogOpen(false)}
                />
            )}
        </>
    )
}