"use client"

import { Coffee, HomeIcon, Notebook } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

interface NavbarItemsProps {
    className?: string
}

export function NavbarItems({ className }: NavbarItemsProps) {
    const pathname = usePathname()
    const router = useRouter()

    // Extract the current section from the pathname
    const currentPath = pathname.split('/')[1] || 'dashboard'

    const navItems = [
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
            name: "Break",
            href: "/break",
            path: "break",
            icon: Coffee,
            type: "break"
        }
    ]

    // Client-side navigation handler
    const handleNavigation = (href: string, e: React.MouseEvent) => {
        e.preventDefault()
        router.push(href)
    }

    const getItemStyles = (path: string, type: string) => {
        const isActive = currentPath === path

        // Updated base styles to align content at the bottom
        const baseStyles = "flex flex-col items-center justify-end pb-1 pt-2 transition-all duration-200 relative h-full"

        // Widths based on screen sizes - smaller for tiny screens
        const responsiveWidth = "w-[calc(100%/3)]"

        // Horizontal padding scales with screen size
        const padding = "px-2"

        // Hover styles
        const hoverStyles = "hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70"

        // Inactive text styles
        const inactiveText = "text-neutral-500 dark:text-neutral-400"

        // Active styles with indicator positioned differently based on screen size
        if (isActive) {
            // Position indicator at the top for mobile (<sm) and at the bottom for larger screens (sm+)
            const activeBorder = "after:absolute after:top-[-1px] sm:after:top-auto after:left-0 after:w-full after:h-[4px] after:content-[''] after:z-10 sm:after:bottom-[-1px] after:rounded-full"

            // Use the same gradient as the footer
            return cn(
                baseStyles,
                responsiveWidth,
                padding,
                activeBorder,
                "text-black dark:text-white",
                "after:bg-gradient-to-r after:from-blue-500 after:via-indigo-500 after:to-blue-500"
            )
        }

        return cn(baseStyles, responsiveWidth, padding, inactiveText, hoverStyles)
    }

    return (
        <nav className={cn("flex w-full backdrop-blur-sm h-full", className)}>
            {navItems.map((item) => (
                <a
                    key={item.name}
                    href={item.href}
                    onClick={(e) => handleNavigation(item.href, e)}
                    className={getItemStyles(item.path, item.type)}
                >
                    <item.icon className="size-[18px] mb-0.5" />
                    <span className="text-xs font-medium pb-0">{item.name}</span>
                </a>
            ))}
        </nav>
    )
}