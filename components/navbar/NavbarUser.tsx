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

interface NavbarUserProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export default function NavbarUser({ user, userDetails }: NavbarUserProps) {
    const { theme, setTheme } = useTheme();

    return (
        // Make container take full navbar item width on mobile
        <div className="flex items-center justify-center w-[calc(100%/3)] sm:w-auto sm:justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.user_metadata.avatar_url} />
                            <AvatarFallback className="text-[10px] sm:text-xs font-bold dark:text-zinc-950">
                            </AvatarFallback>
                        </Avatar>
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