"use client"

import { Coffee, HomeIcon, TreePalm } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

interface SidebarItemsProps {
    className?: string;
    isCollapsed?: boolean;
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

export function SidebarItems({ className, isCollapsed = false }: SidebarItemsProps) {
    const pathname = usePathname()
    const router = useRouter()

    // Extract the current section from the pathname
    const currentPath = pathname.split('/')[1] || 'dashboard'

    // Create our navigation items
    const navItems: NavItem[] = [
        {
            name: "Home",
            href: "/dashboard",
            path: "dashboard",
            icon: HomeIcon,
            type: "report"
        },
        // Notes removed - now integrated into Home
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

    return (
        <nav className={cn("flex flex-col w-full space-y-2", className)}>
            {navItems.map((item) => (
                <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(item, e)}
                    className={cn(
                        "group flex items-center relative overflow-hidden",
                        "transition-all duration-300 ease-out",
                        "transform hover:scale-[1.02] active:scale-[0.98]",
                        "rounded-xl backdrop-blur-sm",
                        "px-3 py-3 mx-1 mb-1",
                        isCollapsed ? "justify-center" : "justify-start",
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
                        // Subtle border with smooth transitions
                        "border border-transparent hover:border-neutral-200/40 dark:hover:border-neutral-600/40",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300/30"
                    )}
                >
                    <item.icon className={cn(
                        "size-5 transition-all duration-300 ease-out",
                        !isCollapsed && "mr-3",
                        // Icon color transitions
                        currentPath === item.path
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200",
                        // Subtle transform on hover
                        "group-hover:scale-110 group-active:scale-95"
                    )} />
                    {!isCollapsed && (
                        <span className={cn(
                            "text-sm font-medium transition-all duration-300 ease-out",
                            // Text color transitions
                            currentPath === item.path
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white"
                        )}>
                            {item.name}
                        </span>
                    )}
                </a>
            ))}
        </nav>
    )
}