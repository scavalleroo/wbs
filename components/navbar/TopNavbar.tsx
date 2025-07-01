"use client";

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Image from "next/image";
import NavbarUser from './NavbarUser';

interface TopNavbarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    onToggleSidebar: () => void;
    isSidebarCollapsed: boolean;
    isMobile?: boolean;
    // Timer props for mobile scroll state
    isRunning?: boolean;
    timeElapsed?: number;
    onEndSession?: () => void;
}

export function TopNavbar({
    user,
    userDetails,
    onToggleSidebar,
    isSidebarCollapsed,
    isMobile = false,
    isRunning = false,
    timeElapsed = 0,
    onEndSession
}: TopNavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);

    // Track scroll position on mobile
    useEffect(() => {
        if (!isMobile) return;

        const handleScroll = () => {
            // Try both window scroll and the main content container scroll
            const windowScrollTop = window.scrollY;
            const mainContentEl = document.querySelector('.flex-1.overflow-y-auto');
            const containerScrollTop = mainContentEl ? mainContentEl.scrollTop : 0;

            const scrollTop = Math.max(windowScrollTop, containerScrollTop);
            const shouldShowBackground = scrollTop > 50;

            setIsScrolled(shouldShowBackground);
        };

        // Set initial state
        handleScroll();

        // Listen to both window scroll and container scroll
        window.addEventListener('scroll', handleScroll, { passive: true });

        const mainContentEl = document.querySelector('.flex-1.overflow-y-auto');
        if (mainContentEl) {
            mainContentEl.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (mainContentEl) {
                mainContentEl.removeEventListener('scroll', handleScroll);
            }
        };
    }, [isMobile]);

    const formatTime = (seconds: number) => {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 h-12 transition-all duration-300 flex items-center px-4 ${isMobile
            ? isScrolled
                ? 'bg-white/10 backdrop-blur-md border-b border-white/20'
                : 'bg-transparent backdrop-blur-none border-none'
            : 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-white/20 dark:border-neutral-800/50'
            }`}>
            {/* Left section - Menu button and Logo */}
            <div className="flex items-center space-x-4">
                {/* Menu toggle button - Desktop only */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleSidebar}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}

                {/* Logo */}
                <div className="flex items-center">
                    {isMobile ? (
                        /* Always use white logo on mobile with video background */
                        <Image
                            src="/logoTransparent.svg"
                            alt="Weko Logo"
                            width={45}
                            height={45}
                        />
                    ) : (
                        /* Theme-aware logos for desktop */
                        <>
                            <Image
                                src="/logoTransparent.svg"
                                alt="Weko Logo"
                                width={45}
                                height={45}
                                className="dark:block hidden"
                            />
                            <Image
                                src="/logoTransparentB.svg"
                                alt="Weko Logo"
                                width={45}
                                height={45}
                                className="block dark:hidden"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Right section - Focus timer (mobile scrolled), Focus popover (mobile only) and User profile */}
            <div className="ml-auto flex items-center space-x-2">
                {/* Focus Timer - Mobile only when scrolled and running */}
                {isMobile && isScrolled && isRunning && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                        <div className="text-white/90 font-mono text-sm font-medium">
                            {formatTime(timeElapsed)}
                        </div>
                        {onEndSession && (
                            <button
                                onClick={onEndSession}
                                className="text-white/70 hover:text-white text-xs px-2 py-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                                End
                            </button>
                        )}
                    </div>
                )}

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
