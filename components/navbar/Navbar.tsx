import React from 'react';
import { NavbarItems } from './TabsTriggers';
import NavbarUser from './NavbarUser';
import { User } from '@supabase/supabase-js';
import Image from "next/image";

interface NavbarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    position?: 'top' | 'bottom';
}

export function Navbar({ user, userDetails, position = 'top' }: NavbarProps) {
    return (
        <div className={`
            flex items-center px-1 sm:px-4 h-[3.5rem] 
            bg-neutral-100 dark:bg-neutral-800 
            border-b border-neutral-200 dark:border-neutral-700
            ${position === 'bottom' ?
                'sm:border-b border-t sm:border-t-0 fixed bottom-0 left-0 right-0 z-40 sm:relative sm:bottom-auto' :
                'border-b border-t-0'}
        `}>
            <div className="min-w-6 sm:min-w-8 md:flex-1 flex items-center">
                {/* Dark mode logos - tiered sizes for responsiveness */}
                <Image
                    src="/logoTransparent.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="hidden md:dark:block -my-2"
                />

                {/* Light mode logos - tiered sizes for responsiveness */}
                <Image
                    src="/logoTransparentB.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="hidden md:block dark:hidden -my-2"
                />
            </div>

            <div className="flex items-center h-full flex-grow justify-center">
                <NavbarItems />
            </div>

            <div className="min-w-6 md:flex-1 flex justify-end items-center">
                <NavbarUser user={user} userDetails={userDetails} />
            </div>
        </div>
    );
}

export default Navbar;