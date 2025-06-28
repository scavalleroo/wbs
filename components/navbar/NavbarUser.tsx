"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import LogoutButton from "../LogoutButton";
import { User } from "@supabase/supabase-js";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NavbarUserProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    condensed?: boolean;
    className?: string;  // Add className prop
}

export default function NavbarUser({ user, userDetails, condensed, className }: NavbarUserProps) {
    const { theme, setTheme } = useTheme();
    const displayName = user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const userInitials = displayName.split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase();

    return (
        <div className={cn(
            // For top navbar - simple flex layout
            "flex items-center justify-center transition-all duration-300 ease-out",
            className
        )}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 m-0 h-auto w-auto flex justify-center items-center hover:bg-transparent group">
                        <div className="flex items-center space-x-2 transition-all duration-300 ease-out">
                            <div className="relative">
                                <Avatar className="h-8 w-8 transition-all duration-300 ease-out group-hover:scale-110 group-active:scale-95">
                                    <AvatarImage src={user?.user_metadata.avatar_url} />
                                    <AvatarFallback className="text-xs font-bold dark:text-zinc-950">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {userDetails?.full_name ||
                                    user?.user_metadata?.full_name ||
                                    'User'}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {userDetails?.email ||
                                    user?.user_metadata?.email ||
                                    'User'}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={() => setTheme('light')}
                            className="flex items-center"
                        >
                            <HiOutlineSun className="h-4 w-4 stroke-2 mr-2" />
                            Light mode
                            {theme === 'light' && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setTheme('dark')}
                            className="flex items-center"
                        >
                            <HiOutlineMoon className="h-4 w-4 stroke-2 mr-2" />
                            Dark mode
                            {theme === 'dark' && <DropdownMenuShortcut>✓</DropdownMenuShortcut>}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center">
                        <a href="mailto:workbreakspace@gmail.com" className="w-full">
                            Contact Us
                        </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => window.open('/privacy-policy', '_blank')}
                        className="flex items-center"
                    >
                        Privacy Policy
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <LogoutButton />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}