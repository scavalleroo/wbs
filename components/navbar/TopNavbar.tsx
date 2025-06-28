"use client";

import React from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Image from "next/image";
import NavbarUser from './NavbarUser';
import { FocusPopover } from './FocusPopover';

interface TopNavbarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    onToggleSidebar: () => void;
    isSidebarCollapsed: boolean;
}

export function TopNavbar({ user, userDetails, onToggleSidebar, isSidebarCollapsed }: TopNavbarProps) {
    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-white/20 dark:border-neutral-800/50 flex items-center px-4">
            {/* Left section - Menu button and Logo */}
            <div className="flex items-center space-x-4">
                {/* Menu toggle button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleSidebar}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {/* Logo */}
                <div className="flex items-center">
                    <Image
                        src="/logoTransparent.svg"
                        alt="Weko Logo"
                        width={60}
                        height={60}
                        className="dark:block hidden"
                    />
                    <Image
                        src="/logoTransparentB.svg"
                        alt="Weko Logo"
                        width={60}
                        height={60}
                        className="block dark:hidden"
                    />
                </div>
            </div>

            {/* Right section - Focus popover (mobile only) and User profile */}
            <div className="ml-auto flex items-center space-x-2">
                {/* Focus Popover - Mobile only */}
                <div className="md:hidden">
                    <FocusPopover user={user} />
                </div>

                {/* User Profile */}
                <NavbarUser
                    user={user}
                    userDetails={userDetails}
                    className="p-2"
                />
            </div>
        </div>
    );
}
