import React, { Dispatch, SetStateAction } from 'react';
import { TabsTriggers } from './TabsTriggers';
import NavbarUser from './NavbarUser';
import { User } from '@supabase/supabase-js';
import { TabValue } from '../dashboard/main';
import Image from "next/image";

interface NavbarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<TabValue>>;
}

export function Navbar({ user, userDetails, activeTab, setActiveTab }: NavbarProps) {
    return (
        <div className="flex py-2 items-center px-4 bg-neutral-100 dark:bg-neutral-800">
            <div className="flex-1">
                {/* Dark mode logos */}
                <Image
                    src="/logoTransparent.svg"
                    alt="Weko Logo"
                    width={64}
                    height={64}
                    className="hidden sm:dark:block -my-4"
                />
                <Image
                    src="/iconW.svg"
                    alt="Weko Icon"
                    width={32}
                    height={32}
                    className="hidden dark:block sm:dark:hidden -my-2"
                />

                {/* Light mode logos */}
                <Image
                    src="/logoTransparentB.svg"
                    alt="Weko Logo"
                    width={64}
                    height={64}
                    className="hidden sm:block dark:hidden -my-4"
                />
                <Image
                    src="/iconB.svg"
                    alt="Weko Icon"
                    width={32}
                    height={32}
                    className="block sm:hidden dark:hidden -my-2"
                />
            </div>

            <div className="flex items-center justify-center">
                <TabsTriggers activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="flex-1 flex justify-end items-center space-x-4">
                <NavbarUser user={user} userDetails={userDetails} />
            </div>
        </div>
    );
}

export default Navbar;