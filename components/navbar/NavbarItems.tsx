"use client"

import { HomeIcon, Notebook, Timer, TreePalm } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react" // Added useEffect
import { FocusSelector } from "@/components/timer/FocusSelector"
import { Dialog } from "@/components/ui/dialog"
import { useTimer } from "@/contexts/TimerProvider"
import { useTimerUI } from "@/contexts/TimerUIProvider"

interface NavbarItemsProps {
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
    mobileOnly?: boolean;
    isTimer?: boolean;
}

export function NavbarItems({ className }: NavbarItemsProps) {
    const pathname = usePathname()
    const router = useRouter()
    const { initializeSession, timeRemaining, timeElapsed, sound, isRunning, flowMode } = useTimer()
    const { setShowFullScreenTimer } = useTimerUI()
    const [focusDialogOpen, setFocusDialogOpen] = useState(false)

    // Extract the current section from the pathname
    const currentPath = pathname.split('/')[1] || 'dashboard'

    // Format timer for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Determine if a timer is active with more robust check
    // In flow mode, we need to check timeElapsed instead of timeRemaining
    const isTimerActive = sound !== 'none' && (flowMode ? true : timeRemaining > 0);

    // Get the appropriate time value to display
    const displayTime = flowMode ? timeElapsed : timeRemaining;

    // Create our navigation items - recalculate when timer state changes
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
            name: isTimerActive ? formatTime(displayTime) : "Focus",
            href: "#",
            path: "focus-dialog", // Special path that doesn't match URLs
            icon: Timer,
            type: "focus",
            action: () => isTimerActive ? setShowFullScreenTimer(true) : setFocusDialogOpen(true),
            mobileOnly: true,
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
        // Initialize session with the settings
        initializeSession({
            activity: settings.activity,
            sound: settings.sound,
            duration: settings.duration,
            volume: settings.volume,
            flowMode: settings.flowMode
        });

        // Automatically open full screen timer when starting a new session
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

    const getItemStyles = (path: string, type: string, mobileOnly?: boolean, isTimer?: boolean) => {
        const isActive = currentPath === path

        // Base styles - changed to center alignment
        const baseStyles = "flex flex-col items-center justify-center transition-all duration-200 relative h-full"

        // Adjust width calculation for 4 items
        const responsiveWidth = "w-[calc(100%/4)] sm:w-auto"

        // Hide focus button on desktop
        const visibilityClass = mobileOnly ? "sm:hidden" : ""

        // Horizontal padding - reduced on mobile to save space
        const padding = "px-1 sm:px-8"

        // Hover styles
        const hoverStyles = "hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70"

        // Inactive text styles 
        const inactiveText = "text-neutral-500 dark:text-neutral-400"

        // Special styling for active timer
        const timerStyle = isTimer ? "text-blue-500 font-medium dark:text-blue-400" : ""

        if (isActive) {
            // Different styling for mobile vs desktop
            return cn(
                baseStyles,
                responsiveWidth,
                padding,
                visibilityClass,
                // Desktop gradient border
                "sm:after:absolute sm:after:bottom-[-4px] sm:after:left-0 sm:after:w-full sm:after:h-[4px] sm:after:content-[''] sm:after:z-10 sm:after:rounded-full",
                "sm:after:bg-gradient-to-r sm:after:from-blue-500 sm:after:via-indigo-500 sm:after:to-blue-500",
                // Mobile special styling
                "sm:text-black sm:dark:text-white",
                timerStyle
            )
        }

        return cn(baseStyles, responsiveWidth, padding, inactiveText, hoverStyles, visibilityClass, timerStyle)
    }

    // Inside the return statement, update the icon and label styling
    return (
        <>
            <nav className={cn("flex w-full backdrop-blur-sm h-full", className)}>
                {navItems.map((item) => (
                    <a
                        key={item.name + (item.isTimer ? (flowMode ? timeElapsed : timeRemaining) : '')}
                        href={item.href}
                        onClick={(e) => handleNavigation(item, e)}
                        className={getItemStyles(item.path, item.type, item.mobileOnly, item.isTimer)}
                    >
                        {/* Centered content with tighter spacing */}
                        <div className="flex flex-col items-center space-y-1.5">
                            {/* Icon container with wide but short background */}
                            <div className="relative">
                                {/* Background pill for selected items - wider but shorter */}
                                {currentPath === item.path && (
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                        w-[40px] h-[28px] bg-neutral-200/80 dark:bg-neutral-700/80 rounded-full -z-10" />
                                )}

                                {/* Icon */}
                                <item.icon className={cn(
                                    "size-[18px]",
                                    item.isTimer && isRunning ? "text-blue-500" : "",
                                    currentPath === item.path && "text-black dark:text-white"
                                )} />
                            </div>

                            {/* Label with tighter spacing */}
                            <span className={cn(
                                "text-xs",
                                item.isTimer && "font-medium",
                                currentPath === item.path ? "font-medium text-black dark:text-white" : "font-medium"
                            )}>
                                {item.name}
                            </span>
                        </div>
                    </a>
                ))}
            </nav>

            {/* Focus Dialog */}
            <Dialog open={focusDialogOpen} onOpenChange={setFocusDialogOpen}>
                <FocusSelector onStart={handleStartFocus} />
            </Dialog>
        </>
    )
}