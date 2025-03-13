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
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="min-h-10 min-w-10">
                            <AvatarImage src={user?.user_metadata.avatar_url} />
                            <AvatarFallback className="font-bold dark:text-zinc-950">
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
                    {/* <DropdownMenuGroup>
                        <DropdownMenuItem
                            disabled
                            className="cursor-not-allowed opacity-50"
                        >
                            Profile <span className="text-xs ml-2 opacity-80">🚧</span>
                            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            disabled
                            className="cursor-not-allowed opacity-50"
                        >
                            Settings <span className="text-xs ml-2 opacity-80">🚧</span>
                            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <LogoutButton />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}