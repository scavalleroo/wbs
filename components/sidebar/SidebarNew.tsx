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
                    "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r border-neutral-200 dark:border-neutral-700",
                    "bg-white dark:bg-neutral-900 transition-transform duration-300 ease-in-out",
                    "flex flex-col",
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
            "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r border-neutral-200 dark:border-neutral-700",
            "bg-white dark:bg-neutral-900 transition-all duration-300 ease-in-out",
            "flex flex-col",
            isCollapsed ? "w-16" : "w-64"
        )}>
            {/* Nav Items */}
            <div className="flex-grow px-2 py-4">
                <SidebarItems isCollapsed={isCollapsed} />
            </div>
        </div>
    );
}
