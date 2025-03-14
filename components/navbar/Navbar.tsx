import { Headphones } from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react';
import { Timer } from '../timer/Timer';
import { TabsTriggers } from './TabsTriggers';
import { NavbarNotifications } from './NavbarNotifications';
import NavbarUser from './NavbarUser';
import { User } from '@supabase/supabase-js';
import { TabValue } from '../dashboard/main';

interface NavbarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    activeTab: string;
    setActiveTab: Dispatch<SetStateAction<TabValue>>;
}

export function Navbar({ user, userDetails, activeTab, setActiveTab }: NavbarProps) {
    // const { isMusicSidebarVisible, toggleMusicSidebar } = useSidebar();
    // const { isFriendsSidebarVisible, toggleFriendsSidebar, friends } = useFriendsSidebar();

    // const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    // const activeFriends = friends.filter(friend => (friend.lastActivity && new Date(friend.lastActivity.toDate()) > threeHoursAgo));

    return (
        <div className="flex py-2 items-center px-4 gap-4 justify-between bg-neutral-100 dark:bg-neutral-800">
            <div className="flex flex-row items-center md:space-x-6 space-x-4">
                {/* <div className={`cursor-pointer hover:text-foreground flex flex-col items-center gap-1 ${isMusicSidebarVisible ? 'text-foreground' : 'text-muted-foreground'} `} onClick={toggleMusicSidebar}>
                    <Headphones className='size-5' />
                    <p className='text-xs hidden md:block'>Music</p>
                </div> */}
                <Timer />
            </div>

            <div className="flex items-center md:space-x-2">
                <TabsTriggers activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="flex flex-row items-center space-x-4">
                <div className='flex flex-row items-center md:space-x-4'>
                    {/* <NavbarNotifications userId={user!.id} /> */}
                    {/* <div className={`cursor-pointer relative flex flex-col items-center gap-1 hover:text-foreground ${isFriendsSidebarVisible ? 'text-foreground' : 'text-muted-foreground'} `} onClick={toggleFriendsSidebar}>
                        <UsersRound className='size-5' />
                        {activeFriends.length > 0 && (
                            <div className="absolute top-[-8px] right-[-8px] md:top-[-2px] md:right-[2px] bg-secondary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                                {activeFriends.length}
                            </div>
                        )}
                        <p className='text-xs hidden md:block'>Friends</p>
                    </div> */}
                </div>
                <NavbarUser user={user} userDetails={userDetails} />
            </div>
        </div>
    );
}

export default Navbar;