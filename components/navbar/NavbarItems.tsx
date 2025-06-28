"use client"

import { HomeIcon, Notebook, TreePalm } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

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

    // Extract the current section from the pathname
    const currentPath = pathname.split('/')[1] || 'dashboard'

    // Create our navigation items - recalculate when timer state changes
    const navItems: NavItem[] = [
        {
            name: "Home",
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
        // Focus functionality removed - now handled in OptimizedFocusTimeCard
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

        // Base styles with enhanced transitions
        const baseStyles = [
            "flex flex-col items-center justify-center relative h-full",
            "transition-all duration-300 ease-out",
            "transform active:scale-95"
        ].join(" ")

        // Responsive width calculation - each nav item gets 1/2 of the NavbarItems container (which is 3/4 of total)
        const responsiveWidth = "flex-1 sm:w-auto"

        // Hide focus button on desktop
        const visibilityClass = mobileOnly ? "sm:hidden" : ""

        // Enhanced padding with top padding and better mobile spacing
        const padding = "px-2 pt-3 pb-2 sm:px-8 sm:pt-2 sm:pb-2"

        // Modern hover styles with gradient backgrounds
        const hoverStyles = [
            "hover:bg-gradient-to-b hover:from-neutral-100/80 hover:via-neutral-50/60 hover:to-neutral-100/80",
            "dark:hover:from-neutral-800/50 dark:hover:via-neutral-700/40 dark:hover:to-neutral-800/50",
            "hover:backdrop-blur-sm"
        ].join(" ")

        // Improved text colors with better contrast
        const inactiveText = "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"

        if (isActive) {
            return cn(
                baseStyles,
                responsiveWidth,
                padding,
                visibilityClass,
                // Remove mobile background, keep only text styling
                "text-blue-700 dark:text-blue-300 font-semibold",
                // Desktop gradient border with enhanced styling
                "sm:after:absolute sm:after:bottom-[-4px] sm:after:left-0 sm:after:w-full sm:after:h-[4px] sm:after:content-[''] sm:after:z-10 sm:after:rounded-full",
                "sm:after:bg-gradient-to-r sm:after:from-blue-500 sm:after:via-indigo-500 sm:after:to-blue-500",
                "sm:after:shadow-lg sm:after:shadow-blue-500/30",
                "sm:text-black sm:dark:text-white"
            )
        }

        return cn(baseStyles, responsiveWidth, padding, inactiveText, hoverStyles, visibilityClass)
    }

    // Inside the return statement, update the icon and label styling
    return (
        <nav className={cn("flex w-full h-full", className)}>
            {navItems.map((item) => (
                <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(item, e)}
                    className={cn("group", getItemStyles(item.path, item.type, item.mobileOnly))}
                >
                    {/* Centered content with enhanced spacing and transitions */}
                    <div className="flex flex-col items-center space-y-1.5 transition-all duration-300 ease-out">
                        {/* Icon container with enhanced styling */}
                        <div className="relative group">
                            {/* Modern background pill for selected items */}
                            {currentPath === item.path && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                    w-[44px] h-[32px] rounded-full -z-10
                                    bg-gradient-to-b from-white/90 via-white/80 to-white/90
                                    dark:from-neutral-600/60 dark:via-neutral-500/50 dark:to-neutral-600/60
                                    shadow-lg shadow-blue-200/30 dark:shadow-blue-900/20
                                    border border-blue-200/20 dark:border-blue-700/20
                                    backdrop-blur-sm" />
                            )}

                            {/* Icon with enhanced transitions */}
                            <item.icon className={cn(
                                "size-5 transition-all duration-300 ease-out",
                                "group-hover:scale-110 group-active:scale-95",
                                // Enhanced color transitions
                                currentPath === item.path
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200"
                            )} />
                        </div>

                        {/* Label with enhanced typography */}
                        <span className={cn(
                            "text-xs font-medium transition-all duration-300 ease-out",
                            "group-hover:font-semibold",
                            // Enhanced color transitions
                            currentPath === item.path
                                ? "font-semibold text-blue-700 dark:text-blue-300"
                                : "text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200"
                        )}>
                            {item.name}
                        </span>
                    </div>
                </a>
            ))}
        </nav>
    )
}