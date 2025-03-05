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

interface NavbarUserProps {
    userDetails: { [x: string]: any } | null | any;
}

export default function NavbarUser({ userDetails }: NavbarUserProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={userDetails?.photoURL ?? "/avatars/avatar.svg"}
                            alt={userDetails?.fullName ?? "User Avatar"}
                        />
                        <AvatarFallback>
                            {userDetails?.fullName?.slice(0, 2) ?? ""}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {userDetails?.fullName ?? "You"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userDetails?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
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
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <LogoutButton />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}