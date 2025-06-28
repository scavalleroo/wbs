"use client";

import React from 'react';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { SidebarItems } from './SidebarItems';

interface SidebarProps {
    user: User | null | undefined;
    userDetails: { [x: string]: any } | null | any;
    isCollapsed: boolean;
    isMobile?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ user, userDetails, isCollapsed, isMobile = false, isOpen = false, onClose }: SidebarProps) {
    if (isMobile) {
        return (
            <>
                {/* Mobile overlay */}
                {isOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50"
                        onClick={onClose}
                    />
                )}

                {/* Mobile sidebar */}
                <div className={cn(
                    "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64",
                    "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-r border-white/20 dark:border-white/10",
                    "transition-transform duration-300 ease-in-out",
                    "flex flex-col shadow-xl",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}>
                    <div className="flex-grow px-2 py-4">
                        <SidebarItems isCollapsed={false} />
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className={cn(
            "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)]",
            "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-r border-white/20 dark:border-white/10",
            "transition-all duration-300 ease-in-out",
            "flex flex-col shadow-xl",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Nav Items */}
            <div className="flex-grow px-2 py-4">
                <SidebarItems isCollapsed={isCollapsed} />
            </div>
        </div>
    );
}
