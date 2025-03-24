import React from 'react';
import { NavbarItems } from './NavbarItems';
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
            flex items-center px-0 sm:px-4 h-[3.5rem] 
            bg-neutral-100 dark:bg-neutral-800 
            border-b border-neutral-200 dark:border-neutral-700
            ${position === 'bottom' ?
                'sm:border-b border-t sm:border-t-0 fixed bottom-0 left-0 right-0 z-40 sm:relative sm:bottom-auto' :
                'border-b border-t-0'}
        `}>
            {/* Logo - hidden on mobile, shown on md+ */}
            <div className="hidden sm:flex items-center">
                <Image
                    src="/logoTransparent.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="hidden sm:dark:block -my-2"
                />
                <Image
                    src="/logoTransparentB.svg"
                    alt="Weko Logo"
                    width={56}
                    height={56}
                    className="hidden sm:block dark:hidden -my-2"
                />
            </div>

            {/* Mobile layout - grid for equal distribution */}
            <div className="grid grid-cols-5 w-full gap-0 sm:hidden md:hidden pl-2">
                <NavbarItems className="col-span-4" />
                <NavbarUser
                    user={user}
                    userDetails={userDetails}
                    condensed={true}
                    className="w-auto h-full"
                />
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:flex items-center h-full flex-grow justify-center">
                <div className="flex justify-center">
                    <NavbarItems />
                </div>

                {/* User avatar - absolute position on desktop */}
                <div className="absolute right-4">
                    <NavbarUser user={user} userDetails={userDetails} />
                </div>
            </div>
        </div>
    );
}

export default Navbar;