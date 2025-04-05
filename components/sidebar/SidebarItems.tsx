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
        {
            name: "Relax",
            href: "/break",
            path: "break",
            icon: TreePalm,
            type: "break"
        }
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
            <nav className={cn("flex flex-col w-full space-y-1", className)}>
                {navItems.map((item) => (
                    <a
                        key={item.name + (item.isTimer ? (flowMode ? timeElapsed : timeRemaining) : '')}
                        href={item.href}
                        onClick={(e) => handleNavigation(item, e)}
                        className={cn(
                            "flex items-center transition-all duration-200",
                            // Base styling for all sizes
                            "rounded-lg",
                            // Icon-only mode for sm-md breakpoints
                            "sm:justify-center sm:px-2 sm:py-3",
                            "md:justify-center md:px-2 md:py-3",
                            // Full sidebar mode for lg+ breakpoints 
                            "lg:justify-start lg:px-4 lg:py-3",
                            // Default padding for all other cases
                            "px-4 py-3",
                            // Active state highlighting
                            currentPath === item.path
                                ? "bg-neutral-200/80 dark:bg-neutral-700/80 text-black dark:text-white font-medium"
                                : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70",
                            item.isTimer && isRunning ? "text-blue-500 dark:text-blue-400" : ""
                        )}
                    >
                        <item.icon className={cn(
                            "size-[18px]",
                            // Remove margin when text is hidden (sm and md)
                            "sm:mr-0 md:mr-0 lg:mr-4 mr-4",
                            item.isTimer && isRunning ? "text-blue-500 dark:text-blue-400" : ""
                        )} />
                        <span className={cn(
                            "text-sm",
                            // Hide text on sm and md screens, show on lg+
                            "sm:hidden md:hidden lg:inline",
                            item.isTimer && "font-medium"
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