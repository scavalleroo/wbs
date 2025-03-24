"use client"

import { Coffee, HomeIcon, Notebook, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react" // Added useEffect
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
            name: "Break",
            href: "/break",
            path: "break",
            icon: Coffee,
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

        // Updated base styles to align content at the bottom
        const baseStyles = "flex flex-col items-center justify-end pb-1 pt-2 transition-all duration-200 relative h-full"

        // Widths based on screen sizes - responsive width only for mobile
        // For 4 items, adjust the width calculation
        const responsiveWidth = "w-[calc(100%/4)] sm:w-auto"

        // Hide focus button on desktop
        const visibilityClass = mobileOnly ? "sm:hidden" : ""

        // Horizontal padding increases on larger screens
        const padding = "px-2 sm:px-8"

        // Hover styles
        const hoverStyles = "hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70"

        // Inactive text styles with larger font on desktop
        const inactiveText = "text-neutral-500 dark:text-neutral-400"

        // Special styling for active timer
        const timerStyle = isTimer ? "text-blue-500 font-medium dark:text-blue-400" : ""

        // Active styles with indicator positioned differently based on screen size
        if (isActive) {
            // Position indicator at the top for mobile (<sm) and at the bottom for larger screens (sm+)
            const activeBorder = "after:absolute after:top-[-4px] sm:after:top-auto after:left-0 after:w-full after:h-[4px] after:content-[''] after:z-10 sm:after:bottom-[-4px] after:rounded-full"

            // Use the same gradient as the footer
            return cn(
                baseStyles,
                responsiveWidth,
                padding,
                activeBorder,
                visibilityClass,
                "text-black dark:text-white",
                "after:bg-gradient-to-r after:from-blue-500 after:via-indigo-500 after:to-blue-500",
                timerStyle
            )
        }

        return cn(baseStyles, responsiveWidth, padding, inactiveText, hoverStyles, visibilityClass, timerStyle)
    }

    // Force component to re-render when timer changes
    useEffect(() => {
        // This empty effect will cause the component to re-render 
        // when timeRemaining or sound changes, updating the nav items
    }, [timeRemaining, sound, isRunning, flowMode]);

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
                        <item.icon className={cn("size-[18px] mb-0.5", item.isTimer && isRunning ? "text-blue-500" : "")} />
                        <span className={cn("text-xs font-extralight pb-0", item.isTimer && "font-medium")}>{item.name}</span>
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