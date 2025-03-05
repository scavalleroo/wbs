"use client";

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { DropdownMenuShortcut } from "@/components/ui/dropdown-menu";

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/dashboard/signin');
    }

    return (
        <div
            onClick={handleSignOut}
            className="flex justify-between items-center w-full cursor-pointer"
        >
            Sign Out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </div>
    );
}