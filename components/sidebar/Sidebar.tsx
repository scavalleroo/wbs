"use client";

import React from 'react';
import { User } from '@supabase/supabase-js';
import Image from "next/image";
import NavbarUser from '../navbar/NavbarUser';
import { cn } from '@/lib/utils';
import { SidebarItems } from './SidebarItems';

interface SidebarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
}

export function Sidebar({ user, userDetails }: SidebarProps) {
    return (
        <div className={cn(
            "hidden sm:flex flex-col h-full border-r border-neutral-200 dark:border-neutral-700",
            "bg-neutral-100 dark:bg-neutral-800",
            // Narrower sidebar between sm and lg breakpoints (both sm and md show icon-only)
            "sm:w-16 md:w-16 lg:w-64",
        )}>
            {/* Logo */}
            <div className="flex justify-center items-center pt-6 pb-8">
                <Image
                    src="/logoTransparent.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="dark:block hidden"
                />
                <Image
                    src="/logoTransparentB.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="block dark:hidden"
                />
            </div>

            {/* Nav Items */}
            <div className="flex-grow px-2">
                <SidebarItems />
            </div>

            {/* User Profile - shown differently based on sidebar width */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
                <NavbarUser
                    user={user}
                    userDetails={userDetails}
                    className="sm:justify-center md:justify-center lg:justify-start w-full"
                    condensed={true}
                />
            </div>
        </div>
    );
}